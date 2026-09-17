"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, ShieldCheck, Flame, ChevronRight, UserCheck } from "lucide-react";

export interface SlaEvaluation {
  grievance_id: string;
  priority: string;
  department?: string;
  category?: string;
  created_at: string;
  acknowledgement_deadline?: string;
  acknowledgement_status: string;
  resolution_deadline?: string;
  resolution_status: string;
  elapsed_seconds: number;
  time_remaining_seconds: number;
  time_remaining_formatted: string;
  is_overdue: boolean;
  urgency_level: "NORMAL" | "WARNING_SOON" | "BREACHED" | "CRITICAL_ESCALATION" | string;
  reminder_recommended: boolean;
  escalation_recommended: boolean;
  escalation_reason?: string;
  current_escalation_tier: number;
  followup_count: number;
  applicable_rule_id: string;
}

interface SlaCountdownBadgeProps {
  grievanceId: string;
  initialEvaluation?: SlaEvaluation;
  showLadder?: boolean;
  allowManualEscalation?: boolean;
  className?: string;
}

export function SlaCountdownBadge({
  grievanceId,
  initialEvaluation,
  showLadder = false,
  allowManualEscalation = false,
  className = "",
}: SlaCountdownBadgeProps) {
  const [evaluation, setEvaluation] = useState<SlaEvaluation | null>(initialEvaluation || null);
  const [loading, setLoading] = useState(!initialEvaluation);
  const [escalating, setEscalating] = useState(false);
  const [escalatedNotice, setEscalatedNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchSla() {
      try {
        const res = await fetch(`/api/sla/status/${grievanceId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.evaluation) {
            setEvaluation(data.evaluation);
          }
        }
      } catch (err) {
        console.error("Failed to load SLA status:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!initialEvaluation) {
      fetchSla();
    }
    return () => {
      isMounted = false;
    };
  }, [grievanceId, initialEvaluation]);

  const handleTriggerEscalation = async () => {
    setEscalating(true);
    try {
      const res = await fetch(`/api/escalations/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievance_id: grievanceId,
          reason: "Manual administrative intervention due to urgent field conditions.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEscalatedNotice(data.message || "Escalation registered successfully.");
        // Refresh SLA
        const updateRes = await fetch(`/api/sla/status/${grievanceId}`);
        if (updateRes.ok) {
          const updateData = await updateRes.json();
          if (updateData.evaluation) setEvaluation(updateData.evaluation);
        }
      }
    } catch (err) {
      console.error("Failed to trigger escalation:", err);
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse flex items-center gap-2 p-3 bg-slate-100 rounded-xl ${className}`}>
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Calculating statutory SLA...</span>
      </div>
    );
  }

  if (!evaluation) return null;

  const isOverdue = evaluation.is_overdue;
  const isWarning = evaluation.urgency_level === "WARNING_SOON";
  const isCritical = evaluation.urgency_level === "CRITICAL_ESCALATION" || isOverdue;

  // Visual status pill color styles
  const badgeColors = isCritical
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : isWarning
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const iconColors = isCritical
    ? "text-rose-600"
    : isWarning
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm ${className}`}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColors}`}
          >
            {isCritical ? (
              <Flame className={`w-3.5 h-3.5 ${iconColors}`} />
            ) : isWarning ? (
              <AlertTriangle className={`w-3.5 h-3.5 ${iconColors}`} />
            ) : (
              <ShieldCheck className={`w-3.5 h-3.5 ${iconColors}`} />
            )}
            {evaluation.time_remaining_formatted}
          </span>
          <span className="text-xs font-medium text-slate-500">
            RTSA SLA Rule: <strong className="text-slate-700">{evaluation.applicable_rule_id}</strong>
          </span>
        </div>

        <div className="text-xs text-slate-400">
          Priority: <span className="font-semibold text-slate-700">{evaluation.priority}</span>
        </div>
      </div>

      {/* Progress & Target Detail */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-600">
        <div className="flex justify-between items-center">
          <span>Acknowledgement: <strong className={evaluation.acknowledgement_status === "BREACHED" ? "text-rose-600" : "text-emerald-600"}>{evaluation.acknowledgement_status}</strong></span>
          <span>Resolution Status: <strong className={isOverdue ? "text-rose-600" : "text-slate-800"}>{evaluation.resolution_status}</strong></span>
        </div>

        {evaluation.escalation_reason && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 flex items-start gap-2 mt-1">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{evaluation.escalation_reason}</span>
          </div>
        )}
      </div>

      {/* Escalation Hierarchy Ladder (Optional / Detailed view) */}
      {showLadder && (
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Statutory Escalation Hierarchy</span>
            <span className="text-[11px] font-normal text-slate-500">Tier {evaluation.current_escalation_tier} Active</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div
              className={`p-2 rounded-lg border transition-all ${
                evaluation.current_escalation_tier === 0
                  ? "bg-blue-50 border-blue-200 text-blue-800 font-semibold ring-1 ring-blue-300"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase">Tier 0</div>
              <div>Field Engineer</div>
            </div>

            <div
              className={`p-2 rounded-lg border transition-all ${
                evaluation.current_escalation_tier === 1
                  ? "bg-amber-50 border-amber-200 text-amber-800 font-semibold ring-1 ring-amber-300"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase">Tier 1</div>
              <div>Zonal Superintending Eng.</div>
            </div>

            <div
              className={`p-2 rounded-lg border transition-all ${
                evaluation.current_escalation_tier >= 2
                  ? "bg-rose-50 border-rose-200 text-rose-800 font-semibold ring-1 ring-rose-300"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase">Tier 2 (Apex)</div>
              <div>Additional Commissioner</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Row */}
      {allowManualEscalation && evaluation.current_escalation_tier < 2 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Officer intervention:</span>
          <button
            onClick={handleTriggerEscalation}
            disabled={escalating}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {escalating ? "Escalating..." : "Elevate to Senior Authority"}
          </button>
        </div>
      )}

      {escalatedNotice && (
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
          {escalatedNotice}
        </div>
      )}
    </div>
  );
}

export default SlaCountdownBadge;
