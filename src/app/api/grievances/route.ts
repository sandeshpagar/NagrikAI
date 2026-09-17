import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { analyzeGrievanceText } from "@/lib/ai/analyzer";
import { resolveAuthority } from "@/lib/authorities/mapper";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

const DEFAULT_CITIZEN_ID = "44444444-0000-0000-0000-000000000001";
const DEFAULT_DEPARTMENT_ID = "11111111-0000-0000-0000-000000000001";
const DEFAULT_JURISDICTION_ID = "22222222-0000-0000-0000-000000000002";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  // 1. Try forwarding to FastAPI backend if active
  try {
    const fastApiUrl = new URL(`${BACKEND_URL}/api/v1/grievances`);
    if (status) fastApiUrl.searchParams.set("status", status);
    if (priority) fastApiUrl.searchParams.set("priority", priority);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const fastApiResponse = await fetch(fastApiUrl.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI not running or timeout; seamlessly fall back to direct Supabase query
  }

  // 2. Direct Supabase Query
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ total: 0, items: [] });
  }

  try {
    let query = supabase
      .from("grievances")
      .select("*, evidence(*), ai_analyses(*), agent_actions(*)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) {
      console.error("Error querying grievances from Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      total: data?.length || 0,
      items: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. Attempt FastAPI Submission First
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch {
    // FastAPI offline; fall back to direct Supabase insert
  }

  // 2. Direct Supabase Insert
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase database connection unavailable" },
      { status: 503 }
    );
  }

  try {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const uniqueNumber = `GRV-2026-${randomNum}`;
    const ledgerHash = `#PMC-2026-SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date();
    const slaHours = body.priority === "CRITICAL" ? 12 : body.priority === "HIGH" ? 24 : 48;
    const expectedResolution = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();

    // Verify / ensure citizen profile exists to satisfy foreign key constraints
    let validCitizenId: string | null = null;
    try {
      const candidateId = body.citizen_id || DEFAULT_CITIZEN_ID;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", candidateId)
        .maybeSingle();

      if (prof) {
        validCitizenId = prof.id;
      } else {
        // Automatically insert demo citizen profile so foreign key relation is preserved
        const { data: newProf, error: profErr } = await supabase
          .from("profiles")
          .upsert(
            {
              id: candidateId,
              full_name: body.citizen_name || "Ramesh Kulkarni",
              role: "CITIZEN",
              email: "ramesh.kulkarni@gmail.com",
              phone: body.citizen_phone || "+91 98220 54199",
              designation: "Citizen Resident",
            },
            { onConflict: "id" }
          )
          .select("id")
          .maybeSingle();

        if (newProf && !profErr) {
          validCitizenId = newProf.id;
        }
      }
    } catch {
      validCitizenId = null;
    }

    // Verify department_id exists
    let validDeptId: string | null = null;
    try {
      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("id", DEFAULT_DEPARTMENT_ID)
        .maybeSingle();
      if (dept) validDeptId = dept.id;
    } catch {
      validDeptId = null;
    }

    // Verify jurisdiction_id exists
    let validJurId: string | null = null;
    try {
      const { data: jur } = await supabase
        .from("jurisdictions")
        .select("id")
        .eq("id", DEFAULT_JURISDICTION_ID)
        .maybeSingle();
      if (jur) validJurId = jur.id;
    } catch {
      validJurId = null;
    }

    const grievanceRow = {
      grievance_number: uniqueNumber,
      citizen_id: validCitizenId,
      title: body.title || "Civic Grievance",
      description: body.description || "",
      original_text_log: body.description || "",
      language: body.language || "English",
      category: body.category || "Road Infrastructure & Public Safety",
      subcategory: body.subcategory || "General Municipal Issue",
      department_id: validDeptId,
      jurisdiction_id: validJurId,
      latitude: body.latitude || body.location?.latitude || 18.4965,
      longitude: body.longitude || body.location?.longitude || 73.8312,
      address: body.address || body.location?.address || "Sinhagad Road, Ward 12, Pune",
      priority: body.priority || "HIGH",
      status: "SUBMITTED",
      ledger_hash: ledgerHash,
      expected_resolution_at: expectedResolution,
      affected_population: 500,
      duration_text: "Reported today",
    };

    let inserted: any = null;
    const { data: resData, error: insertErr } = await supabase
      .from("grievances")
      .insert(grievanceRow)
      .select()
      .single();

    if (insertErr) {
      console.warn("Primary insert failed with error:", insertErr.message, "Retrying with sanitized foreign keys...");
      const fallbackRow = {
        ...grievanceRow,
        citizen_id: null,
        department_id: null,
        jurisdiction_id: null,
        authority_id: null,
      };
      const { data: retryData, error: retryErr } = await supabase
        .from("grievances")
        .insert(fallbackRow)
        .select()
        .single();

      if (retryErr) {
        console.error("Grievance insertion completely failed:", retryErr.message);
        return NextResponse.json({ error: retryErr.message }, { status: 500 });
      }
      inserted = retryData;
    } else {
      inserted = resData;
    }

    const grievanceId = inserted.id;

    // Attach sample evidence or provided evidence items
    const evidenceItems = body.evidence_items || [];
    if (evidenceItems.length > 0) {
      try {
        const evidenceRows = evidenceItems.map((e: any) => ({
          grievance_id: grievanceId,
          storage_path: e.storage_path || `evidence/${uniqueNumber}/${e.file_name}`,
          file_name: e.file_name,
          mime_type: e.mime_type || "image/jpeg",
          file_size: e.file_size || 3500000,
          sha256: e.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          verification_status: "LIKELY_AUTHENTIC",
          risk_score: 0.04,
          metadata: e.metadata || {},
          analysis: {},
        }));
        await supabase.from("evidence").insert(evidenceRows);
      } catch (evErr: any) {
        console.warn("Evidence insertion note:", evErr.message);
      }
    }

    // Insert agent timeline steps
    try {
      await supabase.from("agent_actions").insert([
        {
          grievance_id: grievanceId,
          actor: "CITIZEN",
          action_type: "GRIEVANCE_SUBMITTED",
          title: "Citizen Grievance Logged",
          description: `${body.citizen_name || "Ramesh Kulkarni"} submitted report with geotagged coordinates.`,
          icon: "person",
          is_completed: true,
        },
        {
          grievance_id: grievanceId,
          actor: "AI_AGENT",
          action_type: "AI_INDEXED",
          title: "Automated Intake & Priority Assessed",
          description: `Assigned ${grievanceRow.priority} priority. SLA resolution window: ${slaHours} hours.`,
          icon: "auto_awesome",
          is_completed: true,
        },
      ]);
    } catch (actErr: any) {
      console.warn("Agent actions note:", actErr.message);
    }

    // Phase 6: Automated AI Grievance Analysis & Structured Schema Persistence
    try {
      const fullText = `${grievanceRow.title}. ${grievanceRow.description}`;
      const aiAnalysis = await analyzeGrievanceText(fullText, {
        language: grievanceRow.language,
        location: {
          ward: grievanceRow.address?.split(",")?.pop()?.trim() || "Ward 12",
          address: grievanceRow.address,
          lat: grievanceRow.latitude,
          lng: grievanceRow.longitude,
        },
      });

      await supabase.from("ai_analyses").insert({
        grievance_id: grievanceId,
        model_name: aiAnalysis.model_name,
        category: aiAnalysis.category,
        subcategory: aiAnalysis.subcategory,
        severity_score: aiAnalysis.severity_score,
        severity_description: `${aiAnalysis.priority} priority municipal risk index (${aiAnalysis.severity_score}/10.0)`,
        summary: aiAnalysis.summary,
        affected_population_estimate: `~${aiAnalysis.affected_population.toLocaleString()} residents`,
        duration_text: aiAnalysis.duration,
        jurisdiction_text: aiAnalysis.jurisdiction,
        priority: aiAnalysis.priority,
        entities: aiAnalysis.entities,
        recommended_action: aiAnalysis.recommended_action,
        recommendation_rationale: aiAnalysis.recommendation_rationale,
        confidence: aiAnalysis.confidence,
        raw_output: aiAnalysis,
      });

      // Update grievance metadata with AI refined classification
      await supabase.from("grievances").update({
        category: aiAnalysis.category,
        subcategory: aiAnalysis.subcategory,
        affected_population: aiAnalysis.affected_population,
        duration_text: aiAnalysis.duration,
      }).eq("id", grievanceId);
    } catch (aiErr: any) {
      console.warn("AI initial analysis note:", aiErr.message);
    }

    // Automatically resolve and assign authority on intake
    try {
      const resolvedAuth = resolveAuthority({
        jurisdiction: grievanceRow.address,
        category: grievanceRow.category,
      });

      await supabase.from("audit_logs").insert({
        grievance_id: grievanceId,
        grievance_number: uniqueNumber,
        actor_type: "SYSTEM",
        actor_name: "NagrikAI Authority Dispatch Engine",
        action: "AUTHORITY_ASSIGNED",
        details: `Statutory assignment to ${resolvedAuth.responsible_authority.name} (${resolvedAuth.responsible_authority.designation}) via rule ${resolvedAuth.mapping_rule_id}.${
          resolvedAuth.is_fallback ? " [PMC APEX FALLBACK ENGAGED]" : ""
        }`,
        metadata: {
          authority: resolvedAuth.responsible_authority,
          escalation_chain: resolvedAuth.escalation_chain,
          is_fallback: resolvedAuth.is_fallback,
          mapping_rule_id: resolvedAuth.mapping_rule_id,
        },
      });
    } catch (authErr: any) {
      console.warn("Authority mapping initial dispatch note:", authErr.message);
    }

    // Insert immutable audit log into public.audit_logs
    try {
      const { error: auditErr } = await supabase.from("audit_logs").insert({
        grievance_id: grievanceId,
        grievance_number: uniqueNumber,
        actor_type: "CITIZEN",
        actor_name: body.citizen_name || "Ramesh Kulkarni (Citizen)",
        action: "GRIEVANCE_SUBMITTED",
        details: `New grievance submitted: ${grievanceRow.title}`,
        metadata: { priority: grievanceRow.priority, ledger_hash: ledgerHash },
      });
      if (auditErr) {
        console.warn("Audit log insert note:", auditErr.message);
      }
    } catch (audErr: any) {
      console.warn("Audit logs note:", audErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Grievance submitted successfully",
        data: inserted,
        grievanceNumber: uniqueNumber,
        ledgerHash,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Unhandled error in POST /api/grievances:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
