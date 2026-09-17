"use client";

import React, { useState } from "react";
import { useGrievances } from "@/context/GrievanceContext";

export default function GrievanceDetailPage() {
  const {
    activeGrievance: grievance,
    acceptRecommendation,
    modifyRecommendation,
    rejectRecommendation,
    postAuthorityDirective,
    triggerCitizenUpdate,
    escalateGrievance,
  } = useGrievances();

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [modifiedText, setModifiedText] = useState(
    grievance.recommendation.recommendedAction
  );
  const [modificationReason, setModificationReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [newNote, setNewNote] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [assignedOfficer, setAssignedOfficer] = useState("Er. Sandeep Patil (Junior Engineer)");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAccept = () => {
    acceptRecommendation(grievance.id);
    showToast("AI Recommendation Confirmed! Crew dispatch logged to PMC register.");
  };

  const handleModifySubmit = () => {
    if (!modificationReason.trim()) {
      alert("Please provide an administrative reason for modification.");
      return;
    }
    modifyRecommendation(grievance.id, modifiedText, modificationReason);
    setShowModifyModal(false);
    showToast("Recommendation modified & saved to tamper-proof ledger.");
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejecting the recommendation.");
      return;
    }
    rejectRecommendation(grievance.id, rejectReason);
    setShowRejectModal(false);
    showToast("Recommendation rejected. Officer override recorded.");
  };

  const handlePostNote = () => {
    if (!newNote.trim()) return;
    postAuthorityDirective(grievance.id, newNote);
    setNewNote("");
    setShowNoteModal(false);
    showToast("Official directive posted and verified against municipal guidelines.");
  };

  const handleEscalateSubmit = () => {
    if (!escalateReason.trim()) return;
    escalateGrievance(grievance.id, escalateReason);
    setShowEscalateModal(false);
    showToast("Case escalated to Tier-2 Superintending Engineer.");
  };

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      showToast("Playing Marathi audio complaint: 'कल रात बारिश के बाद...'");
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-primary-container text-on-primary px-4 py-3 rounded-xl shadow-elevated border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px] text-secondary-container">
            check_circle
          </span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col w-full space-y-6">
        {/* Top Breadcrumb & Status Ribbon */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container">
          <div className="flex flex-col gap-4">
            {/* Breadcrumb & Ledger Hash Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="hover:text-primary cursor-pointer">Grievances</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="hover:text-primary cursor-pointer">Infrastructure</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface font-bold">{grievance.grievanceNumber}</span>
              </nav>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  lock_clock
                </span>
                <span>
                  Ledger Hash:{" "}
                  <code className="font-mono text-primary font-bold">
                    {grievance.ledgerHash}
                  </code>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-bold uppercase text-[10px]">
                  Tamper-Proof
                </span>
              </div>
            </div>

            {/* Main Dossier Title Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-bold tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span> HIGH
                    PRIORITY
                  </span>
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    {grievance.status.replace("_", " ")}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant text-xs font-medium">
                    {grievance.location.ward} · {grievance.location.zone}
                  </span>
                  <span className="text-on-surface-variant text-xs">
                    • Geo:{" "}
                    <span className="font-mono text-on-surface font-semibold">
                      {grievance.location.latitude}° N, {grievance.location.longitude}° E
                    </span>
                  </span>
                </div>
                <h1 className="font-headline text-2xl lg:text-3xl text-on-surface font-bold tracking-tight">
                  {grievance.title}
                </h1>
              </div>

              {/* SLA Warning Bar Widget */}
              <div className="shrink-0 p-4 rounded-xl bg-surface-container-low flex flex-col gap-1.5 min-w-[280px] border border-surface-container">
                <div className="flex items-center justify-between text-on-surface text-xs font-semibold">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> SLA
                    Active
                  </span>
                  <span className="text-on-surface font-bold">21h 14m left</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: "68%" }}
                  ></div>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-tight mt-1">
                  Deadline:{" "}
                  <span className="font-semibold text-on-surface">18 Sep 2026, 18:00 IST</span>{" "}
                  (Level 0 Escalation)
                </p>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAccept}
                  disabled={grievance.recommendation.status === "ACCEPTED"}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>
                    {grievance.recommendation.status === "ACCEPTED"
                      ? "Recommendation Accepted"
                      : "Accept AI Recommendation"}
                  </span>
                </button>
                <button
                  onClick={() => setShowModifyModal(true)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold flex items-center gap-2 transition-all border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>Modify Action</span>
                </button>
                <button
                  onClick={() => {
                    triggerCitizenUpdate(grievance.id);
                    showToast("Triggered instant WhatsApp & SMS citizen status broadcast!");
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold flex items-center gap-2 transition-all border border-blue-200"
                >
                  <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
                  <span>Trigger AI Citizen Update</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-xs flex items-center gap-1.5"
                  title="Export PDF Case File"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Official Dossier</span>
                </button>
                <button
                  onClick={() => setShowEscalateModal(true)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low text-error hover:bg-error-container transition-colors text-xs font-semibold flex items-center gap-1.5"
                  title="Escalate Grievance"
                >
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Escalate Case</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Flagship Split Grid (7fr Left / 5fr Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Citizen Complaint, Multimodal Verification, AI Synthesis & Interventions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Citizen Original Submission Card */}
            <article className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4">
              <header className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined text-[24px]">person</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-on-surface font-bold">
                        {grievance.citizen.name}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[12px] mr-0.5">
                          verified
                        </span>{" "}
                        Digilocker / Aadhaar Verified
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Filed on 17 Sep 2026, 10:32 AM IST • NagrikAI Citizen Web App
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                  UID: {grievance.citizen.uid}
                </span>
              </header>

              {/* Citizen Narrative */}
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-surface-container">
                <div className="flex items-center justify-between text-on-surface-variant text-xs">
                  <span className="uppercase tracking-wider font-bold">Original Text Log</span>
                  <span>Language: {grievance.language}</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  &ldquo;{grievance.description}&rdquo;
                </p>
              </div>

              {/* Extracted Audio Transcript Box */}
              {grievance.audioTranscript && (
                <div className="p-4 rounded-xl bg-surface-container-high flex flex-col gap-2 border border-surface-container-high">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold">
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                      <span>Audio Grievance Transcript ({grievance.audioTranscript.model})</span>
                    </div>
                    <span className="text-on-surface-variant text-xs">
                      Duration: {grievance.audioTranscript.duration}
                    </span>
                  </div>
                  <blockquote className="italic text-on-surface text-sm pl-2 border-l-2 border-primary">
                    &ldquo;{grievance.audioTranscript.marathi}&rdquo;
                  </blockquote>
                  <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-1">
                    <span>
                      Model confidence: {grievance.audioTranscript.confidence}% · Sinhagad dialect
                      adaptation applied
                    </span>
                    <button
                      onClick={toggleAudio}
                      className="text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isPlayingAudio ? "pause" : "volume_up"}
                      </span>
                      <span>{isPlayingAudio ? "Playing..." : "Play Voice Recording"}</span>
                    </button>
                  </div>
                </div>
              )}
            </article>

            {/* 2. Multimodal Evidence & AI Authenticity Verification Card */}
            <article
              id="evidence"
              className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      verified_user
                    </span>
                    Multimodal Evidence &amp; AI Authenticity Verification
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Computer vision forensic analysis &amp; GPS hardware telemetry verification
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">task_alt</span> LIKELY
                  AUTHENTIC
                </span>
              </div>

              {/* Evidence Previews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grievance.evidence.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className="rounded-xl overflow-hidden bg-surface-container-low flex flex-col group border border-surface-container"
                  >
                    <div className="relative h-48 w-full bg-surface-container-highest overflow-hidden">
                      <img
                        alt={ev.angleDescription}
                        src={ev.fileUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-inverse-surface/80 backdrop-blur text-inverse-on-surface text-[11px] font-medium">
                        {ev.fileName}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur text-on-surface font-mono text-[10px] font-bold">
                        {ev.coordinates?.latitude}° N, {ev.coordinates?.longitude}° E
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-on-surface font-semibold">
                        <span>{ev.angleDescription}</span>
                        <span className="text-secondary font-bold">
                          {ev.matchPercentage}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        EXIF: {ev.exifData?.device} · {ev.exifData?.dateTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Authenticity Signal Matrix Grid */}
              <div className="p-4 rounded-xl bg-surface-container space-y-3">
                <div className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                  Forensic Integrity Checklist
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">EXIF Metadata</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Valid original camera payload
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      my_location
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Geotag Delta</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Within 12m of reported pin
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      image_search
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Visual Taxonomy</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Asphalt crater &amp; conduit
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      security
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">
                        Manipulation Risk
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        LOW (0.04 tamper score)
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      smart_toy
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Generative AI</span>
                      <span className="text-[11px] text-on-surface-variant">
                        LOW (0.02 synthetic score)
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-start gap-2 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      cloudy_snowing
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Weather Match</span>
                      <span className="text-[11px] text-on-surface-variant">
                        IMD Pune 38mm wet ground
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant italic pt-1">
                  Disclaimer: AI verification provides an algorithmic confidence assessment based
                  on metadata and vision tensors. It does not replace on-site officer validation.
                </p>
              </div>
            </article>

            {/* 3. AI Deep Analysis & Intelligence Engine Card */}
            <article className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">
                    auto_awesome
                  </span>
                  <h2 className="text-base text-on-surface font-bold">
                    AI Deep Synthesis &amp; Hazard Matrix
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>{" "}
                  Confidence: {grievance.aiAnalysis.confidenceScore}%
                </span>
              </div>

              {/* Bento Grid of Key Intelligence Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-xs text-on-surface-variant">Severity Index</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-3xl text-error font-bold">
                      {grievance.aiAnalysis.severityScore}
                    </span>
                    <span className="text-xs text-on-surface-variant">/ 10</span>
                  </div>
                  <span className="text-[11px] text-error font-bold">
                    {grievance.aiAnalysis.severityDescription}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-xs text-on-surface-variant">Est. Impacted Daily</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-3xl text-primary font-bold">~14.5k</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Commuters / 2-wheelers
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-xs text-on-surface-variant">Hazard Duration</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-3xl text-on-surface font-bold">3d</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Worsened post-monsoon</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-xs text-on-surface-variant">Jurisdiction</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl text-tertiary font-bold">Dual-Dept</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    PMC Civil + MSEDCL
                  </span>
                </div>
              </div>

              {/* Synthesized Insights Narrative */}
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-surface-container">
                <h3 className="text-xs text-on-surface font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    analytics
                  </span>
                  Multimodal Root-Cause Synthesis
                </h3>
                <p className="text-xs text-on-surface leading-relaxed">
                  {grievance.aiAnalysis.multimodalSummary}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    Extracted Entities:
                  </span>
                  {grievance.aiAnalysis.extractedEntities.map((ent, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px] font-semibold"
                    >
                      {ent}
                    </span>
                  ))}
                </div>
              </div>

              {/* Similar Complaints Clustering Panel */}
              <div
                id="similar"
                className="p-4 rounded-xl bg-surface-container space-y-2.5 border border-surface-container-high"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      merge_type
                    </span>
                    <span className="text-xs text-on-surface font-bold">
                      Autonomous Clustering Matrix (2 Duplicate Complaints Detected)
                    </span>
                  </div>
                  <span className="text-xs text-secondary font-bold">Vector Similarity</span>
                </div>
                <div className="flex flex-col gap-2">
                  {grievance.similarComplaints.map((sim) => (
                    <div
                      key={sim.id}
                      className="p-2.5 rounded-lg bg-surface-container-lowest flex items-center justify-between border border-surface-container"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary font-bold">
                          {sim.grievanceNumber}
                        </span>
                        <span className="text-xs text-on-surface font-medium">&ldquo;{sim.title}&rdquo;</span>
                        <span className="text-on-surface-variant text-[11px]">• {sim.reportedAt}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-[11px] font-bold">
                        {sim.similarityScore}% Similarity
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* 4. Authority Response & Active Interventions Card */}
            <article className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">
                    engineering
                  </span>
                  <div>
                    <h2 className="text-base text-on-surface font-bold">
                      Authority Directives &amp; Field Interventions
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Executive Engineering Branch · PMC Ward 12 &amp; Electrical Wing
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container text-xs font-bold">
                  Inspection Scheduled
                </span>
              </div>

              {grievance.authorityDirective && (
                <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">
                      Official Directive · {grievance.authorityDirective.officerName} (
                      {grievance.authorityDirective.designation})
                    </span>
                    <span className="text-on-surface-variant text-xs">
                      {grievance.authorityDirective.loggedAt}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed font-medium">
                    &ldquo;{grievance.authorityDirective.directiveText}&rdquo;
                  </p>
                </div>
              )}

              {/* AI Interpretation Callout */}
              <div className="p-3 rounded-lg bg-surface-container flex items-start gap-2 text-on-surface border border-surface-container-high">
                <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                  smart_toy
                </span>
                <p className="text-xs text-on-surface-variant">
                  <strong className="text-on-surface">AI Policy Verification:</strong> Authority
                  indicates on-site remediation with dual-team coordination. Progressing strictly
                  within Tier-1 SLA workflow. Field equipment checklist verified for bitumen mix
                  and non-conductive casing sleeve.
                </p>
              </div>

              {/* Officer Quick Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="p-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold flex items-center justify-center gap-2 border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                  <span className="truncate">Assign: {assignedOfficer.split(" ")[1]}</span>
                </button>
                <button
                  onClick={() => showToast("Inspection photo upload dialog initialized.")}
                  className="p-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold flex items-center justify-center gap-2 border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                  <span>Upload Field Photo</span>
                </button>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="p-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold flex items-center justify-center gap-2 border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>Post Official Directive</span>
                </button>
              </div>
            </article>
          </div>

          {/* RIGHT COLUMN: AI Recommendation, Live Timeline, SLA Ladder (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* 1. AI Recommendation & Decision Support Card */}
            <article className="bg-surface-container-lowest rounded-xl p-6 shadow-card border-2 border-blue-200 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-blue-800 block">
                      Autonomous Recommendation
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">AI-Assisted Operational Directive</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  grievance.recommendation.status === "ACCEPTED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  Status: {grievance.recommendation.status}
                </span>
              </div>

              <div className="space-y-2 bg-blue-50/60 p-4 rounded-xl border border-blue-100/80">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {grievance.recommendation.recommendedAction}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {grievance.recommendation.rationale}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                <span className="font-medium text-slate-600">Expected Resolution Time:</span>
                <span className="font-bold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200">
                  {grievance.recommendation.expectedResolutionHours} Hours post-dispatch
                </span>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleAccept}
                  disabled={grievance.recommendation.status === "ACCEPTED"}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send_time_extension</span>
                  <span>
                    {grievance.recommendation.status === "ACCEPTED"
                      ? "Action Approved & Logged"
                      : "Accept & Dispatch Crew Immediate"}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowModifyModal(true)}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold text-center transition-colors shadow-sm"
                  >
                    Modify Protocol
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold text-center transition-colors shadow-sm"
                  >
                    Reject Rationale
                  </button>
                </div>
              </div>
            </article>

            {/* 2. AI Follow-up Agent Live Timeline & Controller */}
            <article
              id="agent-timeline"
              className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4"
            >
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div>
                  <h2 className="text-base text-on-surface font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      history_toggle_off
                    </span>
                    AI Agent Live Timeline
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Autonomous Sentinel Loop · Active Monitoring
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                  SENTINEL ACTIVE
                </div>
              </div>

              {/* Scheduled Next Agent Step Banner */}
              <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    forward_to_inbox
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-semibold">
                      Next Autonomous Milestone
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Citizen WhatsApp &amp; SMS Progress Broadcast
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-primary font-bold">in 3h 48m</span>
              </div>

              {/* Vertical Chain of Custody Timeline */}
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                {grievance.agentTimeline.map((step) => (
                  <div key={step.id} className="relative flex flex-col gap-1">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[12px] ${
                        step.actor === "AI_AGENT"
                          ? "bg-primary text-on-primary"
                          : step.actor === "CITIZEN"
                          ? "bg-surface-container-high text-on-surface-variant"
                          : step.actor === "AUTHORITY"
                          ? "bg-secondary-container text-on-secondary-container font-bold"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{step.icon}</span>
                    </span>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          step.actor === "AI_AGENT" ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        {step.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* 3. SLA Governance & Escalation Ladder */}
            <article className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-surface-container space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    account_tree
                  </span>
                  SLA Governance &amp; Escalation Ladder
                </h2>
                <span className="font-mono text-xs text-on-surface-variant font-semibold">
                  {grievance.sla.slaCode}
                </span>
              </div>

              {/* SLA Progress Graphic */}
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-surface-container">
                <div className="flex items-center justify-between text-xs text-on-surface font-semibold">
                  <span>Overall SLA Consumption</span>
                  <span className="text-primary font-bold">66.7% Elapsed (48h / 72h)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden flex">
                  <div className="bg-primary h-full" style={{ width: "66.7%" }}></div>
                  <div className="bg-secondary-container h-full" style={{ width: "33.3%" }}></div>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
                  <span>Elapsed: 48h 00m</span>
                  <span>Target: 72h Max</span>
                  <span className="text-primary font-bold">Remaining: 24h 00m</span>
                </div>
              </div>

              {/* Escalation Ladder Tiers */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                  Hierarchy Protocol
                </div>
                {grievance.sla.tiers.map((tier) => (
                  <div
                    key={tier.tierNumber}
                    className={`p-3 rounded-lg flex items-center justify-between border transition-all ${
                      tier.status === "ACTIVE"
                        ? "bg-surface-container border-secondary/30"
                        : "bg-surface-container-low border-surface-container opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          tier.status === "ACTIVE" ? "bg-secondary" : "bg-outline-variant"
                        }`}
                      ></span>
                      <div className="flex flex-col">
                        <span className="text-xs text-on-surface font-bold">{tier.title}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {tier.officerName} · {tier.triggerCondition}
                        </span>
                      </div>
                    </div>
                    {tier.status === "ACTIVE" && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary text-[10px] font-bold">
                        ACTIVE STAGE
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Municipal Guarantee Footnote */}
              <div className="pt-2 flex items-center justify-between text-on-surface-variant text-[11px] border-t border-surface-container">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    verified
                  </span>
                  Maharashtra Right to Public Services Act, 2015 Compliant
                </span>
                <button
                  onClick={() => setShowEscalateModal(true)}
                  className="text-primary hover:underline font-bold"
                >
                  Configure Rules
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* Modal: Modify Recommendation */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-surface-container space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Modify Action Protocol
              </h3>
              <button
                onClick={() => setShowModifyModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface">
                  Modified Operational Directive
                </label>
                <textarea
                  value={modifiedText}
                  onChange={(e) => setModifiedText(e.target.value)}
                  rows={3}
                  className="w-full mt-1 p-3 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-primary bg-surface-container-low"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface">
                  Administrative Reason for Modification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prioritizing MSEDCL isolation before asphalt crew arrival..."
                  value={modificationReason}
                  onChange={(e) => setModificationReason(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-primary bg-surface-container-low"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                onClick={handleModifySubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Save &amp; Execute Directive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Recommendation */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-elevated border border-surface-container space-y-4">
            <h3 className="text-base font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined">cancel</span> Reject AI Recommendation
            </h3>
            <p className="text-xs text-on-surface-variant">
              State the reason for rejecting the recommendation. This action is permanently audited.
            </p>
            <input
              type="text"
              placeholder="e.g. Road is under state PWD jurisdiction, not PMC..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-error bg-surface-container-low"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post Official Directive Note */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-surface-container space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">engineering</span>
              Post Official Directive Note
            </h3>
            <textarea
              placeholder="Enter field engineering orders or inspection team instructions..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-primary bg-surface-container-low"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePostNote}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Log Directive Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Escalate Case */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-elevated border border-surface-container space-y-4">
            <h3 className="text-base font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span> Escalate Grievance
            </h3>
            <p className="text-xs text-on-surface-variant">
              Escalates this case to Tier 2: Superintending Engineer (West Zone Pune).
            </p>
            <input
              type="text"
              placeholder="Reason for escalation (e.g. Inter-agency delay with power board)..."
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-surface-container text-xs focus:outline-none focus:border-error bg-surface-container-low"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateSubmit}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-bold"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Officer */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-elevated border border-surface-container space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">assignment_ind</span> Assign
              Field Officer
            </h3>
            <div className="space-y-2">
              {[
                "Er. Sandeep Patil (Junior Engineer - Road Repair)",
                "Er. Amit Shinde (Junior Engineer - Electrical Safety)",
                "Er. Mahesh Kulkarni (Ward Inspector)",
              ].map((off) => (
                <div
                  key={off}
                  onClick={() => {
                    setAssignedOfficer(off);
                    setShowAssignModal(false);
                    showToast(`Assigned case to ${off}`);
                  }}
                  className={`p-3 rounded-lg border text-xs font-medium cursor-pointer hover:bg-surface-container transition-colors ${
                    assignedOfficer === off
                      ? "border-primary bg-surface-container-low text-primary font-bold"
                      : "border-surface-container text-on-surface"
                  }`}
                >
                  {off}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
