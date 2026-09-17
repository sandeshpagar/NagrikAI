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
  const [ward, setWard] = useState("Ward 12 - Sinhagad Zone");
  const [address, setAddress] = useState("Near Sinhagad Road Junction, Pune");
  const [voiceActive, setVoiceActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulated AI Pre-classification result
  const [aiPreview, setAiPreview] = useState<{
    category: string;
    priority: "HIGH" | "MEDIUM" | "CRITICAL";
    severity: number;
    department: string;
  } | null>(null);

  const handleNextFromDescribe = () => {
    if (!description.trim()) {
      alert("Please enter a description of the issue.");
      return;
    }
    setStep(2);
  };

  const handleRunAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiPreview({
        category: "Road Infrastructure & Public Safety",
        priority: "HIGH",
        severity: 8.5,
        department: "PMC Civil Works & Road Maintenance",
      });
      setStep(4);
    }, 1200);
  };

  const handleFinalSubmit = () => {
    const created = submitNewGrievance({
      title: title || description.slice(0, 50),
      description,
      priority: aiPreview?.priority || "HIGH",
      location: {
        ward: "Ward 12",
        zone: "Sinhagad Zone",
        address,
        latitude: 18.4965,
        longitude: 73.8312,
      },
    });

    router.push(`/authority/grievances/${created.grievanceNumber}`);
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Wizard Step Progress Header */}
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

            {/* Mock Map Preview Box */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  location_on
                </span>
                <div>
                  <div className="text-xs font-bold text-on-surface">GPS Coordinates Captured</div>
                  <div className="text-[11px] font-mono text-on-surface-variant">
                    18.4965° N, 73.8312° E (Accuracy: &plusmn;4 meters)
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                GEO-LOCKED
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
              Confidence: 94.2%
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            Our civic language model has analyzed your report and automatically prepared the municipal routing:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Category</span>
              <div className="text-xs font-bold text-on-surface mt-1">Road Infrastructure</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Priority</span>
              <div className="text-xs font-bold text-error mt-1">HIGH (8.5/10)</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Jurisdiction</span>
              <div className="text-xs font-bold text-primary mt-1">PMC Ward 12</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Guaranteed SLA</span>
              <div className="text-xs font-bold text-secondary mt-1">24h Resolution</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="text-xs font-bold text-on-surface">Extracted Municipal Directive:</div>
            <p className="text-xs text-on-surface-variant mt-1">
              Immediate inspection requested for electrical conduit casing exposure and rapid asphalt compaction.
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

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold"
            >
              &larr; Back
            </button>
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-colors"
            >
              Confirm Official Submission
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
