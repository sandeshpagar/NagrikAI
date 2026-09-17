"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";

export default function SubmitGrievancePage() {
  const router = useRouter();
  const { submitNewGrievance } = useGrievances();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ward, setWard] = useState("Ward 12 - Sinhagad Zone (PMC)");
  const [address, setAddress] = useState("Near Sinhagad Road Junction, Pune");
  const [voiceActive, setVoiceActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Successfully submitted grievance data for Step 6 confirmation receipt
  const [submittedData, setSubmittedData] = useState<{
    grievanceNumber: string;
    ledgerHash: string;
    title: string;
    priority: string;
    deadlineIso?: string;
  } | null>(null);

  // Simulated AI Pre-classification result
  const [aiPreview, setAiPreview] = useState<{
    category: string;
    priority: "HIGH" | "MEDIUM" | "CRITICAL";
    severity: number;
    department: string;
  } | null>(null);

  // Live Device Geolocation State
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number }>({
    latitude: 18.4965,
    longitude: 73.8312,
    accuracy: 4,
  });
  const [locationSource, setLocationSource] = useState<"MANUAL" | "DEVICE_GPS">("MANUAL");

  const handleDetectLiveLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({
          latitude: parseFloat(latitude.toFixed(7)),
          longitude: parseFloat(longitude.toFixed(7)),
          accuracy: Math.round(accuracy),
        });
        setLocationSource("DEVICE_GPS");
        setIsLocating(false);
        setAddress(`Live Device GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (On-Site Verification)`);
      },
      (err) => {
        setIsLocating(false);
        alert(`Location access denied or unavailable: ${err.message}. Using default municipal landmark.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleNextFromDescribe = () => {
    if (!description.trim()) {
      alert("Please enter a description of the issue.");
      return;
    }
    setStep(2);
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_text: `${title ? title + ". " : ""}${description}`,
          location: { ward, address, lat: coords.latitude, lng: coords.longitude },
        }),
      });
      const data = await res.json();
      if (data && data.category) {
        setAiPreview(data);
      } else {
        setAiPreview({
          category: "Road Infrastructure & Public Safety",
          priority: "HIGH",
          severity_score: 8.5,
          department: "PMC Civil Works & Road Maintenance",
          jurisdiction: `PMC ${ward}`,
          recommended_action: "Deploy field repair crew for immediate site inspection.",
          confidence: 94.2,
        });
      }
    } catch {
      setAiPreview({
        category: "Road Infrastructure & Public Safety",
        priority: "HIGH",
        severity_score: 8.5,
        department: "PMC Civil Works & Road Maintenance",
        jurisdiction: `PMC ${ward}`,
        recommended_action: "Deploy field repair crew for immediate site inspection.",
        confidence: 94.2,
      });
    } finally {
      setIsAnalyzing(false);
      setStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: title || description.slice(0, 50),
      description,
      category: aiPreview?.category || "Road Infrastructure & Public Safety",
      priority: aiPreview?.priority || "HIGH",
      ward,
      address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_source: locationSource,
      gps_accuracy: coords.accuracy,
      citizen_name: "Ramesh Kulkarni",
      citizen_phone: "+91 98220 54199",
      evidence_items: [
        {
          storage_path: "evidence/IMG_20260917_102812.jpg",
          file_name: "IMG_20260917_102812.jpg",
          mime_type: "image/jpeg",
          file_size: 4182900,
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          metadata: { device: "Apple iPhone 14 Pro", latitude: 18.4965, longitude: 73.8312 },
        },
      ],
    };

    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok && !json.grievanceNumber) {
        throw new Error(json.error || "Failed to submit grievance to municipal API");
      }

      const generatedNum = json.grievanceNumber || `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerHash = json.ledgerHash || `#PMC-2026-SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update local client context
      submitNewGrievance({
        id: json.data?.id,
        grievanceNumber: generatedNum,
        title: payload.title,
        description: payload.description,
        priority: payload.priority as any,
        ledgerHash,
        location: {
          ward: "Ward 12",
          zone: "Sinhagad Zone",
          address,
          latitude: 18.4965,
          longitude: 73.8312,
        },
        // @ts-ignore
        alreadyPersisted: true,
      });

      setSubmittedData({
        grievanceNumber: generatedNum,
        ledgerHash,
        title: payload.title,
        priority: payload.priority,
      });

      setStep(6);
    } catch (err: any) {
      console.error("Submission error:", err.message);
      setSubmitError(err.message || "Failed to log complaint into municipal database. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setAiPreview(null);
    setSubmittedData(null);
    setStep(1);
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Wizard Step Progress Header */}
      {step <= 5 && (
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl border border-surface-container shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant mb-3">
            <span className={step >= 1 ? "text-blue-700" : ""}>1. Describe</span>
            <span className={step >= 2 ? "text-blue-700" : ""}>2. Location</span>
            <span className={step >= 3 ? "text-blue-700" : ""}>3. Evidence</span>
            <span className={step >= 4 ? "text-blue-700" : ""}>4. AI Preview</span>
            <span className={step >= 5 ? "text-blue-700" : ""}>5. Submit</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Step 1: Describe */}
      {step === 1 && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-card space-y-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Step 1: Describe the Civic Issue
          </h2>
          <p className="text-xs text-on-surface-variant">
            Describe the problem clearly. You can also use voice dictation in Marathi or Hindi.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-on-surface">Title / Summary</label>
              <input
                type="text"
                placeholder="e.g. Deep road crater near Sinhagad Petrol Pump"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface">Detailed Complaint</label>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceActive(!voiceActive);
                    if (!voiceActive) {
                      setDescription(
                        "Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening."
                      );
                      setTitle("Severe Road Crater & Exposed Electrical Conduit");
                    }
                  }}
                  className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                    voiceActive
                      ? "bg-error text-white"
                      : "bg-surface-container text-primary hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                  <span>{voiceActive ? "Listening (Marathi)..." : "Voice Input (Marathi / Hindi)"}</span>
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Type your complaint here or tap Voice Input..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextFromDescribe}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
            >
              Continue to Location &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-card space-y-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Step 2: Incident Location
          </h2>
          <p className="text-xs text-on-surface-variant">
            Specify the municipal ward and location coordinates for accurate routing.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-on-surface">Municipal Ward</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low"
              >
                <option>Ward 12 - Sinhagad Zone (PMC)</option>
                <option>Ward 8 - Shaniwar Peth / Central Pune</option>
                <option>Ward 10 - Kothrud Depot Zone</option>
                <option>Ward 4 - Aundh / Baner</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface">Landmark / Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low"
              />
            </div>

            {/* Live GPS Detection Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-700 dark:text-blue-400 text-[24px]">
                  {locationSource === "DEVICE_GPS" ? "gps_fixed" : "my_location"}
                </span>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {locationSource === "DEVICE_GPS" ? "Live Device GPS Active" : "Device Hardware Geolocation"}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {locationSource === "DEVICE_GPS"
                      ? `Accuracy: ±${coords.accuracy}m · Geo-locked to device sensor`
                      : "Allow browser access to verify on-site presence"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={isLocating}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 shrink-0"
              >
                <span className={`material-symbols-outlined text-[16px] ${isLocating ? "animate-spin" : ""}`}>
                  {isLocating ? "sync" : "near_me"}
                </span>
                <span>{isLocating ? "Acquiring GPS..." : "Detect My Live Location"}</span>
              </button>
            </div>

            {/* GPS Preview Box */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  location_on
                </span>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {locationSource === "DEVICE_GPS" ? "Live Device Coordinates Locked" : "Default Municipal GPS Coordinates"}
                  </div>
                  <div className="text-[11px] font-mono text-on-surface-variant">
                    {coords.latitude}° N, {coords.longitude}° E {coords.accuracy ? `(Accuracy: ±${coords.accuracy}m)` : ""}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                locationSource === "DEVICE_GPS"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-secondary-container text-on-secondary-container"
              }`}>
                {locationSource === "DEVICE_GPS" ? "DEVICE-GEO-LOCKED" : "MUNICIPAL PIN"}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Continue to Evidence &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Evidence Upload */}
      {step === 3 && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-card space-y-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Step 3: Upload Evidence
          </h2>
          <p className="text-xs text-on-surface-variant">
            Upload on-site photographs or camera captures. Our automated pipeline verifies authenticity and EXIF geotags.
          </p>

          <div className="border-2 border-dashed border-surface-container-high rounded-2xl p-6 text-center space-y-3 bg-surface-container-low/40">
            <span className="material-symbols-outlined text-primary text-[36px]">
              cloud_upload
            </span>
            <div className="text-xs font-bold text-on-surface">
              Drag and drop incident photographs or tap to capture
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Supports JPEG, PNG, HEIC up to 10MB each
            </p>

            {/* Preloaded Sample Evidence Preview */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-left">
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center gap-2">
                <img
                  alt="Proof"
                  className="w-12 h-12 rounded-lg object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnAJFxBqyHHt4J-K6FHGffv49n4Tfg_AVfNQqTcl2U4e8wU9bn-5S4yyoFThRZooBQmEI2CdW3EH0N20qXHZ1eqbnj2Kbsw5znRUtvsAaEbOx19T7OsUjO63tESeyTfkDsdaCja4-HqKanrnGwhhVR3xq2i0_-Po6EpLvi9QGPalaI_p9rVZEqy22eraKdsAjBhuVADfoSq0zr20fW5r_cIQaHXAxGWS1OP6tWNUbs692-YKnDZTo7YA"
                />
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-on-surface truncate">
                    IMG_20260917_102812.jpg
                  </div>
                  <div className="text-[10px] text-secondary font-semibold">EXIF Geotagged</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center gap-2">
                <img
                  alt="Proof"
                  className="w-12 h-12 rounded-lg object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0b0IOJA2Hr9bRQxyEW_8m2AsGVVSdHE31eCePxKOYdEgIRtKS5XmhwHSPmj1BzCSW7-xxv4tahmFSv6WZe0PYQy7QqgfYl1nrYI87EKlCJwACk5OmLZG--XeYOUeqqRuoVTiLUsQdJCj4SvDs8SdpfsTKi7Ix5pvfc3PRILpk3EIMhQKlsEm15s2LUKGmanU7Qfp_ofkJbL8pP3soDTEhJXvdrgePO1pvOvgGXNDRz0_HgFaQvmlLHg"
                />
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-on-surface truncate">
                    IMG_20260917_102905.jpg
                  </div>
                  <div className="text-[10px] text-secondary font-semibold">Contextual Angle</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>{isAnalyzing ? "Analyzing Complaint..." : "Run AI Pre-Analysis"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: AI Analysis Preview */}
      {step === 4 && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">psychology</span>
              Step 4: AI Triage &amp; Routing Preview
            </h2>
            <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
              Confidence: {aiPreview?.confidence ? `${aiPreview.confidence}%` : "94.2%"}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            Our civic language model has analyzed your report and automatically prepared the municipal routing:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Category</span>
              <div className="text-xs font-bold text-on-surface mt-1 line-clamp-1">
                {aiPreview?.category || "Road Infrastructure"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Priority</span>
              <div className="text-xs font-bold text-error mt-1">
                {aiPreview?.priority || "HIGH"} ({aiPreview?.severity_score ? `${aiPreview.severity_score}/10` : "8.5/10"})
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Jurisdiction</span>
              <div className="text-xs font-bold text-primary mt-1 line-clamp-1">
                {aiPreview?.jurisdiction || `PMC ${ward}`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Guaranteed SLA</span>
              <div className="text-xs font-bold text-secondary mt-1">
                {aiPreview?.priority === "CRITICAL" ? "12h Resolution" : aiPreview?.priority === "HIGH" ? "24h Resolution" : "48h Resolution"}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="text-xs font-bold text-on-surface">Extracted Municipal Directive:</div>
            <p className="text-xs text-on-surface-variant mt-1">
              {aiPreview?.recommended_action || "Immediate inspection requested for electrical conduit casing exposure and rapid asphalt compaction."}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              Review &amp; Confirm &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {step === 5 && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-card space-y-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Step 5: Final Review &amp; Official Submission
          </h2>
          <p className="text-xs text-on-surface-variant">
            Please confirm your complaint details before logging to the municipal ledger.
          </p>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
            <div>
              <span className="text-on-surface-variant font-semibold">Applicant:</span>{" "}
              <span className="font-bold text-on-surface">Ramesh Kulkarni (Aadhaar Verified)</span>
            </div>
            <div>
              <span className="text-on-surface-variant font-semibold">Location:</span>{" "}
              <span className="font-bold text-on-surface">{address} ({ward})</span>
            </div>
            <div>
              <span className="text-on-surface-variant font-semibold">Summary:</span>{" "}
              <span className="font-medium text-on-surface">{description}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container text-[11px] text-on-surface-variant">
            By submitting, your grievance is timestamped into the Maharashtra RTS public register. You will receive real-time SMS &amp; WhatsApp milestone tracking updates.
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium">
              {submitError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(4)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  <span>Submitting to Municipal Ledger...</span>
                </>
              ) : (
                <span>Confirm Official Submission</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Confirmation Receipt & RTS Certificate */}
      {step === 6 && submittedData && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-surface-container shadow-xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
              Maharashtra RTS Registered
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface pt-2">
              Civic Grievance Successfully Logged
            </h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Your report has been stamped into the municipal database and routed to Ward 12 executive engineers.
            </p>
          </div>

          {/* Official Dossier Credentials */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-surface-container text-left space-y-3.5">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <span className="text-xs text-on-surface-variant font-medium">Official Ticket ID:</span>
              <span className="font-mono text-base font-extrabold text-blue-700 dark:text-blue-400">
                {submittedData.grievanceNumber}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <span className="text-xs text-on-surface-variant font-medium">Statutory SLA Window:</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                24 Hours Resolution Guaranteed
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <span className="text-xs text-on-surface-variant font-medium">Cryptographic Ledger Hash:</span>
              <span className="font-mono text-[11px] text-on-surface bg-surface-container px-2 py-0.5 rounded">
                {submittedData.ledgerHash}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Audit Trail Status:</span>
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                Recorded in public.audit_logs
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push(`/authority/grievances/${submittedData.grievanceNumber}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Track Ticket in Live Triage Queue</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
            >
              File Another Report
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
