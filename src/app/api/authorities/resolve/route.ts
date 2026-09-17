import { NextRequest, NextResponse } from "next/server";
import { resolveAuthority } from "@/lib/authorities/mapper";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Attempt FastAPI backend first if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/authorities/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data, { status: 200 });
    }
  } catch {
    // FastAPI offline or timed out; fall back to TypeScript engine
  }

  // 2. TypeScript Local Resolution
  try {
    const result = resolveAuthority({
      jurisdiction: body.jurisdiction,
      category: body.category,
      department: body.department,
      grievance_id: body.grievance_id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Authority resolution error:", err);
    return NextResponse.json(
      { error: "Failed to resolve authority", detail: err?.message },
      { status: 500 }
    );
  }
}
