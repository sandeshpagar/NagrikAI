import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveAuthority } from "@/lib/authorities/mapper";

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

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/grievances/${id}/assign`, {
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
    // FastAPI offline or timed out; fall back to direct Supabase update
  }

  // 2. TypeScript Local Resolution & Supabase persistence
  const supabase = getAdminSupabase();

  // If jurisdiction/category not in body, try to fetch grievance details from Supabase
  let jurisdiction = body.jurisdiction;
  let category = body.category;
  let grievanceNumber = body.grievance_number || id;

  if (supabase && (!jurisdiction || !category)) {
    try {
      const { data: grv } = await supabase
        .from("grievances")
        .select("grievance_number, address, category, title")
        .or(`id.eq.${id},grievance_number.eq.${id}`)
        .maybeSingle();

      if (grv) {
        jurisdiction = jurisdiction || grv.address;
        category = category || grv.category;
        grievanceNumber = grv.grievance_number || grievanceNumber;
      }
    } catch {
      // ignore
    }
  }

  const resolved = resolveAuthority({
    jurisdiction,
    category,
    department: body.department,
    grievance_id: id,
  });

  if (supabase) {
    try {
      // Update grievance record
      await supabase
        .from("grievances")
        .update({
          authority_id: resolved.responsible_authority.id,
          status: "ASSIGNED",
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},grievance_number.eq.${id}`);

      // Insert audit log
      await supabase.from("audit_logs").insert({
        grievance_number: grievanceNumber,
        actor_type: "SYSTEM",
        actor_name: "NagrikAI Authority Dispatch Engine",
        action: "AUTHORITY_ASSIGNED",
        details: `Assigned grievance to ${resolved.responsible_authority.name} (${resolved.responsible_authority.designation}) via rule ${resolved.mapping_rule_id}.${
          resolved.is_fallback ? " [PMC APEX FALLBACK ENGAGED]" : ""
        }`,
        metadata: {
          authority: resolved.responsible_authority,
          escalation_chain: resolved.escalation_chain,
          is_fallback: resolved.is_fallback,
          mapping_rule_id: resolved.mapping_rule_id,
        },
      });
    } catch (e: any) {
      console.warn("Supabase persistence note during authority assignment:", e.message);
    }
  }

  return NextResponse.json({
    grievance_id: id,
    assigned: true,
    responsible_authority: resolved.responsible_authority,
    escalation_chain: resolved.escalation_chain,
    is_fallback: resolved.is_fallback,
    mapping_rule_id: resolved.mapping_rule_id,
    timestamp: new Date().toISOString(),
  });
}
