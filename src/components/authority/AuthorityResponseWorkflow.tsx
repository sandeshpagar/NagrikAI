"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Calendar,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Edit3,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface AuthorityResponseWorkflowProps {
  grievanceId: string;
  currentStatus: string;
  aiRecommendation?: string;
  onResponseSubmitted?: (result: any) => void;
  className?: string;
}

export function AuthorityResponseWorkflow({
  grievanceId,
  currentStatus,
  aiRecommendation = "Dispatch Ward 12 road maintenance rapid repair crew with cold-mix asphalt equipment.",
  onResponseSubmitted,
  className = "",
}: AuthorityResponseWorkflowProps) {
  // Form states
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [directiveText, setDirectiveText] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Recommendation states
  const [isConfirmingSop, setIsConfirmingSop] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [customSopAction, setCustomSopAction] = useState("");
  const [sopModifyReason, setSopModifyReason] = useState("");

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
    details?: string;
  } | null>(null);

  const statusOptions = [
    { value: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 text-blue-700 bg-blue-50/50" },
    { value: "ACTION_SCHEDULED", label: "Action Scheduled", color: "border-amber-500 text-amber-700 bg-amber-50/50" },
    { value: "RESOLVED", label: "Case Resolved", color: "border-emerald-500 text-emerald-700 bg-emerald-50/50" },
    { value: "NEEDS_EVIDENCE", label: "Needs Evidence", color: "border-purple-500 text-purple-700 bg-purple-50/50" },
    { value: "REJECTED", label: "Rejected / Out of Scope", color: "border-rose-500 text-rose-700 bg-rose-50/50" },
  ];

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim() && !resolutionNotes.trim() && !selectedStatus) {
      setFeedback({
        type: "warning",
        message: "Please enter an operational directive, update the status, or specify notes.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        grievance_id: grievanceId,
        directive_text: directiveText.trim(),
        status_intent: selectedStatus || undefined,
        expected_action_date: expectedDate ? new Date(expectedDate).toISOString() : null,
        resolution_notes: resolutionNotes.trim() || null,
        confirm_ai_sop: isConfirmingSop,
        officer_name: "PMC Authority Officer",
      };

      const res = await fetch("/api/authority/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.is_ambiguous) {
          setFeedback({
            type: "warning",
            message: "Directive flagged as non-committal or ambiguous (Ambiguity Guardrail Triggered).",
            details: `Previous status preserved: '${currentStatus}'. ${data.clarification_requested || "Please specify explicit operational action."}`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `Response validated! Grievance transitioned to ${data.new_status || selectedStatus || "IN_PROGRESS"}.`,
            details: data.validated_response?.plain_language_summary,
          });
          setDirectiveText("");
          setResolutionNotes("");
        }

        if (onResponseSubmitted) {
          try {
            onResponseSubmitted(data);
          } catch (callbackErr) {
            console.warn("Parent onResponseSubmitted handler note:", callbackErr);
          }
        }
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to process authority action.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Network error while submitting authority response.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSop = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/authority/confirm-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance_id: grievanceId,
          notes: aiRecommendation,
          officer_name: "PMC Executive Engineer",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfirmingSop(true);
        setSelectedStatus("IN_PROGRESS");
        setFeedback({
          type: "success",
          message: "AI SOP recommendation confirmed & registered to Section 65B ledger.",
        });
        if (onResponseSubmitted) {
          try {
            onResponseSubmitted(data);
          } catch (callbackErr) {
            console.warn("Parent onResponseSubmitted handler note:", callbackErr);
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModifySop = async () => {
    if (!customSopAction.trim() || !sopModifyReason.trim()) {
      alert("Please provide both the custom action and the reason for modification.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/authority/modify-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance_id: grievanceId,
          custom_action: customSopAction,
          reason: sopModifyReason,
          officer_name: "PMC Executive Engineer",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModifyModal(false);
        setSelectedStatus("IN_PROGRESS");
        setFeedback({
          type: "success",
          message: "AI recommendation modified with statutory justification recorded.",
        });
        if (onResponseSubmitted) {
          try {
            onResponseSubmitted(data);
          } catch (callbackErr) {
            console.warn("Parent onResponseSubmitted handler note:", callbackErr);
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-semibold text-sm">Official Authority Response & Field Action</h3>
            <p className="text-xs text-slate-400">Maharashtra RTSA 2015 Structured Compliance Workflow</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300">
          Current: <strong className="text-white">{currentStatus}</strong>
        </span>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* AI Recommendation Panel */}
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI-Generated SOP Recommendation
            </span>
            <span className="text-[11px] text-indigo-600">Decision Support</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-lg border border-indigo-100/50">
            {aiRecommendation}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmSop}
              disabled={isSubmitting || isConfirmingSop}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
                isConfirmingSop
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isConfirmingSop ? "SOP Confirmed" : "Confirm Recommendation"}
            </button>

            <button
              type="button"
              onClick={() => setShowModifyModal(true)}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Modify Action
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : feedback.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{feedback.message}</span>
              {feedback.details && <span className="text-slate-600">{feedback.details}</span>}
            </div>
          </div>
        )}

        {/* Main Response Form */}
        <form onSubmit={handleSubmitResponse} className="flex flex-col gap-5">
          {/* Status Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">1. Update Case Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-indigo-500 shadow-sm`
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Action Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>2. Expected Action / Inspection Date</span>
              <span className="text-[11px] font-normal text-slate-400">Statutory Commitment</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
            </div>
          </div>

          {/* Operational Directive */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>3. Official Field Directive / Inspection Note</span>
              <span className="text-[11px] font-normal text-slate-400">Interpreted by LangGraph Agent</span>
            </label>
            <textarea
              rows={3}
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder="e.g., Road repair squad dispatched to Sinhagad Road junction. Tar patching and pothole compaction scheduled for tomorrow morning."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 resize-none"
            />
          </div>

          {/* Resolution Notes / Closure Certificate */}
          {selectedStatus === "RESOLVED" && (
            <div className="flex flex-col gap-2 animate-fadeIn">
              <label className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <span>4. Case Resolution Notes & Work Order ID</span>
                <span className="text-[11px] font-normal text-emerald-600">Required for Section 65B Closure</span>
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Work Order #PMC-WO-2026-894 executed. 250kg cold asphalt compacted. Quality check passed by Jr. Engineer."
                className="w-full text-xs p-3 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-emerald-50/30"
              />
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Directives are audited under Section 65B of Indian Evidence Act.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Official Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modify Recommendation Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-100">
            <h4 className="font-semibold text-sm text-slate-800">Modify AI Operational Recommendation</h4>
            <p className="text-xs text-slate-500">
              Provide your modified municipal action plan along with an administrative justification for the audit ledger.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700">Custom Municipal Action</label>
              <textarea
                rows={2}
                value={customSopAction}
                onChange={(e) => setCustomSopAction(e.target.value)}
                placeholder="e.g., Deploy heavy paver equipment rather than cold mix due to deep sub-base fracture."
                className="text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700">Reason for Modification</label>
              <textarea
                rows={2}
                value={sopModifyReason}
                onChange={(e) => setSopModifyReason(e.target.value)}
                placeholder="e.g., Heavy monsoon rainfall requires hot-mix asphalt compaction."
                className="text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModifySop}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Save & Apply Modification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthorityResponseWorkflow;
