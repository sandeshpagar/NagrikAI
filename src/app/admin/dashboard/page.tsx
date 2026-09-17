"use client";

import React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const slaPolicies = [
    {
      category: "Road Infrastructure & Electrical Exposure",
      ackDeadline: "4 Hours",
      resDeadline: "24 Hours",
      escalateAfter: "12 Hours overdue",
      status: "ACTIVE",
    },
    {
      category: "Sanitation & Solid Waste Accumulation",
      ackDeadline: "12 Hours",
      resDeadline: "48 Hours",
      escalateAfter: "24 Hours overdue",
      status: "ACTIVE",
    },
    {
      category: "Potable Water Pipeline Ruptures",
      ackDeadline: "2 Hours",
      resDeadline: "12 Hours",
      escalateAfter: "6 Hours overdue",
      status: "ACTIVE",
    },
    {
      category: "Streetlight Non-Functional",
      ackDeadline: "24 Hours",
      resDeadline: "72 Hours",
      escalateAfter: "48 Hours overdue",
      status: "ACTIVE",
    },
  ];

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            System Administration &amp; Governance Console
          </h1>
          <p className="text-xs text-on-surface-variant">
            SLA rules configuration, authority jurisdiction matrix, and platform security controls
          </p>
        </div>
        <Link
          href="/admin/audit"
          className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>View Audit Ledger</span>
        </Link>
      </div>

      {/* System Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[28px]">
            check_circle
          </span>
          <div>
            <div className="text-xs font-bold text-on-surface">AI NLP &amp; Vision Engine</div>
            <div className="text-[11px] text-secondary font-semibold">Online · Latency 140ms</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[28px]">
            smart_toy
          </span>
          <div>
            <div className="text-xs font-bold text-on-surface">LangGraph Sentinel Loops</div>
            <div className="text-[11px] text-secondary font-semibold">1,420 Active State Checkpoints</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[28px]">
            security
          </span>
          <div>
            <div className="text-xs font-bold text-on-surface">PostgreSQL + pgvector RLS</div>
            <div className="text-[11px] text-secondary font-semibold">Row-Level Security Active</div>
          </div>
        </div>
      </div>

      {/* SLA Policy Management Table */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Configured SLA &amp; Escalation Thresholds
            </h2>
            <p className="text-xs text-on-surface-variant">
              Enforced automatically by the LangGraph Sentinel Agent
            </p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors">
            + New SLA Rule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-container bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Ack Deadline</th>
                <th className="py-2.5 px-3">Resolution SLA</th>
                <th className="py-2.5 px-3">Escalation Trigger</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {slaPolicies.map((pol, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/50">
                  <td className="py-3 px-3 font-semibold text-on-surface">{pol.category}</td>
                  <td className="py-3 px-3 text-on-surface font-medium">{pol.ackDeadline}</td>
                  <td className="py-3 px-3 text-secondary font-bold">{pol.resDeadline}</td>
                  <td className="py-3 px-3 text-on-surface-variant">{pol.escalateAfter}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                      {pol.status}
                    </span>
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
