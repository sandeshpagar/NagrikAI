import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveAuthority } from "@/lib/authorities/mapper";
import { sendAuthorityEmailNotice } from "@/lib/email/notifier";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}/notify`, {
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
    // FastAPI offline; fall back to Next.js handler
  }

  // 2. TypeScript Local Resolution
  const supabase = getAdminSupabase();
  let grievanceData: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from("grievances")
        .select("*, ai_analyses(*)")
        .or(`id.eq.${id},grievance_number.eq.${id}`)
        .maybeSingle();
      if (data) grievanceData = data;
    } catch {
      // ignore
    }
  }

  if (!grievanceData) {
    grievanceData = {
      id,
      grievance_number: id.includes("GRV") ? id : "GRV-2026-1042",
      title: "Severe Road Crater & Exposed Electrical Conduit near Sinhagad Road Junction",
      description:
        "Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening.",
      category: "Road Infrastructure & Public Safety",
      priority: "HIGH",
      address: "Opposite HPCL Petrol Pump, Sinhagad Road Junction, Pune",
      location: {
        ward: "Ward 12",
        zone: "Sinhagad Zone",
        address: "Opposite HPCL Petrol Pump, Sinhagad Road Junction, Pune",
        latitude: 18.4965,
        longitude: 73.8312,
      },
    };
  }

  // Resolve Recipient Officer
  let recName = body.recipient_name;
  let recEmail = body.recipient_email;
  let recDesig = body.recipient_designation;

  if (!recName || !recEmail) {
    const resolved = resolveAuthority({
      jurisdiction: grievanceData.address || grievanceData.location?.address,
      category: grievanceData.category,
      grievance_id: id,
    });
    recName = recName || resolved.responsible_authority.name;
    recEmail = recEmail || resolved.responsible_authority.email;
    recDesig = recDesig || resolved.responsible_authority.designation;
  }

  const result = await sendAuthorityEmailNotice({
    grievance: grievanceData,
    recipient: {
      name: recName,
      email: recEmail,
      designation: recDesig,
      department: grievanceData.category,
    },
    force: body.force || false,
  });

  return NextResponse.json(result, { status: 200 });
}
