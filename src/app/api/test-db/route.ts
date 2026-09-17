import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ status: "error", message: "Supabase client unconfigured" }, { status: 503 });
  }

  const { count: grievancesCount } = await supabase.from("grievances").select("*", { count: "exact", head: true });
  const { count: auditCount } = await supabase.from("audit_logs").select("*", { count: "exact", head: true });

  return NextResponse.json({
    status: "connected",
    grievances_count: grievancesCount || 0,
    audit_logs_count: auditCount || 0,
  });
}
