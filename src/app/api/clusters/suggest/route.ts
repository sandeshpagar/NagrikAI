import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  generateCivicEmbedding,
  calculateCosineSimilarity,
} from "@/lib/embeddings/similarity";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const threshold = typeof body.threshold === "number" ? body.threshold : 0.75;

  // 1. Try FastAPI backend first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/clusters/suggest`, {
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
    // FastAPI offline; proceed with Supabase fullstack clustering
  }

  // 2. Suggest clusters via Supabase
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database unavailable for cluster suggestion" },
      { status: 503 }
    );
  }

  try {
    const { data: grievances, error: grvErr } = await supabase
      .from("grievances")
      .select("id, grievance_number, title, description, category, address")
      .limit(60);

    if (grvErr) {
      return NextResponse.json({ error: grvErr.message }, { status: 500 });
    }

    const items = grievances || [];
    if (items.length < 2) {
      return NextResponse.json({
        total_suggestions: 0,
        suggested_clusters: [],
        message: "Insufficient complaints to form clusters.",
      });
    }

    // Compute embeddings for each candidate
    const itemVecs = new Map<string, number[]>();
    for (const item of items) {
      const t = `${item.title}. ${item.description}. ${item.category} ${item.address}`;
      itemVecs.set(item.id, generateCivicEmbedding(t));
    }

    const visited = new Set<string>();
    const suggested: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const g1 = items[i];
      if (visited.has(g1.id)) continue;

      const clusterMembers = [g1];
      const vec1 = itemVecs.get(g1.id)!;

      for (let j = 0; j < items.length; j++) {
        const g2 = items[j];
        if (g1.id === g2.id || visited.has(g2.id)) continue;

        const vec2 = itemVecs.get(g2.id)!;
        const sim = calculateCosineSimilarity(vec1, vec2);
        if (sim >= threshold) {
          clusterMembers.push(g2);
          visited.add(g2.id);
        }
      }

      if (clusterMembers.length > 1) {
        visited.add(g1.id);
        const first = clusterMembers[0];
        const wardLabel = first.address?.split(",")?.pop()?.trim() || "Municipal Area";
        const clusterName = `${first.category || "Municipal"} Group (${wardLabel})`;

        suggested.push({
          cluster_name: clusterName,
          category: first.category || "General",
          member_count: clusterMembers.length,
          members: clusterMembers.map((m) => ({
            id: m.id,
            grievance_number: m.grievance_number,
            title: m.title,
            address: m.address,
          })),
          recommendation: "Link related cases into single municipal intervention dispatch without deleting individual records.",
        });
      }
    }

    return NextResponse.json({
      total_suggestions: suggested.length,
      suggested_clusters: suggested,
      threshold_used: threshold,
      model_name: "nagrikai-civic-embed-768",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
