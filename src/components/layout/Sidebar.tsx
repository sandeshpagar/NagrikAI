"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { getDefaultRouteForRole, ROLE_CONFIGS } from "@/lib/auth/roles";

interface SidebarProps {
  onCloseMobile?: () => void;
  isDrawer?: boolean;
}

export function Sidebar({ onCloseMobile, isDrawer = false }: SidebarProps = {}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { role, currentUser, switchRole, isAuthenticated } = useAuth();

  const cycleRole = () => {
    const sequence: Role[] = ["OFFICER", "CITIZEN", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"];
    const nextIdx = (sequence.indexOf(role) + 1) % sequence.length;
    const nextRole = sequence[nextIdx];
    switchRole(nextRole);
    router.push(getDefaultRouteForRole(nextRole));
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClass = (href: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? "bg-blue-100/80 text-blue-950 font-bold border border-blue-300/60 shadow-sm"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;
  };

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.CITIZEN;

  return (
    <aside
      className={`${
        isDrawer
          ? "h-full w-72 flex flex-col justify-between py-4 bg-surface-container-low border-r border-surface-container"
          : "fixed left-0 top-16 bottom-0 w-72 bg-surface-container-low z-30 flex flex-col justify-between py-4 border-r border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.02)]"
      }`}
    >
      <div className="flex-1 overflow-y-auto px-3 space-y-5">
        {/* Mobile Drawer Header with Close Button */}
        {isDrawer && (
          <div className="flex items-center justify-between pb-2 border-b border-surface-container px-1">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-sm text-primary">Navigation</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleConfig.badgeClass}`}>
                {role}
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              title="Close Menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}

        {/* Section 1: Role-Aware Core Operations */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            {role === "CITIZEN" ? "Citizen Services" : "Core Operations"}
          </div>
          <nav className="flex flex-col gap-0.5">
            {role === "CITIZEN" ? (
              <>
                <Link
                  href="/citizen/dashboard"
                  onClick={handleLinkClick}
                  className={navItemClass("/citizen/dashboard")}
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  <span>My Grievances</span>
                </Link>
                <Link
                  href="/citizen/submit"
                  onClick={handleLinkClick}
                  className={navItemClass("/citizen/submit")}
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>Report New Issue</span>
                </Link>
                <Link
                  href="/citizen/grievances/GRV-2026-1042"
                  onClick={handleLinkClick}
                  className={navItemClass("/citizen/grievances/GRV-2026-1042")}
                >
                  <span className="material-symbols-outlined text-[20px]">inbox</span>
                  <span>Track Case</span>
                </Link>
                <Link
                  href="/#civic-map"
                  onClick={handleLinkClick}
                  className={navItemClass("/#civic-map")}
                >
                  <span className="material-symbols-outlined text-[20px]">map</span>
                  <span>Public Civic Map</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/authority/dashboard"
                  onClick={handleLinkClick}
                  className={navItemClass("/authority/dashboard")}
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  <span>Triage Queue</span>
                </Link>
                <Link
                  href="/authority/grievances/GRV-2026-1042"
                  onClick={handleLinkClick}
                  className={navItemClass("/authority/grievances/GRV-2026-1042")}
                >
                  <span className="material-symbols-outlined text-[20px]">inbox</span>
                  <span>Flagship Dossier (GRV-1042)</span>
                </Link>
                <Link
                  href="/#civic-map"
                  onClick={handleLinkClick}
                  className={navItemClass("/#civic-map")}
                >
                  <span className="material-symbols-outlined text-[20px]">map</span>
                  <span>Public Civic Map</span>
                </Link>
                {role === "SYSTEM_ADMIN" && (
                  <Link
                    href="/citizen/submit"
                    onClick={handleLinkClick}
                    className={navItemClass("/citizen/submit")}
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>Submit Grievance (Test)</span>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Section 2: AI & Automation (Authority and Admin roles) */}
        {role !== "CITIZEN" && (
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              AI &amp; Automation
            </div>
            <nav className="flex flex-col gap-0.5">
              <Link
                href="/authority/grievances/GRV-2026-1042#agent-timeline"
                onClick={handleLinkClick}
                className={navItemClass("/authority/grievances/GRV-2026-1042#agent-timeline")}
              >
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                <span>AI Follow-up Monitor</span>
              </Link>
              <Link
                href="/authority/evidence"
                onClick={handleLinkClick}
                className={navItemClass("/authority/evidence")}
              >
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span>Evidence Verification</span>
              </Link>
              <Link
                href="/authority/grievances/GRV-2026-1042#similar"
                onClick={handleLinkClick}
                className={navItemClass("/authority/grievances/GRV-2026-1042#similar")}
              >
                <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
                <span>Similar Complaints Matrix</span>
              </Link>
            </nav>
          </div>
        )}

        {/* Section 3: Administration & Governance */}
        <div>
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            {role === "CITIZEN" ? "Municipal Rights" : "Administration & System"}
          </div>
          <nav className="flex flex-col gap-0.5">
            {role === "CITIZEN" ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  Maharashtra RTS 2015
                </span>
                Guaranteed 72-hour municipal resolution deadline for road hazards.
              </div>
            ) : (
              <>
                <Link
                  href="/authority/escalations"
                  onClick={handleLinkClick}
                  className={navItemClass("/authority/escalations")}
                >
                  <span className="material-symbols-outlined text-[20px]">alarm</span>
                  <span>SLA &amp; Escalations</span>
                </Link>
                <Link
                  href="/authority/analytics"
                  onClick={handleLinkClick}
                  className={navItemClass("/authority/analytics")}
                >
                  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                  <span>Analytics &amp; Impact</span>
                </Link>
                {(role === "SYSTEM_ADMIN" || role === "DEPARTMENT_ADMIN") && (
                  <Link
                    href="/admin/audit"
                    onClick={handleLinkClick}
                    className={navItemClass("/admin/audit")}
                  >
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    <span>Audit Log (Tamper-Proof)</span>
                  </Link>
                )}
                {role === "SYSTEM_ADMIN" && (
                  <Link
                    href="/admin/dashboard"
                    onClick={handleLinkClick}
                    className={navItemClass("/admin/dashboard")}
                  >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    <span>System Governance</span>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Profile / Quick Role Switcher */}
      <div className="px-3 pt-2">
        {!isAuthenticated ? (
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-2 border border-surface-container-high">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Civic Platform</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              Sign in with your persona or credentials to access official consoles.
            </p>
            <Link
              href="/auth/login"
              className="w-full mt-0.5 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
            >
              <span>Official Sign In</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-surface-container-high">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                Active Profile
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleConfig.badgeClass}`}>
                {role}
              </span>
            </div>
            <div className="text-xs text-on-surface font-semibold leading-snug">
              {currentUser.designation || currentUser.fullName}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {currentUser.jurisdictionName || currentUser.departmentName || "Municipal Ward 12"}
            </div>
            <button
              onClick={cycleRole}
              className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors text-xs font-semibold flex items-center justify-center gap-1 shadow-sm border border-surface-container"
            >
              <span>Switch Role ({role})</span>
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
