"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const { role, currentUser, switchRole } = useAuth();

  const cycleRole = () => {
    const sequence: Role[] = ["OFFICER", "CITIZEN", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"];
    const nextIdx = (sequence.indexOf(role) + 1) % sequence.length;
    switchRole(sequence[nextIdx]);
  };

  const navItemClass = (href: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? "bg-blue-100/80 text-blue-950 font-bold border border-blue-300/60 shadow-sm"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-low z-30 flex flex-col justify-between py-4 border-r border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <div className="flex-1 overflow-y-auto px-3 space-y-5">
        {/* Section 1: Core Operations */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Core Operations
          </div>
          <nav className="flex flex-col gap-0.5">
            <Link href={role === "CITIZEN" ? "/citizen/dashboard" : "/authority/dashboard"} className={navItemClass("/authority/dashboard")}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/authority/grievances/GRV-2026-1042"
              className={navItemClass("/authority/grievances/GRV-2026-1042")}
            >
              <span className="material-symbols-outlined text-[20px]">inbox</span>
              <span>Grievance Intelligence Detail</span>
            </Link>
            <Link href="/citizen/submit" className={navItemClass("/citizen/submit")}>
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Submit Grievance</span>
            </Link>
            <Link href="/citizen/dashboard" className={navItemClass("/citizen/dashboard")}>
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span>Citizen Portal View</span>
            </Link>
          </nav>
        </div>

        {/* Section 2: AI & Automation */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            AI &amp; Automation
          </div>
          <nav className="flex flex-col gap-0.5">
            <Link
              href="/authority/grievances/GRV-2026-1042#agent-timeline"
              className={navItemClass("/authority/grievances/GRV-2026-1042#agent-timeline")}
            >
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span>AI Follow-up Monitor</span>
            </Link>
            <Link
              href="/authority/grievances/GRV-2026-1042#evidence"
              className={navItemClass("/authority/grievances/GRV-2026-1042#evidence")}
            >
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              <span>Evidence Verification</span>
            </Link>
            <Link
              href="/authority/grievances/GRV-2026-1042#similar"
              className={navItemClass("/authority/grievances/GRV-2026-1042#similar")}
            >
              <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
              <span>Similar Complaints Matrix</span>
            </Link>
          </nav>
        </div>

        {/* Section 3: Administration & Governance */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Administration &amp; System
          </div>
          <nav className="flex flex-col gap-0.5">
            <Link href="/authority/escalations" className={navItemClass("/authority/escalations")}>
              <span className="material-symbols-outlined text-[20px]">alarm</span>
              <span>SLA &amp; Escalations</span>
            </Link>
            <Link href="/authority/analytics" className={navItemClass("/authority/analytics")}>
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              <span>Analytics &amp; Impact</span>
            </Link>
            <Link href="/admin/audit" className={navItemClass("/admin/audit")}>
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>Audit Log (Tamper-Proof)</span>
            </Link>
            <Link href="/admin/dashboard" className={navItemClass("/admin/dashboard")}>
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>System Governance</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom Profile / Quick Role Switcher */}
      <div className="px-3 pt-2">
        <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-surface-container-high">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
              Active Session
            </span>
            <span className="material-symbols-outlined text-[16px] text-secondary">
              verified
            </span>
          </div>
          <div className="text-xs text-on-surface font-semibold leading-snug">
            {currentUser.designation || currentUser.fullName}
          </div>
          <div className="text-[11px] text-on-surface-variant">
            {currentUser.jurisdictionName || currentUser.departmentName || "Municipal Admin"}
          </div>
          <button
            onClick={cycleRole}
            className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors text-xs font-semibold flex items-center justify-center gap-1 shadow-sm border border-surface-container"
          >
            <span>Switch Role ({role})</span>
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
