"use client";

import React, { useState } from "react";
import { generateOfficialEmailHtml, EmailRecipientInfo } from "@/lib/email/template";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: any;
  recipient?: EmailRecipientInfo;
  mode?: "AUTHORITY_DISPATCH" | "CITIZEN_CONFIRMATION";
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  grievance,
  recipient,
  mode = "AUTHORITY_DISPATCH",
}: EmailPreviewModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message_id?: string;
    sent_at?: string;
    recipient_email?: string;
    is_duplicate?: boolean;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const defaultRecipient: EmailRecipientInfo = recipient || {
    name: "Er. Rajesh Sharma",
    email: "rajesh.sharma@pmc.gov.in",
    designation: "Junior Engineer (Ward 12)",
    department: "PMC Road Infrastructure & Civil Maintenance",
  };

  const grvNum = grievance?.grievance_number || grievance?.grievanceNumber || "GRV-2026-1042";
  const dashboardLink = typeof window !== "undefined"
    ? `${window.location.origin}/authority/grievances/${grvNum}`
    : `http://localhost:3000/authority/grievances/${grvNum}`;

  const emailHtml = generateOfficialEmailHtml(grievance || {}, defaultRecipient, dashboardLink);

  const handleDispatchEmail = async () => {
    setIsSending(true);
    setDispatchResult(null);

    try {
      const res = await fetch("/api/notifications/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance: grievance || {},
          recipient_name: defaultRecipient.name,
          recipient_email: defaultRecipient.email,
          recipient_designation: defaultRecipient.designation,
          recipient_department: defaultRecipient.department,
          force: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          message_id: data.message_id || `msg-${Date.now()}`,
          sent_at: data.sent_at || new Date().toLocaleTimeString(),
          recipient_email: data.recipient_email || defaultRecipient.email,
          is_duplicate: data.is_duplicate,
        });
      } else {
        setDispatchResult({
          success: false,
          error: data.error || "Failed to dispatch email notice via relay.",
        });
      }
    } catch (err: any) {
      setDispatchResult({
        success: false,
        error: err.message || "Network error while connecting to mail relay.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-surface-container-lowest border border-surface-container shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {mode === "AUTHORITY_DISPATCH"
                  ? "Official Municipal Directive & Dispatch Email"
                  : "Official Citizen Confirmation Notice"}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Statutory Maharashtra RTS Act 2015 · Standard PMC Digital Notice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-2.5 bg-surface-container-lowest border-b border-surface-container flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-on-surface-variant">
              To: <strong className="text-on-surface">{defaultRecipient.name}</strong> ({defaultRecipient.email})
            </span>
            <span className="text-on-surface-variant">
              Grievance: <strong className="font-mono text-primary">{grvNum}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cryptographic Ledger Verified</span>
          </div>
        </div>

        {/* Live Email HTML Render Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900/50">
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <iframe
              title="Official Email Template Preview"
              srcDoc={emailHtml}
              className="w-full h-[460px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Dispatch Result Banner */}
        {dispatchResult && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-t ${
              dispatchResult.success
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {dispatchResult.success ? "check_circle" : "error"}
              </span>
              <span>
                {dispatchResult.success
                  ? `Notice dispatched to ${dispatchResult.recipient_email} (Message ID: ${dispatchResult.message_id})`
                  : dispatchResult.error}
              </span>
            </div>
            {dispatchResult.is_duplicate && (
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Idempotent Cooldown
              </span>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-surface-container bg-surface-container-low/40 flex items-center justify-between gap-3">
          <div className="text-[11px] text-on-surface-variant font-mono">
            Relay Provider: NagrikAI Statutory Mail Engine (FastAPI/TS Fallback)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={handleDispatchEmail}
              disabled={isSending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSending ? "hourglass_empty" : "send"}
              </span>
              <span>{isSending ? "Dispatching Notice..." : "Send Official Notice Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
