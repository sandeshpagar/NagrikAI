"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";
import { useAuth } from "@/context/AuthContext";

export default function EscalationsPage() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { grievances } = useGrievances();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (role === "CITIZEN") {
        router.replace(`/auth/unauthorized?role=CITIZEN&target=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isAuthenticated, isLoading, role, router, pathname]);

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
  const escalatedGrievances = grievances.filter(
    (g) => g.status === "ESCALATED" || g.priority === "CRITICAL"
  );

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]">alarm</span>
          SLA Breach &amp; Escalation Monitor
        </h1>
        <p className="text-xs text-on-surface-variant">
          Cases requiring senior authority intervention under Tier 2 &amp; Tier 3 escalation protocols
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {escalatedGrievances.map((g) => (
          <div
            key={g.id}
            className="p-6 rounded-2xl bg-surface-container-lowest border-2 border-error/20 shadow-card space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-error text-white font-bold text-xs">
                  ESCALATED
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {g.grievanceNumber}
                </span>
              </div>
              <span className="text-xs text-error font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                SLA Breached +2h
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-on-surface">{g.title}</h2>
              <p className="text-xs text-on-surface-variant mt-1">{g.description}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Escalated To:</span>
                <span className="font-bold text-on-surface">Tier 2: Superintending Engineer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Location:</span>
                <span className="font-bold text-on-surface">{g.location.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Impact Assessment:</span>
                <span className="font-bold text-error">Severe road sub-base erosion</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container">
              <span className="text-[11px] text-on-surface-variant">
                Auto-pinged Addl. Municipal Commissioner
              </span>
              <Link
                href={`/authority/grievances/${g.grievanceNumber}`}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-bold hover:bg-error/90 flex items-center gap-1"
              >
                <span>Take Immediate Action</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
