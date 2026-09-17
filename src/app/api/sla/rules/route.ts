import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/sla/rules`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback offline mock rules
  }

  return NextResponse.json({
    success: true,
    total: 5,
    rules: [
      {
        rule_id: "SLA-PMC-CIVIL-CRITICAL",
        department_code: "PMC-CIVIL",
        category: "Road Infrastructure",
        priority: "CRITICAL",
        acknowledgement_hours: 2,
        resolution_hours: 12,
        reminder_before_hours: 2,
        is_active: true,
        description: "Emergency road cave-in, deep pothole arterial hazard."
      },
      {
        rule_id: "SLA-PMC-CIVIL-HIGH",
        department_code: "PMC-CIVIL",
        category: "Road Infrastructure",
        priority: "HIGH",
        acknowledgement_hours: 4,
        resolution_hours: 24,
        reminder_before_hours: 4,
        is_active: true,
        description: "Major pothole on bus routes, damaged stormwater drain lid."
      },
      {
        rule_id: "SLA-PMC-WATER-CRITICAL",
        department_code: "PMC-WATER",
        category: "Water Supply",
        priority: "CRITICAL",
        acknowledgement_hours: 1,
        resolution_hours: 6,
        reminder_before_hours: 1,
        is_active: true,
        description: "Sewage overflow into drinking water pipeline."
      },
      {
        rule_id: "SLA-PMC-SOLID-HIGH",
        department_code: "PMC-SOLID",
        category: "Solid Waste Management",
        priority: "HIGH",
        acknowledgement_hours: 2,
        resolution_hours: 12,
        reminder_before_hours: 2,
        is_active: true,
        description: "Public health bio-waste dump or open burning."
      },
      {
        rule_id: "SLA-PMC-APEX-FALLBACK",
        department_code: null,
        category: null,
        priority: null,
        acknowledgement_hours: 12,
        resolution_hours: 48,
        reminder_before_hours: 6,
        is_active: true,
        description: "Maharashtra RTSA 2015 statutory standard baseline."
      }
    ]
  });
}
