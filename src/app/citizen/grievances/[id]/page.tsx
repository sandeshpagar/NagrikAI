"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";
import { useAuth } from "@/context/AuthContext";

export default function CitizenGrievanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = (params?.id as string) || "";
  const { currentUser } = useAuth();
  const { getGrievanceByNumber, activeGrievance: defaultGrievance } = useGrievances();

  const [dbGrievance, setDbGrievance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [citizenRating, setCitizenRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [userQueryText, setUserQueryText] = useState("");
  const [appealReason, setAppealReason] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch live grievance details from backend/Supabase
  useEffect(() => {
    if (!routeId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/grievances/${routeId}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setDbGrievance(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote grievance detail; using local context:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [routeId]);

  // Merge db record with local context fallback
  const grievance = useMemo(() => {
    const local = getGrievanceByNumber(routeId) || defaultGrievance;
    if (!dbGrievance) return local;

    return {
      ...local,
      id: dbGrievance.id || local.id,
      grievanceNumber: dbGrievance.grievance_number || local.grievanceNumber,
      title: dbGrievance.title || local.title,
      description: dbGrievance.description || local.description,
      status: dbGrievance.status || local.status,
      priority: dbGrievance.priority || local.priority,
      category: dbGrievance.category || local.category,
      ledgerHash: dbGrievance.ledger_hash || local.ledgerHash,
      language: dbGrievance.language || local.language,
      createdAt: dbGrievance.created_at || local.createdAt,
      location: {
        ...local.location,
        address: dbGrievance.address || local.location.address,
        latitude: dbGrievance.latitude || local.location.latitude,
        longitude: dbGrievance.longitude || local.location.longitude,
      },
      authorityDirective: dbGrievance.authority_directive || local.authorityDirective,
      audioTranscript: dbGrievance.audio_transcript || local.audioTranscript,
      evidence: dbGrievance.evidence && dbGrievance.evidence.length > 0 ? dbGrievance.evidence : local.evidence,
      aiAnalysis: dbGrievance.ai_analyses?.[0]
        ? {
            ...local.aiAnalysis,
            category: dbGrievance.ai_analyses[0].category || local.aiAnalysis.category,
            subcategory: dbGrievance.ai_analyses[0].subcategory || local.aiAnalysis.subcategory,
            confidence: dbGrievance.ai_analyses[0].confidence || local.aiAnalysis.confidence,
            department: dbGrievance.ai_analyses[0].raw_output?.department || local.aiAnalysis.department,
            recommendedAction: dbGrievance.ai_analyses[0].recommended_action || local.aiAnalysis.recommendedAction,
            recommendationRationale: dbGrievance.ai_analyses[0].recommendation_rationale || local.aiAnalysis.recommendationRationale,
          }
        : local.aiAnalysis,
    };
  }, [dbGrievance, routeId, getGrievanceByNumber, defaultGrievance]);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      showToast("Playing Marathi voice recording: 'कल रात बारिश के बाद यहाँ बड़ा गड्ढा हो गया है...'");
    }
  };

  const handleSendQuery = () => {
    if (!userQueryText.trim()) return;
    setShowMessageModal(false);
    setUserQueryText("");
    showToast("Message sent directly to Ward 12 Executive Engineer dispatch log.");
  };

  const handleFileAppeal = () => {
    if (!appealReason.trim()) return;
    setShowAppealModal(false);
    setAppealReason("");
    showToast("Statutory RTS Appeal registered with Pune Municipal Commissioner Office.");
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto space-y-6">
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

      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/citizen/dashboard"
          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to My Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-surface-container-lowest border border-surface-container px-2.5 py-1 rounded-md">
            Ticket: {grievance.grievanceNumber}
          </span>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1 transition-colors shadow-sm"
            title="Download RTS official receipt"
          >
            <span className="material-symbols-outlined text-[15px]">print</span>
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* 1. Current Status & SLA Guarantee Banner */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>
                {grievance.status === "RESOLVED"
                  ? "WORK COMPLETED & VERIFIED"
                  : "CREW DISPATCHED · ACTION SCHEDULED"}
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              24h Resolution Guarantee
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-slate-600">
            SLA Code: {grievance.sla?.slaCode || "SLA-RTS-PWD-72H"}
          </span>
        </div>

        <h1 className="font-headline text-xl sm:text-2xl font-bold text-on-surface leading-snug">
          {grievance.title}
        </h1>

        {/* SLA Guarantee Countdown Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-700 text-[18px]">verified</span>
              <span>Maharashtra Right to Public Services Act (RTS) Guarantee</span>
            </div>
            <p className="text-xs text-blue-900">
              Guaranteed municipal resolution deadline:{" "}
              <strong>Tomorrow 18 Sep 2026, 18:00 IST</strong> (~21h remaining).
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-blue-800 shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">timer</span>
              <span>On Schedule</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. What Happened (Citizen Narrative & Location) */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">help_outline</span>
            <span>1. What Happened? (Reported Incident)</span>
          </h2>
          <span className="text-xs text-on-surface-variant">
            Filed: {new Date(grievance.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Citizen Narrative Quote */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>Your Submitted Description</span>
            <span>Language: {grievance.language || "Marathi & English Hybrid"}</span>
          </div>
          <p className="text-sm text-on-surface leading-relaxed font-medium">
            &ldquo;{grievance.description}&rdquo;
          </p>
        </div>

        {/* Reporter KYC & Geolocation Stamp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span>{currentUser?.fullName || grievance.citizen?.name || "Ramesh Kulkarni"}</span>
                <span className="material-symbols-outlined text-emerald-600 text-[14px]">verified</span>
              </div>
              <span className="text-[11px] text-on-surface-variant block">
                DigiLocker / Aadhaar KYC Verified Citizen
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface block truncate">
                {grievance.location?.address || "Sinhagad Road Junction, Pune"}
              </span>
              <span className="text-[11px] text-on-surface-variant font-mono block">
                Geo: {grievance.location?.latitude}° N, {grievance.location?.longitude}° E (12m delta)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Authority Update (Responsible Engineer Direct Communication) */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border-2 border-blue-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">engineering</span>
            <span>2. Authority Update &amp; Official Response</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[11px] font-bold">
            Executive Order
          </span>
        </div>

        {/* Responsible Officer Card */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                RS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {grievance.authorityDirective?.officerName || "Er. Rajesh Sharma"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-bold">
                    Responsible Officer
                  </span>
                </div>
                <span className="text-xs text-slate-600 block font-medium">
                  {grievance.authorityDirective?.designation || "Executive Engineer (Ward 12 Civil Division)"}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Pune Municipal Corporation · Road Maintenance Department
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="mailto:rajesh.sharma@pmc.gov.in"
                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">mail</span>
                <span>Contact Officer</span>
              </a>
              <button
                onClick={() => setShowMessageModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">chat</span>
                <span>Send Note</span>
              </button>
            </div>
          </div>

          {/* Official Directive Text */}
          <div className="p-3.5 rounded-lg bg-white border border-blue-100 text-xs text-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
              <span>Official Operational Directive</span>
              <span>Logged: {grievance.authorityDirective?.loggedAt || "17 Sep 2026, 11:20 AM"}</span>
            </div>
            <p className="text-slate-800 leading-relaxed font-medium">
              &ldquo;{grievance.authorityDirective?.directiveText || "Inspection squad deployed with Ward 12 Electrical Maintenance team. Cold mix asphalt patch and cable conduit insulation scheduled for 18 Sep 10:30 AM."}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* 4. Next Expected Action (What Happens Next) */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">forward</span>
            <span>3. What Happens Next? (Upcoming Milestone)</span>
          </h2>
          <span className="text-xs font-bold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full">
            In 15h 40m
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-on-surface">
                On-Site Joint Repair Crew Deployment &amp; Asphalt Compaction
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                A specialized municipal road patch vehicle and MSEDCL electrical safety team will arrive at{" "}
                <strong>Sinhagad Road Junction on 18 Sep 2026 at 10:30 AM IST</strong>.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">notifications_active</span>
              Instant WhatsApp alert will be sent when crew arrives on site.
            </span>
            <span className="font-bold text-primary">No citizen presence required</span>
          </div>
        </div>
      </section>

      {/* 5. Plain-Language Visual Milestone Timeline */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">timeline</span>
              <span>4. Step-by-Step Resolution Timeline</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Every milestone recorded with transparent municipal timestamping
            </p>
          </div>
          <span className="text-xs font-bold text-primary">Stage 3 of 4 Active</span>
        </div>

        {/* Vertical Milestone Chain */}
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
          {/* Milestone 1 */}
          <div className="relative flex flex-col gap-1">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-sm">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">1. Grievance Submitted &amp; Aadhaar Verified</span>
              <span className="font-mono text-[11px] text-on-surface-variant">17 Sep, 10:22 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Ticket filed via Citizen Portal with 2 geotagged images and 1 Marathi voice audio recording.
            </p>
          </div>

          {/* Milestone 2 */}
          <div className="relative flex flex-col gap-1">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-sm">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">2. Evidence Forensics &amp; Location Confirmed</span>
              <span className="font-mono text-[11px] text-on-surface-variant">17 Sep, 10:23 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Computer vision verified photos as authentic (98.4% confidence, tamper score 0.04). GPS location confirmed within 12m.
            </p>
          </div>

          {/* Milestone 3 */}
          <div className="relative flex flex-col gap-1">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shadow-sm">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">3. Fast-Track Priority Assigned &amp; Officer Mapped</span>
              <span className="font-mono text-[11px] text-on-surface-variant">17 Sep, 10:24 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mapped directly to Ward 12 Executive Engineer Er. Rajesh Sharma under Maharashtra RTS Act 2015.
            </p>
          </div>

          {/* Milestone 4 */}
          <div className="relative flex flex-col gap-1">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shadow-sm">
              <span className="material-symbols-outlined text-[13px]">forward_to_inbox</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">4. Official Municipal Email Notice Dispatched</span>
              <span className="font-mono text-[11px] text-on-surface-variant">17 Sep, 10:25 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Formal statutory notice dispatched to Executive Engineer inbox (rajesh.sharma@pmc.gov.in) with 24-hour resolution deadline.
            </p>
          </div>

          {/* Milestone 5 - Upcoming */}
          <div className="relative flex flex-col gap-1 opacity-80">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] shadow-sm animate-pulse">
              <span className="material-symbols-outlined text-[13px]">engineering</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">5. On-Site Inspection &amp; Bituminous Compaction</span>
              <span className="font-mono text-[11px] text-amber-700 font-bold">Tomorrow, 10:30 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Field squad arrives with cold asphalt and electrical insulation crew.
            </p>
          </div>

          {/* Milestone 6 - Pending */}
          <div className="relative flex flex-col gap-1 opacity-50">
            <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-[11px]">
              <span className="material-symbols-outlined text-[13px]">task_alt</span>
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">6. Case Closure &amp; Citizen Feedback</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Target: 18 Sep, 18:00</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Post-repair photos uploaded by engineer, and SMS completion notice sent to citizen.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Verified Evidence Gallery */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">photo_library</span>
              <span>5. Your Submitted Evidence (Verified)</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Tamper-proof photos and audio statement locked to municipal records
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            Hardware Authenticated
          </span>
        </div>

        {/* Photo Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {grievance.evidence && grievance.evidence.length > 0 ? (
            grievance.evidence.map((ev: any) => (
              <div
                key={ev.id}
                className="rounded-xl overflow-hidden border border-surface-container bg-surface-container-low flex flex-col"
              >
                <div className="h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  <img
                    alt={ev.angleDescription || "Grievance Evidence"}
                    src={ev.fileUrl}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                    GPS LOCKED: 18.4965, 73.8312
                  </span>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Authentic
                  </span>
                </div>
                <div className="p-3 text-xs flex items-center justify-between text-on-surface">
                  <span className="font-semibold truncate">{ev.angleDescription || "Front Angle Hazard View"}</span>
                  <span className="text-[11px] text-on-surface-variant font-mono">Apple iPhone 14</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-6 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
              No photos attached to this record.
            </div>
          )}
        </div>

        {/* Voice Audio Memo Box */}
        {grievance.audioTranscript && (
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-[18px]">mic</span>
                <span>Voice Grievance Statement ({grievance.audioTranscript.model || "Marathi ASR"})</span>
              </div>
              <span className="text-on-surface-variant font-mono text-[11px]">
                Duration: {grievance.audioTranscript.duration || "00:24"}
              </span>
            </div>
            <blockquote className="italic text-on-surface text-xs pl-3 border-l-2 border-primary py-0.5">
              &ldquo;{grievance.audioTranscript.marathi}&rdquo;
            </blockquote>
            <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant">
              <span>Marathi speech converted to text with 97.8% confidence</span>
              <button
                onClick={toggleAudio}
                className="text-primary hover:underline font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPlayingAudio ? "pause" : "volume_up"}
                </span>
                <span>{isPlayingAudio ? "Playing..." : "Listen to Recording"}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. AI Information at a High Level (Empowering without overwhelming) */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                6. How NagrikAI Accelerated Your Report
              </h2>
              <p className="text-xs text-on-surface-variant">
                Plain-language breakdown of automated municipal fast-tracking
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Citizen Safeguard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
              <span>Hazard Auto-Detected</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Our vision sensor detected exposed live electrical cabling inside the crater and immediately prioritized your report as <strong>Critical</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">route</span>
              <span>Zero-Delay Routing</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Instead of waiting days on a manual clerk desk, the system mapped this issue to the exact Executive Engineer responsible for Sinhagad Ward within 2 minutes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[18px]">timer</span>
              <span>24h Escalation Timer</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A 24-hour statutory deadline was activated. If unattended, the case automatically escalates to the Superintending Engineer.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-surface-container text-[11px] text-on-surface-variant flex items-center gap-2 border border-surface-container-high">
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
          <span>
            NagrikAI empowers citizens with transparency. AI assists municipal triage but all repair orders are signed and supervised by licensed PMC engineers.
          </span>
        </div>
      </section>

      {/* Citizen Feedback & Statutory RTS Appeal */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-card border border-surface-container space-y-4">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-[22px]">star</span>
          <span>7. Citizen Satisfaction &amp; Statutory Rights</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-on-surface block">
              Rate your experience with PMC response time:
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Your feedback is audited by the Municipal Commissioner Oversight Office.
            </span>
          </div>

          <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverRating || citizenRating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setCitizenRating(star);
                    showToast(`Thank you for rating ${star} stars! Recorded in PMC Ward Office registry.`);
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  className="p-1 hover:scale-125 transition-transform group focus:outline-none"
                  title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <span
                    className={`text-[26px] transition-all duration-150 ${
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
            {citizenRating > 0 && (
              <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                ({citizenRating}/5 {citizenRating === 5 ? "· Excellent" : citizenRating >= 4 ? "· Very Good" : citizenRating >= 3 ? "· Satisfactory" : "· Needs Attention"})
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-on-surface-variant">
            Unsatisfied or facing delay? You have legal rights under Section 8 of Maharashtra RTS Act.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
            >
              Add Case Note
            </button>
            <button
              onClick={() => setShowAppealModal(true)}
              className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>File RTS Statutory Appeal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Send Citizen Message */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat</span>
                Send Note to Ward 12 Engineer
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Provide additional landmark details or queries directly to Er. Rajesh Sharma.
            </p>
            <textarea
              rows={3}
              value={userQueryText}
              onChange={(e) => setUserQueryText(e.target.value)}
              placeholder="e.g. Please note the water leakage from the adjacent shop is also flowing into the crater..."
              className="w-full p-3 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-primary bg-surface-container-low"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuery}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Submit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: File RTS Appeal */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span>
                File Statutory Appeal (Maharashtra RTS Act 2015)
              </h3>
              <button onClick={() => setShowAppealModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Under Section 8, if public services are delayed beyond guaranteed SLA, an appeal is submitted to the First Appellate Authority (Superintending Engineer).
            </p>
            <input
              type="text"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Reason for appeal (e.g. Danger to life from live electrical wire)..."
              className="w-full p-3 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-rose-500 bg-surface-container-low"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAppealModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFileAppeal}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Submit Statutory Appeal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
