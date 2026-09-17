"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";
import { useAuth } from "@/context/AuthContext";
import { Grievance } from "@/lib/types";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

// Seed historical resolved cases for demonstration of citizen feedback & before/after audit
const HISTORICAL_RESOLVED_GRIEVANCES = [
  {
    id: "res-001",
    grievanceNumber: "GRV-2026-1038",
    title: "Streetlight Inoperative at Karve Statue Chowk",
    description: "Sodium lamp ballast blown causing complete dark spot near pedestrian crossing.",
    category: "Street Lighting & Electrical",
    ward: "Ward 10 · Kothrud Zone",
    resolvedAt: "15 Sep 2026, 04:30 PM",
    resolutionNotes: "LED luminaire driver replaced by Ward 10 electrical maintenance squad.",
    rating: 5,
    resolvedBy: "Er. Amit Shinde (Junior Engineer)",
  },
  {
    id: "res-002",
    grievanceNumber: "GRV-2026-1031",
    title: "Uncollected Garbage Accumulation near Deccan Bus Stop",
    description: "Secondary collection bin overflowed for 3 days attracting stray animals.",
    category: "Solid Waste Management",
    ward: "Ward 8 · Deccan Gymkhana Zone",
    resolvedAt: "12 Sep 2026, 11:15 AM",
    resolutionNotes: "Compactor vehicle cleared waste and disinfectant bleaching powder applied.",
    rating: 4,
    resolvedBy: "Shri. Dilip Pawar (Sanitation Inspector)",
  },
];

export default function CitizenDashboardPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    grievances: contextGrievances,
    notifications: contextNotifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useGrievances();

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "UPDATES" | "RESOLVED" | "NOTIFICATIONS">("ACTIVE");
  const [dbGrievances, setDbGrievances] = useState<Grievance[]>([]);
  const [isLoadingGrievances, setIsLoadingGrievances] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resolvedRatings, setResolvedRatings] = useState<Record<string, number>>({
    "res-001": 5,
    "res-002": 4,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch live grievances from backend/Supabase
  useEffect(() => {
    const fetchLiveGrievances = async () => {
      setIsLoadingGrievances(true);
      try {
        const res = await fetch("/api/grievances");
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            // Map backend schema to Grievance interface
            const mapped: Grievance[] = json.data.map((item: any) => ({
              id: item.id,
              grievanceNumber: item.grievance_number || item.id,
              title: item.title,
              description: item.description,
              status: item.status || "SUBMITTED",
              priority: item.priority || "HIGH",
              category: item.category || "Road Infrastructure",
              durationText: item.duration_text || "24-48 hours",
              affectedPopulation: item.affected_population || 1200,
              language: item.language || "English",
              ledgerHash: item.ledger_hash || "#PMC-2026-SHA256",
              createdAt: item.created_at,
              citizen: {
                name: currentUser?.fullName || "Citizen",
                phone: currentUser?.phone || "+91 98220 12345",
                uid: "UID-AADHAAR-8902",
              },
              location: {
                address: item.address || "Sinhagad Road, Pune",
                ward: item.address?.includes("Kothrud") ? "Ward 10 - Kothrud" : "Ward 12 - Sinhagad",
                zone: "West Zone Pune",
                latitude: item.latitude || 18.4965,
                longitude: item.longitude || 73.8312,
              },
              evidence: item.evidence || [],
              sla: {
                slaCode: "SLA-RTS-PWD-72H",
                durationHours: 72,
                deadlineTimestamp: item.expected_resolution_at || "18 Sep 2026, 18:00 IST",
                level0Breached: false,
                level1Breached: false,
                level2Breached: false,
                currentLevel: 0,
              },
              aiAnalysis: item.ai_analyses?.[0]
                ? {
                    category: item.ai_analyses[0].category,
                    subcategory: item.ai_analyses[0].subcategory,
                    priority: item.ai_analyses[0].priority,
                    confidence: item.ai_analyses[0].confidence,
                    severityScore: item.ai_analyses[0].severity_score,
                    affectedPopulation: item.ai_analyses[0].affected_population_estimate,
                    department: item.ai_analyses[0].raw_output?.department,
                    recommendedAction: item.ai_analyses[0].recommended_action,
                    recommendationRationale: item.ai_analyses[0].recommendation_rationale,
                    extractedEntities: item.ai_analyses[0].entities || [],
                  }
                : contextGrievances[0]?.aiAnalysis,
              recommendation: {
                status: "ACCEPTED",
                recommendedAction: item.ai_analyses?.[0]?.recommended_action || "Deploy repair crew within statutory window.",
                rationale: "Triggered under Maharashtra RTS Civic Service standards.",
                expectedResolutionHours: 24,
              },
              authorityDirective: item.authority_directive || {
                officerName: "Er. Rajesh Sharma",
                designation: "Executive Engineer (EE-PMC)",
                directiveText: "Inspection squad deployed with Ward 12 maintenance team. Work scheduled within statutory SLA.",
                loggedAt: "17 Sep 2026, 11:20 AM IST",
              },
              agentTimeline: contextGrievances[0]?.agentTimeline || [],
            }));
            setDbGrievances(mapped);
          }
        }
      } catch (err) {
        console.warn("Using local context grievances fallback:", err);
      } finally {
        setIsLoadingGrievances(false);
      }
    };

    fetchLiveGrievances();
  }, [currentUser?.fullName, currentUser?.phone, contextGrievances]);

  // Combine live db grievances with context fallback
  const allGrievances = useMemo(() => {
    if (dbGrievances.length > 0) return dbGrievances;
    return contextGrievances;
  }, [dbGrievances, contextGrievances]);

  // Split into active and resolved
  const activeGrievances = useMemo(() => {
    return allGrievances.filter((g) => g.status !== "RESOLVED");
  }, [allGrievances]);

  const resolvedGrievances = useMemo(() => {
    const fromState = allGrievances.filter((g) => g.status === "RESOLVED");
    return [...fromState, ...HISTORICAL_RESOLVED_GRIEVANCES];
  }, [allGrievances]);

  const handleRateGrievance = (id: string, stars: number) => {
    setResolvedRatings((prev) => ({ ...prev, [id]: stars }));
    showToast(`Thank you for rating ${stars} stars! Feedback submitted to PMC Ward Office.`);
  };

  const calculateProgressWidth = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { percent: 25, stage: "1. Logged & Geotagged", stageNum: 1 };
      case "ASSIGNED":
        return { percent: 50, stage: "2. AI Verified & Authority Mapped", stageNum: 2 };
      case "NOTIFIED":
      case "IN_PROGRESS":
        return { percent: 75, stage: "3. Crew Dispatched / Action Scheduled", stageNum: 3 };
      case "RESOLVED":
        return { percent: 100, stage: "4. Work Completed & Verified", stageNum: 4 };
      default:
        return { percent: 50, stage: "Action in Progress", stageNum: 2 };
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-md"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition-colors ml-auto p-1 rounded-lg hover:bg-slate-800 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Greeting & Action Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                Namaste, {currentUser?.fullName || "Citizen Ramesh"}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Aadhaar KYC Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Pune Municipal Citizen Services · Direct tracking under Maharashtra RTS Act 2015
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/citizen/submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              <span>Report Civic Issue</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-surface-container">
          <div
            onClick={() => setActiveTab("ACTIVE")}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeTab === "ACTIVE"
                ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                : "bg-surface-container-low border-surface-container hover:bg-surface-container"
            }`}
          >
            <div className="text-[11px] text-on-surface-variant font-semibold flex items-center justify-between">
              <span>Active Reports</span>
              <span className="material-symbols-outlined text-blue-600 text-[18px]">pending_actions</span>
            </div>
            <div className="text-2xl font-bold text-on-surface mt-1">{activeGrievances.length}</div>
            <span className="text-[10px] text-blue-700 font-medium">Under SLA Monitoring</span>
          </div>

          <div
            onClick={() => setActiveTab("ACTIVE")}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeTab === "ACTIVE"
                ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
                : "bg-surface-container-low border-surface-container hover:bg-surface-container"
            }`}
          >
            <div className="text-[11px] text-on-surface-variant font-semibold flex items-center justify-between">
              <span>Action Scheduled</span>
              <span className="material-symbols-outlined text-amber-600 text-[18px]">engineering</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {activeGrievances.filter((g) => g.status === "ASSIGNED" || g.status === "NOTIFIED" || g.status === "IN_PROGRESS").length}
            </div>
            <span className="text-[10px] text-amber-800 font-medium">Crew Dispatched / Queued</span>
          </div>

          <div
            onClick={() => setActiveTab("RESOLVED")}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeTab === "RESOLVED"
                ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-surface-container-low border-surface-container hover:bg-surface-container"
            }`}
          >
            <div className="text-[11px] text-on-surface-variant font-semibold flex items-center justify-between">
              <span>Resolved Cases</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">task_alt</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{resolvedGrievances.length}</div>
            <span className="text-[10px] text-emerald-800 font-medium">100% SLA Compliant</span>
          </div>

          <div
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeTab === "NOTIFICATIONS"
                ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20"
                : "bg-surface-container-low border-surface-container hover:bg-surface-container"
            }`}
          >
            <div className="text-[11px] text-on-surface-variant font-semibold flex items-center justify-between">
              <span>Alerts &amp; SMS</span>
              <span className="material-symbols-outlined text-purple-600 text-[18px]">notifications</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-1 flex items-center gap-1.5">
              <span>{contextNotifications.length}</span>
              {unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
              )}
            </div>
            <span className="text-[10px] text-purple-800 font-medium">WhatsApp / SMS Live</span>
          </div>
        </div>
      </section>

      {/* Tabbed Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "ACTIVE"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          <span>Active Grievances ({activeGrievances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("UPDATES")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "UPDATES"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
          <span>Pending Updates &amp; Broadcasts</span>
        </button>

        <button
          onClick={() => setActiveTab("RESOLVED")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "RESOLVED"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Resolved Grievances ({resolvedGrievances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ml-auto ${
            activeTab === "NOTIFICATIONS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE GRIEVANCES */}
      {activeTab === "ACTIVE" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">stream</span>
              <span>Active Reports Under Municipal Resolution</span>
            </h2>
            <span className="text-xs text-on-surface-variant">
              Live updates refreshed via NagrikAI Sentinel Loop
            </span>
          </div>

          {activeGrievances.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container text-center space-y-3">
              <span className="material-symbols-outlined text-emerald-600 text-[48px]">check_circle</span>
              <h3 className="text-base font-bold text-on-surface">All Reports Resolved!</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                You have no unresolved civic grievances. If you observe potholes, streetlight outages, or garbage overflows, submit a report.
              </p>
              <Link
                href="/citizen/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Report an Issue</span>
              </Link>
            </div>
          ) : (
            activeGrievances.map((item) => {
              const progress = calculateProgressWidth(item.status);

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card hover:shadow-elevated transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-primary bg-surface-container px-2.5 py-1 rounded-md">
                        {item.grievanceNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          item.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-900 border border-rose-200"
                            : item.priority === "HIGH"
                            ? "bg-error-container text-on-error-container"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {item.priority} PRIORITY
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Reported on {new Date(item.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Location & Authority Directive Banner */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-blue-950 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-blue-700">verified</span>
                        <span>Latest Municipal Directive · {item.authorityDirective?.officerName || "PMC Ward 12 Division"}</span>
                      </span>
                      <span className="text-[11px] text-blue-800 font-medium">
                        {item.authorityDirective?.loggedAt || "Today, 11:20 AM"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      &ldquo;{item.authorityDirective?.directiveText || "Inspection squad deployed. Cold mix asphalt patch and cable conduit insulation scheduled for 18 Sep 10:30 AM."}&rdquo;
                    </p>
                  </div>

                  {/* 4-Step Linear Milestone Progress Line */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
                      <span className={progress.stageNum >= 1 ? "text-primary font-bold" : "opacity-50"}>
                        1. Logged &amp; Geotagged
                      </span>
                      <span className={progress.stageNum >= 2 ? "text-primary font-bold" : "opacity-50"}>
                        2. AI &amp; Forensic Verified
                      </span>
                      <span className={progress.stageNum >= 3 ? "text-secondary font-bold" : "opacity-50"}>
                        3. Action Scheduled
                      </span>
                      <span className={progress.stageNum >= 4 ? "text-emerald-700 font-bold" : "opacity-50"}>
                        4. Resolved
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-primary transition-all duration-700 rounded-full"
                        style={{ width: `${progress.percent}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 text-secondary font-bold">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Current Stage: {progress.stage}
                      </span>
                      <span className="font-mono text-primary font-bold">
                        Target: ~21h remaining under RTSA
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-container">
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                      <span>{item.location.address} · {item.location.ward}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/citizen/grievances/${item.grievanceNumber || item.id}`}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <span>Track Plain-Language Details</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* TAB 2: PENDING UPDATES & BROADCASTS */}
      {activeTab === "UPDATES" && (
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">forward_to_inbox</span>
                <span>Direct Citizen Updates &amp; Broadcast Feeds</span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Live broadcasts sent via WhatsApp, SMS, and field engineer status dispatches
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
              WhatsApp Active
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Broadcast 1 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      WhatsApp Progress Alert Dispatched
                    </span>
                    <span className="text-[11px] text-on-surface-variant">To: +91 98220 12345 · Sinhagad Zone Ward 12</span>
                  </div>
                </div>
                <span className="text-[11px] text-on-surface-variant font-mono">10m ago</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed pl-9">
                &ldquo;Update on Ticket <strong>GRV-2026-1042</strong>: Executive Engineer Er. Rajesh Sharma has scheduled an on-site joint repair crew with the electrical division for <strong>tomorrow 18 Sep at 10:30 AM</strong>. You will receive an alert when work commences.&rdquo;
              </p>
            </div>

            {/* Broadcast 2 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[16px]">sms</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Statutory RTS SMS Notice
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Gateway: National Informatics Centre (NIC Pune)</span>
                  </div>
                </div>
                <span className="text-[11px] text-on-surface-variant font-mono">1h ago</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed pl-9">
                &ldquo;PMC RTS Alert: Grievance GRV-2026-1042 registered under Section 4 of Maharashtra RTS Act 2015. Guaranteed statutory resolution within 72 hours.&rdquo;
              </p>
            </div>

            {/* Broadcast 3 */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[16px]">security</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Forensic Multimodal Audit Verification
                    </span>
                    <span className="text-[11px] text-on-surface-variant">NagrikAI Computer Vision Pipeline</span>
                  </div>
                </div>
                <span className="text-[11px] text-on-surface-variant font-mono">Today, 10:25 AM</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed pl-9">
                &ldquo;Your submitted photos and Marathi audio memo were verified with 98.4% confidence and geotag locked within 12 meters of Sinhagad Road Junction.&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: RESOLVED GRIEVANCES */}
      {activeTab === "RESOLVED" && (
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">task_alt</span>
                <span>Successfully Resolved Civic Grievances</span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Historical records stamped and verified under municipal closure protocols
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {resolvedGrievances.length} Completed
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {resolvedGrievances.map((item: any) => {
              const currentRating = resolvedRatings[item.id] || item.rating || 5;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl bg-surface-container-low border border-surface-container space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">done_all</span>
                        RESOLVED
                      </span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {item.grievanceNumber}
                      </span>
                      <span className="text-xs text-on-surface-variant">· {item.ward}</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Completed: {item.resolvedAt || "15 Sep 2026"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Resolution Notes */}
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/70 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-emerald-900">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Municipal Resolution Summary · {item.resolvedBy || "PMC Engineer"}</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      {item.resolutionNotes || "Field repair completed in accordance with RTS standards."}
                    </p>
                  </div>

                  {/* Citizen Satisfaction Rating */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-on-surface font-semibold">Your Satisfaction Rating:</span>
                      <div
                        className="flex items-center gap-1"
                        onMouseLeave={() => setHoverRatings((prev) => ({ ...prev, [item.id]: 0 }))}
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const itemHover = hoverRatings[item.id] || 0;
                          const isFilled = star <= (itemHover || currentRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateGrievance(item.id, star)}
                              onMouseEnter={() => setHoverRatings((prev) => ({ ...prev, [item.id]: star }))}
                              className="p-0.5 hover:scale-125 transition-transform group focus:outline-none"
                              title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              <span
                                className={`text-[20px] transition-all duration-150 ${
                                  isFilled
                                    ? "material-symbols-filled text-amber-400 drop-shadow-sm scale-105"
                                    : "material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-amber-200"
                                }`}
                              >
                                star
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">({currentRating}/5)</span>
                    </div>

                    <button
                      onClick={() => showToast(`RTS Completion Certificate downloaded for ${item.grievanceNumber}.`)}
                      className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                      <span>Download Certificate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: NOTIFICATIONS HUB */}
      {activeTab === "NOTIFICATIONS" && (
        <section className="space-y-4">
          <NotificationCenter
            role="CITIZEN"
            notifications={contextNotifications as any}
            unreadCount={unreadCount}
            onMarkRead={(id) => markNotificationRead(id)}
            onMarkAllRead={() => {
              markAllNotificationsRead();
              showToast("All notifications marked as read.");
            }}
            className="shadow-sm border border-surface-container"
          />
        </section>
      )}

      {/* Citizen Rights & Help Banner */}
      <section className="p-5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[24px]">shield</span>
          </div>
          <div>
            <div className="text-sm font-bold text-on-surface">
              Maharashtra Right to Public Services Act (RTS), 2015
            </div>
            <div className="text-xs text-on-surface-variant">
              Guaranteed municipal response within 72 hours for civic hazards. Free statutory appellate rights.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:18002334000"
            className="px-4 py-2 rounded-xl bg-white border border-surface-container-high text-xs font-bold text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>Helpline: 1800-PMC</span>
          </a>
        </div>
      </section>
    </main>
  );
}
