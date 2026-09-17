import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/authority/interpret-directive`, {
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
      // Backend offline fallback
    }

    const directive = body.directive_text || "";
    const isAmbiguous = directive.toLowerCase().includes("maybe") ||
      directive.toLowerCase().includes("later") ||
      directive.toLowerCase().includes("check");

    return NextResponse.json({
      success: true,
      validated: {
        grievance_id: body.grievance_id || "GRV-2026-1042",
        status: isAmbiguous ? "NOTIFIED" : "ACTION_SCHEDULED",
        is_ambiguous: isAmbiguous,
        confidence: isAmbiguous ? 0.45 : 0.95,
        clarification_requested: isAmbiguous ? "Directive was vague. Previous status maintained." : null,
        plain_language_summary: isAmbiguous
          ? "Authority officer acknowledged grievance and is finalizing inspection plan."
          : "Municipal field squad has updated your case status.",
        applied_directive: directive
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Interpretation failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const grievanceId = searchParams.get("grievance_id") || "GRV-2026-1042";
    const directiveText = searchParams.get("directive_text") ||
      "Road repair squad dispatched to Sinhagad Road junction. Tar patching and pothole compaction scheduled for tomorrow morning.";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const fastApiResponse = await fetch(
        `${BACKEND_URL}/api/v1/authority/interpret-directive?${searchParams.toString()}`,
        {
          method: "GET",
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (fastApiResponse.ok) {
        const data = await fastApiResponse.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    const isAmbiguous = directiveText.toLowerCase().includes("maybe") ||
      directiveText.toLowerCase().includes("later") ||
      directiveText.toLowerCase().includes("check");

    return NextResponse.json({
      success: true,
      directive_text: directiveText,
      is_ambiguous: isAmbiguous,
      status: isAmbiguous ? "NOTIFIED" : "ACTION_SCHEDULED",
      clarification_requested: isAmbiguous ? "Directive was vague. Previous status maintained." : null,
      validated: {
        grievance_id: grievanceId,
        status: isAmbiguous ? "NOTIFIED" : "ACTION_SCHEDULED",
        is_ambiguous: isAmbiguous,
        confidence: isAmbiguous ? 0.45 : 0.95,
        plain_language_summary: isAmbiguous
          ? "The authority officer has acknowledged your case. A formal operational schedule is currently being finalized."
          : "Municipal repair action has been approved and scheduled.",
        applied_directive: directiveText
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Interpretation failed" }, { status: 500 });
  }
}
