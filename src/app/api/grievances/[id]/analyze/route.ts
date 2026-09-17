import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { analyzeGrievanceText } from "@/lib/ai/analyzer";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Attempt FastAPI backend first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI not available; proceed to fullstack TypeScript AI analysis
  }

  // 2. Direct Fullstack Supabase Execution
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database service unavailable for AI analysis" },
      { status: 503 }
    );
  }

  try {
    // Look up grievance
    let grievance: any = null;
    const { data: byId } = await supabase
      .from("grievances")
      .select("*, evidence(*)")
      .eq("id", id)
      .maybeSingle();

    if (byId) {
      grievance = byId;
    } else {
      const { data: byNum } = await supabase
        .from("grievances")
        .select("*, evidence(*)")
        .eq("grievance_number", id)
        .maybeSingle();
      grievance = byNum;
    }

    if (!grievance) {
      return NextResponse.json({ error: `Grievance not found: ${id}` }, { status: 404 });
    }

    const actualGrievanceId = grievance.id;
    const fullText = `${grievance.title}. ${grievance.description}`;
    const primaryEvidence = grievance.evidence?.[0] || {};

    // 3. Run AI analysis
    const analysis = await analyzeGrievanceText(fullText, {
      language: grievance.language || "English",
      location: {
        ward: grievance.address?.split(",")?.pop()?.trim() || "Ward 12",
        address: grievance.address || "Pune",
        lat: Number(grievance.latitude) || 18.4965,
        lng: Number(grievance.longitude) || 73.8312,
      },
      evidenceStatus: primaryEvidence.verification_status,
      evidenceRisk: primaryEvidence.risk_score,
    });

    // 4. Persist to public.ai_analyses
    const aiRecord = {
      grievance_id: actualGrievanceId,
      model_name: analysis.model_name,
      category: analysis.category,
      subcategory: analysis.subcategory,
      severity_score: analysis.severity_score,
      severity_description: `${analysis.priority} priority municipal risk index (${analysis.severity_score}/10.0)`,
      summary: analysis.summary,
      affected_population_estimate: `~${analysis.affected_population.toLocaleString()} residents`,
      duration_text: analysis.duration,
      jurisdiction_text: analysis.jurisdiction,
      priority: analysis.priority,
      entities: analysis.entities,
      recommended_action: analysis.recommended_action,
      recommendation_rationale: analysis.recommendation_rationale,
      confidence: analysis.confidence,
      raw_output: analysis,
    };

    const { data: insertedAnalysis, error: aiErr } = await supabase
      .from("ai_analyses")
      .insert(aiRecord)
      .select("*")
      .maybeSingle();

    if (aiErr) {
      console.warn("Could not insert to ai_analyses table (check permissions/schema):", aiErr.message);
    }

    // 5. Update grievance metadata
    const updatePayload: any = {
      category: analysis.category,
      subcategory: analysis.subcategory,
      priority: analysis.priority,
      affected_population: analysis.affected_population,
      duration_text: analysis.duration,
    };
    if (grievance.status === "SUBMITTED" || grievance.status === "AI_ANALYZING") {
      updatePayload.status = "ASSIGNED";
    }

    await supabase
      .from("grievances")
      .update(updatePayload)
      .eq("id", actualGrievanceId);

    // 6. Record immutable audit log
    await supabase.from("audit_logs").insert({
      grievance_id: actualGrievanceId,
      action: "AI_ANALYSIS_COMPLETED",
      actor_role: "SYSTEM_ADMIN",
      actor_id: body.actor_id || null,
      description: `AI analysis completed via ${analysis.model_name}. Classified as '${analysis.category}' with ${analysis.priority} priority (Confidence: ${analysis.confidence}%).`,
      metadata: {
        model: analysis.model_name,
        confidence: analysis.confidence,
        priority: analysis.priority,
        category: analysis.category,
        is_fallback: analysis.is_fallback,
      },
    });

    return NextResponse.json({
      success: true,
      grievance_id: actualGrievanceId,
      analysis,
      persisted_record: insertedAnalysis || aiRecord,
    });
  } catch (err: any) {
    console.error("AI Analysis route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute AI analysis" },
      { status: 500 }
    );
  }
}
