import { NextResponse } from "next/server";
import { PMC_AUTHORITY_MAPPINGS, FALLBACK_AUTHORITY_RESOLUTION } from "@/lib/authorities/mapper";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET() {
  // 1. Try FastAPI backend if active
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/authorities/mappings`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data, { status: 200 });
    }
  } catch {
    // FastAPI offline; fall back to local seed data
  }

  // 2. TypeScript Local Mappings
  return NextResponse.json(
    {
      total_rules: PMC_AUTHORITY_MAPPINGS.length,
      mappings: PMC_AUTHORITY_MAPPINGS.map((m) => ({
        rule_id: m.rule_id,
        department_code: m.department_code,
        department_name: m.department_name,
        jurisdiction_name: m.jurisdiction_name,
        jurisdiction_keywords: m.jurisdiction_keywords,
        category_keywords: m.category_keywords,
        responsible_authority: m.responsible_authority,
        escalation_tiers_count: m.escalation_chain.length,
      })),
      fallback_authority: FALLBACK_AUTHORITY_RESOLUTION.responsible_authority,
    },
    { status: 200 }
  );
}
