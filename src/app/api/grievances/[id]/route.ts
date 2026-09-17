import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = params;

  // 1. Try forwarding to FastAPI backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fall back to direct Supabase query
  }

  // 2. Direct Supabase Query
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 503 });
  }

  try {
    let query = supabase
      .from("grievances")
      .select("*, evidence(*), ai_analyses(*), agent_actions(*)");

    if (id.startsWith("GRV-")) {
      query = query.eq("grievance_number", id);
    } else {
      query = query.eq("id", id);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return NextResponse.json({ error: `Grievance ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}`, {
      method: "PATCH",
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
    // Fall back to direct Supabase update
  }

  // 2. Direct Supabase Update
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 503 });
  }

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.authority_directive) updateData.authority_directive = body.authority_directive;

    let query = supabase.from("grievances").update(updateData);
    if (id.startsWith("GRV-")) {
      query = query.eq("grievance_number", id);
    } else {
      query = query.eq("id", id);
    }

    const { data, error } = await query.select().single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Grievance not found" }, { status: 404 });
    }

    // Log audit trail
    if (body.status) {
      await supabase.from("audit_logs").insert({
        grievance_id: data.id,
        grievance_number: data.grievance_number,
        actor_type: "OFFICER",
        actor_name: "Er. Rajesh Sharma (Officer)",
        action: "STATUS_UPDATED",
        details: `Status shifted to ${body.status}`,
        metadata: { new_status: body.status },
      });
    }

    if (body.authority_directive) {
      await supabase.from("audit_logs").insert({
        grievance_id: data.id,
        grievance_number: data.grievance_number,
        actor_type: "OFFICER",
        actor_name: "Er. Rajesh Sharma (Executive Engineer)",
        action: "AUTHORITY_DIRECTIVE_LOGGED",
        details: body.authority_directive.directiveText || "Officer directive recorded",
        metadata: body.authority_directive,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Grievance updated successfully",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
