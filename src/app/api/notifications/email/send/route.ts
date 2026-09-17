import { NextRequest, NextResponse } from "next/server";
import { sendAuthorityEmailNotice } from "@/lib/email/notifier";

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

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/notifications/email/send`, {
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
    // FastAPI offline or timed out; fall back to local TypeScript engine
  }

  // 2. TypeScript Local Resolution
  try {
    const recipient = {
      name: body.recipient_name || "Er. Rajesh Sharma",
      email: body.recipient_email || "rajesh.sharma@pmc.gov.in",
      designation: body.recipient_designation,
      department: body.recipient_department,
    };

    const result = await sendAuthorityEmailNotice({
      grievance: body.grievance || {},
      recipient,
      force: body.force || false,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Direct email dispatch error:", err);
    return NextResponse.json(
      { error: "Email dispatch failed", detail: err?.message },
      { status: 500 }
    );
  }
}
