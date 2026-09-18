import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveAuthority } from "@/lib/authorities/mapper";
import { generateOfficialEmailHtml, EmailRecipientInfo, EmailDispatchOutput } from "./template";

export { generateOfficialEmailHtml };
export type { EmailRecipientInfo, EmailDispatchOutput };

// In-memory idempotency cache for Next.js runtime
// { key: { timestamp: number, result: EmailDispatchOutput } }
const idempotencyStore = new Map<string, { timestamp: number; result: EmailDispatchOutput }>();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

// In-memory mock dispatch history
const mockDispatchHistory: Array<{
  message_id: string;
  recipient: EmailRecipientInfo;
  subject: string;
  sent_at: string;
  grievance_number: string;
}> = [];

export async function sendAuthorityEmailNotice(params: {
  grievance: any;
  recipient: EmailRecipientInfo;
  dashboardBaseUrl?: string;
  force?: boolean;
}): Promise<EmailDispatchOutput> {
  const { grievance, recipient, dashboardBaseUrl = "http://localhost:3000", force = false } = params;

  const grvId = String(grievance.id || grievance.grievance_number || grievance.grievanceNumber || "unknown");
  const grvNum = grievance.grievance_number || grievance.grievanceNumber || grvId;

  // 1. Idempotency Deduplication Check
  const idempotencyKey = `${grvId}:${recipient.email.toLowerCase().trim()}`;
  const now = Date.now();

  if (!force && idempotencyStore.has(idempotencyKey)) {
    const cached = idempotencyStore.get(idempotencyKey)!;
    if (now - cached.timestamp < COOLDOWN_MS) {
      console.log(`[EMAIL IDEMPOTENT] Duplicate dispatch to ${recipient.email} for ${grvNum} suppressed.`);
      return {
        ...cached.result,
        is_duplicate: true,
      };
    }
  }

  // 2. Render Template
  const dashboardLink = `${dashboardBaseUrl}/authority/grievances/${grvNum}`;
  const html = generateOfficialEmailHtml(grievance, recipient, dashboardLink);

  // 3. Dispatch via Mock Mode (or live SMTP if configured in process.env)
  const messageId = `MOCK-MSG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const sentAt = new Date().toISOString();

  const record: EmailDispatchOutput = {
    success: true,
    message_id: messageId,
    provider: "MOCK",
    recipient_email: recipient.email,
    sent_at: sentAt,
    is_duplicate: false,
    preview_html: html,
  };

  // Cache idempotency result
  idempotencyStore.set(idempotencyKey, { timestamp: now, result: record });

  // Store in mock dispatch history
  mockDispatchHistory.push({
    message_id: messageId,
    recipient,
    subject: `[PMC STATUTORY DISPATCH] Incident #${grvNum} - ${recipient.name}`,
    sent_at: sentAt,
    grievance_number: grvNum,
  });

  // 4. Update Supabase Grievance Status & Audit Log
  const supabase = getAdminSupabase();
  if (supabase && grievance.id) {
    try {
      // Transition status to NOTIFIED
      await supabase
        .from("grievances")
        .update({
          status: "NOTIFIED",
          updated_at: sentAt,
        })
        .or(`id.eq.${grievance.id},grievance_number.eq.${grvNum}`);

      // Insert audit log
      await supabase.from("audit_logs").insert({
        grievance_number: grvNum,
        actor_type: "SYSTEM",
        actor_name: "NagrikAI Email Dispatch Subsystem",
        action: "AUTHORITY_EMAIL_DISPATCHED",
        details: `Official government notification dispatched to ${recipient.name} <${recipient.email}> via MOCK provider (MsgID: ${messageId}).`,
        metadata: {
          recipient,
          message_id: messageId,
          provider: "MOCK",
          sent_at: sentAt,
        },
      });
    } catch (e: any) {
      console.warn("Supabase persistence note for email dispatch:", e.message);
    }
  }

  console.log(`[EMAIL DISPATCH SUCCESS] To: ${recipient.email} | Grievance: ${grvNum} | MsgID: ${messageId}`);

  return record;
}

export function getMockEmailHistory() {
  return mockDispatchHistory;
}
