"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";
import { useAuth } from "@/context/AuthContext";

export default function AuthorityDashboardPage() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const { grievances } = useGrievances();
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/auth/login?redirect=/authority/dashboard");
      } else if (role === "CITIZEN") {
        router.replace("/auth/unauthorized?role=CITIZEN&target=/authority/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (isLoading || !isAuthenticated || role === "CITIZEN") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-on-surface-variant font-medium">
          {!isAuthenticated
            ? "Authentication required. Redirecting to login..."
            : "Clearance check: Authority access only. Redirecting..."}
        </span>
      </div>
    );
  }

  const filteredGrievances = grievances.filter((g) => {
    const matchesPriority = filterPriority === "ALL" || g.priority === filterPriority;
    const matchesSearch =
      g.grievanceNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.location.ward.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Grievance Intelligence &amp; Triage Queue
          </h1>
          <p className="text-xs text-on-surface-variant">
            Pune Municipal Corporation · Executive Engineering &amp; Civic Ops Division
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/authority/grievances/GRV-2026-1042"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Open Flagship Dossier (GRV-1042)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">Active In-Queue</div>
          <div className="font-headline text-2xl font-bold text-primary mt-1">142</div>
          <div className="text-[11px] text-secondary font-semibold mt-0.5">+18 filed today</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">High Priority</div>
          <div className="font-headline text-2xl font-bold text-error mt-1">9</div>
          <div className="text-[11px] text-error font-semibold mt-0.5">Immediate triage</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">SLA Approaching</div>
          <div className="font-headline text-2xl font-bold text-civic-amber mt-1">4</div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">&lt; 6 hours left</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">Tier-2 Escalations</div>
          <div className="font-headline text-2xl font-bold text-tertiary mt-1">2</div>
          <div className="text-[11px] text-tertiary font-semibold mt-0.5">Superintending review</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card col-span-2 sm:col-span-1">
          <div className="text-xs text-on-surface-variant font-medium">Resolved This Month</div>
          <div className="font-headline text-2xl font-bold text-secondary mt-1">109</div>
          <div className="text-[11px] text-secondary font-semibold mt-0.5">98.4% SLA met</div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by ID, keyword, or Ward..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-primary bg-surface-container-low"
            />
          </div>
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterPriority === p
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-medium"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Triage Queue Table */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {filteredGrievances.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        g.priority === "CRITICAL"
                          ? "bg-error text-white"
                          : g.priority === "HIGH"
                          ? "bg-error-container text-on-error-container"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      {g.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    <Link href={`/authority/grievances/${g.grievanceNumber}`}>
                      {g.grievanceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-on-surface line-clamp-1">{g.title}</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {g.aiAnalysis.category}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-on-surface font-medium whitespace-nowrap">
                    <div>{g.location.ward}</div>
                    <div className="text-[11px] text-on-surface-variant">{g.location.zone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      {g.evidence.length > 0 ? "Likely Authentic" : "Text Log"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1 text-secondary font-bold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>21h left</span>
                    </div>
                    <div className="text-[10px] text-on-surface-variant">Level 0</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold text-[10px]">
                      {g.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/authority/grievances/${g.grievanceNumber}`}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <span>Inspect Dossier</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
