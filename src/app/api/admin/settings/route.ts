import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        platform_name: "NagrikAI Pune Civic Platform",
        environment: "Production-Simulated",
        ai_primary_model: "gemini-2.5-flash",
        autonomous_agent_interval_seconds: 300,
        statutory_rtsa_strict_mode: true,
        telephony_voice_agent_enabled: false,
        citizen_notifications_enabled: true,
        maintenance_mode: false,
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin settings GET proxy error:", err);
    return NextResponse.json({
      platform_name: "NagrikAI Pune Civic Platform",
      environment: "Production-Simulated",
      ai_primary_model: "gemini-2.5-flash",
      autonomous_agent_interval_seconds: 300,
      statutory_rtsa_strict_mode: true,
      telephony_voice_agent_enabled: false,
      citizen_notifications_enabled: true,
      maintenance_mode: false,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin settings PATCH proxy error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
