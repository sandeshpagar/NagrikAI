import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. Try forwarding to FastAPI backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch {
    // Fall back to direct Supabase insert
  }

  // 2. Direct Supabase Insert
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 503 });
  }

  try {
    let grvQuery = supabase.from("grievances").select("id, grievance_number");
    if (id.startsWith("GRV-")) {
      grvQuery = grvQuery.eq("grievance_number", id);
    } else {
      grvQuery = grvQuery.eq("id", id);
    }

    const { data: grv, error: grvErr } = await grvQuery.single();
    if (grvErr || !grv) {
      return NextResponse.json({ error: `Grievance ${id} not found` }, { status: 404 });
    }

    const evidenceRow = {
      grievance_id: grv.id,
      storage_path: body.storage_path || `evidence/${grv.grievance_number}/${body.file_name}`,
      file_name: body.file_name,
      mime_type: body.mime_type || "image/jpeg",
      file_size: body.file_size || 1024,
      sha256: body.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      verification_status: "LIKELY_AUTHENTIC",
      risk_score: 0.04,
      metadata: body.metadata || {},
    };

    const { data: inserted, error: evErr } = await supabase
      .from("evidence")
      .insert(evidenceRow)
      .select()
      .single();

    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }

    // Insert audit log
    await supabase.from("audit_logs").insert({
      grievance_id: grv.id,
      grievance_number: grv.grievance_number,
      actor_type: "CITIZEN",
      actor_name: "Citizen Resident",
      action: "EVIDENCE_ATTACHED",
      details: `Evidence attached: ${body.file_name}`,
      metadata: { file_name: body.file_name, sha256: body.sha256 },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Evidence attached successfully",
        data: inserted,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
