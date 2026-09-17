import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  generateCivicEmbedding,
  calculateCosineSimilarity,
  SimilarComplaintMatch,
} from "@/lib/embeddings/similarity";

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

  const minSimilarity = typeof body.min_similarity === "number" ? body.min_similarity : 0.35;
  const limit = typeof body.limit === "number" ? body.limit : 5;

  // 1. Attempt FastAPI backend first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}/similar`, {
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
    // FastAPI offline; fall back to TypeScript pgvector similarity search
  }

  // 2. Direct Supabase Query & Cosine Similarity Search
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database service unavailable for similarity search" },
      { status: 503 }
    );
  }

  try {
    // Fetch target grievance
    let targetG: any = null;
    const { data: byId } = await supabase
      .from("grievances")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (byId) {
      targetG = byId;
    } else {
      const { data: byNum } = await supabase
        .from("grievances")
        .select("*")
        .eq("grievance_number", id)
        .maybeSingle();
      targetG = byNum;
    }

    if (!targetG) {
      return NextResponse.json({ error: `Grievance not found: ${id}` }, { status: 404 });
    }

    const actualId = targetG.id;
    const targetText = `${targetG.title}. ${targetG.description}. ${targetG.category} ${targetG.address}`;
    const targetVec = generateCivicEmbedding(targetText);

    // Save/upsert target embedding to public.complaint_embeddings
    try {
      await supabase.from("complaint_embeddings").upsert(
        {
          grievance_id: actualId,
          embedding: targetVec,
          model_name: "nagrikai-civic-embed-768",
        },
        { onConflict: "grievance_id" }
      );
    } catch (e: any) {
      console.warn("Embedding cache note:", e.message);
    }

    // Fetch other grievances
    const { data: candidates, error: candErr } = await supabase
      .from("grievances")
      .select("*")
      .neq("id", actualId)
      .limit(50);

    if (candErr) {
      return NextResponse.json({ error: candErr.message }, { status: 500 });
    }

    const matches: SimilarComplaintMatch[] = [];

    for (const cand of candidates || []) {
      const candText = `${cand.title}. ${cand.description}. ${cand.category} ${cand.address}`;
      const candVec = generateCivicEmbedding(candText);
      const sim = calculateCosineSimilarity(targetVec, candVec);

      if (sim >= minSimilarity) {
        matches.push({
          id: cand.id,
          grievance_number: cand.grievance_number || "GRV-XXXX",
          title: cand.title,
          category: cand.category,
          priority: cand.priority || "MEDIUM",
          status: cand.status || "SUBMITTED",
          ward: cand.address || "Pune",
          reported_at: cand.created_at,
          similarity: Number(sim.toFixed(4)),
          similarity_score: Number((sim * 100).toFixed(1)),
          is_duplicate_candidate: sim >= 0.80,
        });
      }
    }

    // Sort descending by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, limit);

    // Log immutable audit record
    try {
      await supabase.from("audit_logs").insert({
        grievance_id: actualId,
        action: "SIMILARITY_SCANNED",
        actor_role: "OFFICER",
        actor_id: body.actor_id || null,
        description: `Vector similarity scan executed across ${candidates?.length || 0} complaints. Found ${topMatches.length} matching cases.`,
        metadata: {
          model: "nagrikai-civic-embed-768",
          matches_count: topMatches.length,
          top_similarity: topMatches[0]?.similarity_score || 0,
        },
      });
    } catch (audErr: any) {
      console.warn("Audit note:", audErr.message);
    }

    return NextResponse.json({
      grievance_id: actualId,
      grievance_number: targetG.grievance_number,
      model_name: "nagrikai-civic-embed-768",
      total_candidates_analyzed: candidates?.length || 0,
      similar_complaints: topMatches,
      guardrail_notice: "Complaints are never automatically merged. Similarity scores are presented for administrative assessment.",
    });
  } catch (err: any) {
    console.error("Similarity route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute similarity search" },
      { status: 500 }
    );
  }
}
