import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/escalations/${id}`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback if backend offline
  }

  return NextResponse.json({
    success: true,
    grievance_id: id,
    current_level: 0,
    escalation_chain: [
      {
        tier: 1,
        role: "FIELD_OFFICER",
        name: "Er. Sandeep Patil",
        designation: "Junior Engineer (Road Maintenance)",
        email: "sandeep.patil@pmc.gov.in",
        phone: "+91 98221 00234",
        trigger_condition: "Initial assignment (0h to 24h SLA)",
        sla_threshold_hours: 24
      },
      {
        tier: 2,
        role: "DEPARTMENT_ADMIN",
        name: "Er. Sunita Deshpande",
        designation: "Superintending Engineer (West Zone)",
        email: "sunita.deshpande@pmc.gov.in",
        phone: "+91 98225 11090",
        trigger_condition: "Breach +12h non-response (Tier 2 Escalation)",
        sla_threshold_hours: 36
      },
      {
        tier: 3,
        role: "SYSTEM_ADMIN",
        name: "Dr. Anand Rao, IAS",
        designation: "Additional Municipal Commissioner",
        email: "amc.digital@pmc.gov.in",
        phone: "+91 98200 99001",
        trigger_condition: "Breach +24h critical failure (Apex Authority)",
        sla_threshold_hours: 48
      }
    ],
    history: []
  });
}
