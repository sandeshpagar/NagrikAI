"use client";

import React, { useState } from "react";
import { useGrievances } from "@/context/GrievanceContext";

export default function AuditLogsPage() {
  const { auditLogs } = useGrievances();
  const [filterActor, setFilterActor] = useState<string>("ALL");

  const filteredLogs = auditLogs.filter(
    (l) => filterActor === "ALL" || l.actorType === filterActor
  );

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">
              receipt_long
            </span>
            Tamper-Proof Case Audit Ledger
          </h1>
          <p className="text-xs text-on-surface-variant">
            Immutable chronological record of all citizen submissions, AI inferences, officer overrides, and agent dispatches
          </p>
        </div>

        {/* Filter by Actor */}
        <div className="flex items-center gap-1">
          {["ALL", "AI_AGENT", "OFFICER", "CITIZEN", "SYSTEM"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterActor(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterActor === act
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-medium"
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Grievance</th>
                <th className="py-3 px-4">Actor Type</th>
                <th className="py-3 px-4">Actor Entity</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Audit Details &amp; Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                    {log.grievanceNumber || "GLOBAL"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.actorType === "AI_AGENT"
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : log.actorType === "OFFICER"
                          ? "bg-blue-100 text-blue-950 border border-blue-200"
                          : log.actorType === "CITIZEN"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      {log.actorType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-on-surface whitespace-nowrap">
                    {log.actorName}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-on-surface text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
