import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_URL}/api/v1/notifications/citizen/${id}/read`, {
        method: "POST",
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

    return NextResponse.json({ success: true, notification_id: id, read: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark read" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({ success: true, notification_id: id, read: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark read" }, { status: 500 });
  }
}
