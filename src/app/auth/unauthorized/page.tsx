"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLE_CONFIGS, getDefaultRouteForRole } from "@/lib/auth/roles";
import { Role } from "@/lib/types";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const target = searchParams?.get("target") || "this protected area";
  const { role, currentUser, logout, switchRole } = useAuth();

  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.CITIZEN;
  const homePath = getDefaultRouteForRole(role);

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl border border-surface-container shadow-card space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">gpp_maybe</span>
        </div>

        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 text-[11px] font-bold uppercase tracking-wider border border-red-200">
            403 · Access Restricted
          </span>
          <h1 className="font-headline text-xl font-bold text-on-surface pt-2">
            Role Authorization Required
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your active profile does not possess the municipal security clearances needed to access{" "}
            <code className="bg-surface-container-low px-1.5 py-0.5 rounded font-mono font-bold text-red-700">
              {target}
            </code>
          </p>
        </div>

        {/* Current Active Credentials Callout */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-left space-y-2">
          <div className="text-[10px] text-on-surface-variant uppercase font-semibold">
            Current Active Session
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">{currentUser.fullName}</span>
              <span className="text-[11px] text-on-surface-variant">
                {currentUser.designation || currentUser.role}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleConfig.badgeClass}`}>
              {role}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5 pt-2">
          <Link
            href={homePath}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Authorized Home ({roleConfig.shortTitle})</span>
          </Link>

          <div className="flex items-center justify-center gap-3 pt-1">
            <Link
              href="/auth/login"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Switch User Account
            </Link>
            <span className="text-on-surface-variant text-xs">•</span>
            <button
              onClick={() => logout()}
              className="text-xs text-red-600 hover:underline font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UnauthorizedPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-on-surface-variant font-medium">Checking authorization...</div>}>
      <UnauthorizedContent />
    </React.Suspense>
  );
}

