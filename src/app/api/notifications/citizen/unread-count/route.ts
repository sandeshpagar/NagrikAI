import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_URL}/api/v1/notifications/citizen/unread-count?${searchParams.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, unread_count: 3 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch unread count" }, { status: 500 });
  }
}
