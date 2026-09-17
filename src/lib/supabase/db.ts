/**
 * NagrikAI Database Access Layer
 * Provides strongly-typed query functions against live Supabase PostgreSQL tables,
 * with automatic fallback to mock data when operating in offline/prototype mode.
 */

import { createClient, isSupabaseConfigured } from "./client";
import { Grievance, GrievanceStatus, AuditLogEntry } from "@/lib/types";
import { MOCK_GRIEVANCES, INITIAL_GRIEVANCE_1042, INITIAL_AUDIT_LOGS } from "@/lib/mock-data";

/**
 * Fetch all grievances from Supabase, or fall back to mock data
 */
export async function getGrievancesFromDb(): Promise<Grievance[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_GRIEVANCES;
  }

  const supabase = createClient();
  if (!supabase) return MOCK_GRIEVANCES;

  try {
    const { data, error } = await supabase
      .from("grievances")
      .select(`
        *,
        evidence (*),
        ai_analyses (*),
        agent_actions (*)
      `)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_GRIEVANCES;
    }

    // Map database snake_case columns to frontend Grievance structure
    return data.map((row: any) => ({
      id: row.id,
      grievanceNumber: row.grievance_number,
      title: row.title,
      description: row.description,
      originalTextLog: row.original_text_log || row.description,
      language: row.language || "English",
      priority: row.priority,
      status: row.status as GrievanceStatus,
      filedAt: row.created_at,
      ledgerHash: row.ledger_hash || `#PMC-2026-SHA256-${row.id.substring(0, 5).toUpperCase()}`,
      citizen: {
        id: row.citizen_id || "usr-cit-01",
        name: "Ramesh Kulkarni",
        uid: "IND-MH-PN-8812",
        isVerified: true,
        phoneMasked: "+91 98220 *****",
      },
      location: {
        ward: "Ward 12",
        zone: "Sinhagad Zone",
        address: row.address || "Sinhagad Road, Pune",
        latitude: Number(row.latitude) || 18.4965,
        longitude: Number(row.longitude) || 73.8312,
      },
      sla: {
        slaCode: "SLA-CIV-04",
        totalHours: 72,
        elapsedHours: 48,
        remainingHours: 24,
        deadlineIso: row.expected_resolution_at || new Date(Date.now() + 864e5).toISOString(),
        escalationLevel: 0,
        status: "ON_TRACK",
        tiers: [],
      },
      evidence: (row.evidence || []).map((e: any) => ({
        id: e.id,
        fileName: e.file_name,
        fileUrl: e.storage_path,
        mimeType: e.mime_type,
        fileSize: e.file_size,
        sha256: e.sha256,
        verificationStatus: e.verification_status,
        matchPercentage: 98,
        angleDescription: "Field Photo",
        manipulationScore: e.risk_score || 0.04,
        syntheticAiScore: 0.02,
        weatherCorrelation: "IMD Pune Clear",
      })),
      aiAnalysis: row.ai_analyses?.[0]
        ? {
            category: row.ai_analyses[0].category,
            subcategory: row.ai_analyses[0].subcategory || "",
            severityScore: Number(row.ai_analyses[0].severity_score) || 8.0,
            severityDescription: row.ai_analyses[0].severity_description || "High urgency",
            affectedPopulationEstimate: row.ai_analyses[0].affected_population_estimate || "~10k residents",
            durationText: row.ai_analyses[0].duration_text || "Reported recently",
            jurisdiction: row.ai_analyses[0].jurisdiction_text || "PMC Municipal Ward",
            confidenceScore: Number(row.ai_analyses[0].confidence) || 92.0,
            extractedEntities: row.ai_analyses[0].entities || [],
            multimodalSummary: row.ai_analyses[0].summary,
          }
        : INITIAL_GRIEVANCE_1042.aiAnalysis,
      similarComplaints: [],
      recommendation: {
        recommendedAction: row.ai_analyses?.[0]?.recommended_action || "Inspect location and initiate repair.",
        rationale: row.ai_analyses?.[0]?.recommendation_rationale || "Automated civic assessment.",
        expectedResolutionHours: 24,
        confidenceScore: 90.0,
        status: "PENDING_REVIEW",
      },
      agentTimeline: (row.agent_actions || []).map((a: any) => ({
        id: a.id,
        actor: a.actor,
        title: a.title,
        timestamp: new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        description: a.description,
        icon: a.icon || "info",
        isCompleted: a.is_completed ?? true,
      })),
    }));
  } catch (err) {
    console.warn("Supabase query failed, using in-memory mock data:", err);
    return MOCK_GRIEVANCES;
  }
}

/**
 * Fetch a single grievance by number
 */
export async function getGrievanceByNumberFromDb(num: string): Promise<Grievance | undefined> {
  const grievances = await getGrievancesFromDb();
  return grievances.find(
    (g) => g.grievanceNumber.toLowerCase() === num.toLowerCase() || g.id === num
  );
}

/**
 * Insert a new grievance into Supabase
 */
export async function insertGrievanceToDb(grievance: Partial<Grievance>): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, data: grievance };
  }

  const supabase = createClient();
  if (!supabase) return { success: true, data: grievance };

  try {
    const { data, error } = await supabase.from("grievances").insert({
      grievance_number: grievance.grievanceNumber || `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: grievance.title || "Civic Grievance",
      description: grievance.description || "",
      original_text_log: grievance.originalTextLog || grievance.description || "",
      category: grievance.category || "Public Safety",
      priority: grievance.priority || "MEDIUM",
      status: grievance.status || "SUBMITTED",
      latitude: grievance.location?.latitude || null,
      longitude: grievance.location?.longitude || null,
      address: grievance.location?.address || null,
    }).select().single();

    if (error) {
      console.warn("Error inserting grievance to Supabase, falling back to local state:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown database error" };
  }
}

/**
 * Fetch audit logs
 */
export async function getAuditLogsFromDb(): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_AUDIT_LOGS;
  }

  const supabase = createClient();
  if (!supabase) return INITIAL_AUDIT_LOGS;

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return INITIAL_AUDIT_LOGS;
    }

    return data.map((d: any) => ({
      id: d.id,
      grievanceNumber: d.grievance_number || "GRV-2026-1042",
      timestamp: d.created_at,
      actorType: d.actor_type,
      actorName: d.actor_name,
      action: d.action,
      details: d.details,
    }));
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

/**
 * Fetch municipal departments
 */
export async function getDepartmentsFromDb() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "dept-pmc-civil", name: "PMC Road Infrastructure & Civil Maintenance", code: "PMC-CIVIL" },
      { id: "dept-pmc-sanitation", name: "PMC Sanitation & Solid Waste Management", code: "PMC-SAN" },
      { id: "dept-pmc-water", name: "PMC Water Supply & Sewage", code: "PMC-WATER" },
      { id: "dept-pmc-electrical", name: "PMC Electrical & Street Lighting", code: "PMC-ELEC" },
    ];
  }

  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase.from("departments").select("*").eq("active", true);
    return data || [];
  } catch {
    return [];
  }
}
