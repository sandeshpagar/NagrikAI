"use client";

import React from "react";
import Link from "next/link";
import { useGrievances } from "@/context/GrievanceContext";
import { useAuth } from "@/context/AuthContext";

export default function CitizenDashboardPage() {
  const { grievances } = useGrievances();
  const { currentUser } = useAuth();

  const citizenGrievance = grievances[0]; // GRV-2026-1042

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Namaste, {currentUser.fullName}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Pune Municipal Citizen Services · Track your civic reports
          </p>
        </div>
        <Link
          href="/citizen/submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Report Issue</span>
        </Link>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm text-center">
          <div className="text-[11px] text-on-surface-variant font-medium">Active</div>
          <div className="text-xl font-bold text-primary mt-0.5">1</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm text-center">
          <div className="text-[11px] text-on-surface-variant font-medium">Under Action</div>
          <div className="text-xl font-bold text-secondary mt-0.5">1</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm text-center">
          <div className="text-[11px] text-on-surface-variant font-medium">Resolved</div>
          <div className="text-xl font-bold text-on-surface mt-0.5">3</div>
        </div>
      </div>

      {/* Active Case Card (GRV-2026-1042) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Active Grievance
          </h2>
          <span className="text-[11px] text-secondary font-bold">Real-time Sentinel Update</span>
        </div>

        {citizenGrievance && (
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[11px] font-bold">
                  HIGH PRIORITY
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {citizenGrievance.grievanceNumber}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant">
                Reported today, 10:32 AM
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-on-surface">
                {citizenGrievance.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                {citizenGrievance.description}
              </p>
            </div>

            {/* Plain Language Action Callout */}
            <div className="p-3.5 rounded-xl bg-secondary-container/30 border border-secondary-container flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                verified
              </span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-on-secondary-container">
                  Authority Action Scheduled
                </div>
                <div className="text-xs text-on-surface leading-relaxed">
                  Joint inspection crew deployed with Electrical Maintenance team. Repair work
                  scheduled for <strong>tomorrow 18 Sep at 10:30 AM</strong>.
                </div>
              </div>
            </div>

            {/* Simplified 4-Step Progress Line */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant mb-2">
                <span className="text-primary font-bold">1. Logged</span>
                <span className="text-primary font-bold">2. Verified</span>
                <span className="text-secondary font-bold">3. Crew Assigned</span>
                <span className="opacity-50">4. Resolved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: "75%" }}></div>
                <div className="h-full bg-surface-container-high" style={{ width: "25%" }}></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container">
              <span className="text-[11px] text-on-surface-variant">
                Ward 12 · Sinhagad Zone Pune
              </span>
              <Link
                href="/authority/grievances/GRV-2026-1042"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-colors"
              >
                <span>View Full Case Details</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Rights & Help Banner */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[28px]">shield</span>
          <div>
            <div className="text-xs font-bold text-on-surface">
              Maharashtra Right to Public Services Act (RTS), 2015
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Guaranteed municipal response within 72 hours for civic hazards.
            </div>
          </div>
        </div>
        <a
          href="tel:18002334000"
          className="text-xs text-primary font-bold hover:underline whitespace-nowrap"
        >
          Helpline: 1800-PMC
        </a>
      </div>
    </main>
  );
}
