"use client";

import React from "react";

export default function AnalyticsPage() {
  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Civic Intelligence &amp; Impact Analytics
        </h1>
        <p className="text-xs text-on-surface-variant">
          System-wide performance monitoring, SLA compliance, and AI triage efficiency
        </p>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">Monthly Resolution Rate</div>
          <div className="font-headline text-3xl font-bold text-primary mt-1">94.2%</div>
          <div className="text-[11px] text-secondary font-semibold mt-1">&uarr; 3.8% from last month</div>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">Avg Triage Speed</div>
          <div className="font-headline text-3xl font-bold text-secondary mt-1">1.8 Min</div>
          <div className="text-[11px] text-on-surface-variant mt-1">AI NLP + routing pipeline</div>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">AI Rec. Acceptance Rate</div>
          <div className="font-headline text-3xl font-bold text-tertiary mt-1">86.5%</div>
          <div className="text-[11px] text-secondary font-semibold mt-1">Accepted without change</div>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
          <div className="text-xs text-on-surface-variant font-medium">Active Sentinel Runs</div>
          <div className="font-headline text-3xl font-bold text-on-surface mt-1">1,420</div>
          <div className="text-[11px] text-on-surface-variant mt-1">LangGraph persistent loops</div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Chart */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <h2 className="text-sm font-bold text-on-surface">Grievance Distribution by Department</h2>
          <div className="space-y-3">
            {[
              { name: "Road Infrastructure & Civil Works", count: 520, pct: "42%" },
              { name: "Sanitation & Solid Waste Management", count: 380, pct: "30%" },
              { name: "Water Supply & Drainage", count: 210, pct: "18%" },
              { name: "Electrical & Streetlight Safety", count: 120, pct: "10%" },
            ].map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                  <span>{dept.name}</span>
                  <span className="text-primary font-bold">{dept.count} ({dept.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: dept.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation Efficiency Breakdown */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <h2 className="text-sm font-bold text-on-surface">Officer Decision Governance (AI Alignment)</h2>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
              <div>
                <div className="text-xs font-bold text-on-surface">Directly Accepted</div>
                <div className="text-[11px] text-on-surface-variant">Recommended crew dispatched as suggested</div>
              </div>
              <span className="text-lg font-bold text-secondary">86.5%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
              <div>
                <div className="text-xs font-bold text-on-surface">Officer Modified</div>
                <div className="text-[11px] text-on-surface-variant">Protocol adjusted for on-ground feasibility</div>
              </div>
              <span className="text-lg font-bold text-primary">10.2%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
              <div>
                <div className="text-xs font-bold text-on-surface">Rejected / Override</div>
                <div className="text-[11px] text-on-surface-variant">Non-jurisdictional or false alert</div>
              </div>
              <span className="text-lg font-bold text-error">3.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots Section */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Geographic Hazard Clusters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="text-xs font-bold text-on-surface">Ward 12 · Sinhagad Zone</div>
            <div className="text-[11px] text-error font-semibold mt-1">High Monsoon Road Collapse Cluster</div>
            <div className="text-xs text-on-surface-variant mt-2">14 related complaints merged into 2 work orders.</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="text-xs font-bold text-on-surface">Ward 8 · Shaniwar Peth</div>
            <div className="text-[11px] text-primary font-semibold mt-1">Commercial Market Sanitation Hub</div>
            <div className="text-xs text-on-surface-variant mt-2">Daily morning compactor routes scheduled.</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="text-xs font-bold text-on-surface">Ward 10 · Kothrud Depot</div>
            <div className="text-[11px] text-secondary font-semibold mt-1">Water Main Pressure Monitoring</div>
            <div className="text-xs text-on-surface-variant mt-2">Dual sensor telemetry online.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
