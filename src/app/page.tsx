"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { role, switchRole } = useAuth();

  return (
    <div className="w-full min-h-screen bg-surface px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container via-primary to-tertiary-container p-8 lg:p-14 text-on-primary shadow-elevated border border-white/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-secondary-container text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
            NagrikAI · National Civic Intelligence Infrastructure
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Your voice. <br />
            AI-powered action.
          </h1>
          <p className="text-sm sm:text-base text-inverse-on-surface opacity-90 leading-relaxed max-w-2xl">
            Report public grievances, track real-time resolution, and stay informed while autonomous
            AI agents analyze, verify evidence, route to municipal authorities, and follow up until
            verified closure.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/citizen/submit"
              className="px-5 py-3 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Report a Grievance</span>
            </Link>
            <Link
              href="/authority/grievances/GRV-2026-1042"
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-on-primary text-sm font-semibold flex items-center gap-2 transition-colors border border-white/20"
            >
              <span className="material-symbols-outlined text-[20px]">inbox</span>
              <span>Open Signature Screen (GRV-2026-1042)</span>
            </Link>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card flex flex-col">
          <span className="text-xs text-on-surface-variant font-medium">Active Grievances</span>
          <span className="font-headline text-2xl lg:text-3xl text-primary font-bold mt-1">1,420</span>
          <span className="text-[11px] text-secondary font-semibold mt-1">Across 15 Municipal Wards</span>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card flex flex-col">
          <span className="text-xs text-on-surface-variant font-medium">SLA Compliance</span>
          <span className="font-headline text-2xl lg:text-3xl text-secondary font-bold mt-1">98.4%</span>
          <span className="text-[11px] text-on-surface-variant mt-1">Under Maharashtra RTS Act</span>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card flex flex-col">
          <span className="text-xs text-on-surface-variant font-medium">Evidence Verification</span>
          <span className="font-headline text-2xl lg:text-3xl text-tertiary font-bold mt-1">99.1%</span>
          <span className="text-[11px] text-on-surface-variant mt-1">EXIF + Forensic Vision AI</span>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card flex flex-col">
          <span className="text-xs text-on-surface-variant font-medium">Avg Resolution Time</span>
          <span className="font-headline text-2xl lg:text-3xl text-on-surface font-bold mt-1">4.2 Hours</span>
          <span className="text-[11px] text-primary font-semibold mt-1">For High-Priority Hazards</span>
        </div>
      </section>

      {/* Dual Portal Gateway (Citizen vs Authority) */}
      <section className="space-y-4">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface">Role-Aware Portals</h2>
          <p className="text-xs text-on-surface-variant">Select an experience to explore the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Citizen Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">person</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Citizen Portal (Mobile-First)</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Effortless complaint filing in English, Marathi or Hindi with camera upload, audio transcripts, and transparent live status updates without confusing technical jargon.
              </p>
              <ul className="text-xs text-on-surface-variant space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  5-Step responsive submission wizard
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  Instant AI category &amp; jurisdiction detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  Plain-language milestone timeline
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/citizen/dashboard"
                onClick={() => switchRole("CITIZEN")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 shadow-sm transition-colors"
              >
                Open Citizen Dashboard
              </Link>
              <Link
                href="/citizen/submit"
                onClick={() => switchRole("CITIZEN")}
                className="py-2.5 px-4 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                File Grievance
              </Link>
            </div>
          </div>

          {/* Authority Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[28px]">shield</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Authority Portal (Desktop-First)</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                High-density operational intelligence dashboard for municipal officers, featuring autonomous clustering, multimodal evidence verification, SLA ladders, and AI action recommendations.
              </p>
              <ul className="text-xs text-on-surface-variant space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  Full-fidelity <strong>GRV-2026-1042</strong> case dossier
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  Tamper-proof ledger &amp; audit logging
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                  Autonomous LangGraph Sentinel agent tracking
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/authority/grievances/GRV-2026-1042"
                onClick={() => switchRole("OFFICER")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 shadow-sm transition-colors"
              >
                Open GRV-2026-1042 Dossier
              </Link>
              <Link
                href="/authority/dashboard"
                onClick={() => switchRole("OFFICER")}
                className="py-2.5 px-4 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                Triage Queue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Vertical Flow Diagram */}
      <section className="p-6 rounded-2xl bg-surface-container-low border border-surface-container space-y-4">
        <h2 className="font-headline text-base font-bold text-on-surface">
          Automated Civic Resolution Lifecycle
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            { step: "1. Submission", desc: "Citizen text, voice & photos", icon: "edit_note" },
            { step: "2. AI Analysis", desc: "Category, severity, entities", icon: "auto_awesome" },
            { step: "3. Verification", desc: "Forensic EXIF & tamper check", icon: "verified_user" },
            { step: "4. Routing", desc: "Ward & division assignment", icon: "alt_route" },
            { step: "5. Sentinel Loop", desc: "LangGraph autonomous follow-up", icon: "smart_toy" },
            { step: "6. Closure", desc: "Citizen verification & rating", icon: "task_alt" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">
                {item.icon}
              </span>
              <span className="text-xs font-bold text-on-surface">{item.step}</span>
              <span className="text-[10px] text-on-surface-variant leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
