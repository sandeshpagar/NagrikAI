"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";

export default function CitizenGrievanceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getGrievanceByNumber, activeGrievance } = useGrievances();

  const grievance = getGrievanceByNumber(id) || activeGrievance;

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/citizen/dashboard"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to My Grievances</span>
        </Link>
        <span className="font-mono text-xs font-bold text-on-surface-variant">
          {grievance.grievanceNumber}
        </span>
      </div>

      {/* Main Status Milestone Card */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            {grievance.status.replace("_", " ")}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            Ward 12 · Sinhagad Zone
          </span>
        </div>

        <h1 className="font-headline text-xl font-bold text-on-surface">
          {grievance.title}
        </h1>

        {/* 3 Core Citizen Questions */}
        <div className="space-y-3 pt-2">
          {/* Question 1: What is happening? */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">info</span>
              1. What is currently happening?
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Your grievance has been validated by computer vision and assigned directly to the{" "}
              <strong>Pune Municipal Corporation (PMC) Road Infrastructure Division</strong>.
            </p>
          </div>

          {/* Question 2: What has happened? */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <div className="text-xs font-bold text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              2. What has been done?
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Executive Engineer <strong>Er. Rajesh Sharma</strong> inspected the report and deployed
              a joint repair squad with the electrical board.
            </p>
          </div>

          {/* Question 3: What happens next? */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <div className="text-xs font-bold text-tertiary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              3. What happens next?
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              On-site cold mix asphalt compaction and cable conduit insulation will be carried out on{" "}
              <strong>18 Sep 2026 at 10:30 AM</strong>. You will receive an SMS when the crew arrives.
            </p>
          </div>
        </div>

        {/* Photo Evidence Preview */}
        {grievance.evidence.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-on-surface">Your Submitted Evidence (Verified)</div>
            <div className="grid grid-cols-2 gap-3">
              {grievance.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl overflow-hidden border border-surface-container bg-surface-container-low"
                >
                  <img
                    alt={ev.angleDescription}
                    src={ev.fileUrl}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 text-[11px] text-on-surface font-medium truncate">
                    {ev.angleDescription}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Citizen Feedback Form (available after resolution) */}
        <div className="p-4 rounded-xl bg-surface-container flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            Satisfied with response time?
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => alert(`Thank you for rating ${star} stars!`)}
                className="text-amber-500 hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">star</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
