import { NextRequest, NextResponse } from "next/server";
import { analyzeGrievanceText } from "@/lib/ai/analyzer";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.complaint_text || body.description || "";

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Complaint text must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Try FastAPI first if available
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_text: text,
          language: body.language || "English",
          location: body.location || {},
          evidence_analysis: body.evidence_analysis || {},
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (fastApiResponse.ok) {
        const data = await fastApiResponse.json();
        return NextResponse.json(data);
      }
    } catch {
      // FastAPI offline; fall back to local TypeScript analyzer
    }

    // Direct TypeScript Civic Analyzer execution
    const result = await analyzeGrievanceText(text, {
      language: body.language || "English",
      location: body.location || {},
      evidenceStatus: body.evidence_analysis?.verification_status,
      evidenceRisk: body.evidence_analysis?.risk_score,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "AI Analysis failed" },
      { status: 500 }
    );
  }
}
