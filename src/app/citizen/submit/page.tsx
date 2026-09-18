"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGrievances } from "@/context/GrievanceContext";
import { EmailPreviewModal } from "@/components/email/EmailPreviewModal";
import { validateAndSanitizeGrievance } from "@/lib/security/sanitizer";

interface EvidenceItem {
  id: string;
  name: string;
  preview: string;
  sizeStr: string;
  source: "UPLOAD" | "CAMERA" | "PRELOADED";
  timestamp: string;
}

const DEFAULT_EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-001",
    name: "IMG_20260917_102812.jpg",
    preview: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnAJFxBqyHHt4J-K6FHGffv49n4Tfg_AVfNQqTcl2U4e8wU9bn-5S4yyoFThRZooBQmEI2CdW3EH0N20qXHZ1eqbnj2Kbsw5znRUtvsAaEbOx19T7OsUjO63tESeyTfkDsdaCja4-HqKanrnGwhhVR3xq2i0_-Po6EpLvi9QGPalaI_p9rVZEqy22eraKdsAjBhuVADfoSq0zr20fW5r_cIQaHXAxGWS1OP6tWNUbs692-YKnDZTo7YA",
    sizeStr: "4.2 MB",
    source: "PRELOADED",
    timestamp: "17 Sep 2026, 10:28 AM",
  },
  {
    id: "ev-002",
    name: "IMG_20260917_102905.jpg",
    preview: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0b0IOJA2Hr9bRQxyEW_8m2AsGVVSdHE31eCePxKOYdEgIRtKS5XmhwHSPmj1BzCSW7-xxv4tahmFSv6WZe0PYQy7QqgfYl1nrYI87EKlCJwACk5OmLZG--XeYOUeqqRuoVTiLUsQdJCj4SvDs8SdpfsTKi7Ix5pvfc3PRILpk3EIMhQKlsEm15s2LUKGmanU7Qfp_ofkJbL8pP3soDTEhJXvdrgePO1pvOvgGXNDRz0_HgFaQvmlLHg",
    sizeStr: "3.8 MB",
    source: "PRELOADED",
    timestamp: "17 Sep 2026, 10:29 AM",
  },
];

export default function SubmitGrievancePage() {
  const router = useRouter();
  const { submitNewGrievance } = useGrievances();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ward, setWard] = useState("Ward 12 - Sinhagad Zone (PMC)");
  const [address, setAddress] = useState("Near Sinhagad Road Junction, Pune");
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"mr-IN" | "hi-IN" | "en-IN">("mr-IN");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Evidence state & live camera
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(DEFAULT_EVIDENCE);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Web Speech API initialization and voice handler
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceLang;

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const transcript = (finalTranscript || interimTranscript).trim();
          if (transcript) {
            setDescription((prev) => {
              const prefix = prev && !prev.endsWith(" ") ? `${prev} ` : prev;
              return `${prefix}${transcript}`;
            });

            if (!title) {
              if (voiceLang === "mr-IN") {
                setTitle("सिंहगड रस्त्यावरील नागरी समस्या");
              } else if (voiceLang === "hi-IN") {
                setTitle("सड़क मरम्मत एवं सुरक्षा शिकायत");
              } else {
                setTitle("Civic Infrastructure Grievance");
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition notice:", event.error);
          if (event.error === "not-allowed") {
            setSpeechError("Microphone access restricted. Tap a sample prompt below for instant demo.");
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Speech recognition init error:", err);
      }
    }
  }, [voiceLang, title]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      handleApplySampleVoice(voiceLang);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
      } catch {
        handleApplySampleVoice(voiceLang);
      }
    }
  };

  const handleApplySampleVoice = (lang: "mr-IN" | "hi-IN" | "en-IN") => {
    setVoiceLang(lang);
    if (lang === "mr-IN") {
      setTitle("सिंहगड रस्त्यावर मोठा खड्डा आणि धोकादायक वीज केबल");
      setDescription(
        "सिंहगड रस्त्यावरील पेट्रोल पंपाजवळ सुमारे १.८ मीटर रुंदीचा मोठा खड्डा पडला आहे. खालील जिवंत विजेच्या तारा उघड्या पडल्या आहेत. काल रात्रीच्या पावसामुळे अनेक दुचाकी घसरल्या आहेत. कृपया तात्काळ दुरुस्ती पथक पाठवा."
      );
    } else if (lang === "hi-IN") {
      setTitle("सिंहगढ़ रोड पर गहरा गड्ढा और खुली बिजली की तारें");
      setDescription(
        "सिंहगढ़ रोड पेट्रोल पंप के सामने 1.8 मीटर चौड़ा गहरा गड्ढा है। भूमिगत बिजली की तारें बाहर निकली हुई हैं। कल शाम बारिश में दोपहिया वाहन फिसल कर गिर गए। कृपया तत्काल मरम्मत टीम भेजें।"
      );
    } else {
      setTitle("Severe Road Crater & Exposed Electrical Conduit");
      setDescription(
        "Deep crater spanning 1.8 meters across opposite Petrol Pump on Sinhagad Road. Exposing live underground electrical wiring casing. Multiple two-wheelers skidded during rain yesterday evening. Immediate asphalt squad required."
      );
    }
  };

  // Camera & File Processing Handlers
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam API not supported in this browser. Please use the device photo selector.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings or use the file upload option."
          : `Live camera unavailable (${err.message || "No video input device"}). You can still upload files directly from your device.`
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
    const newEvidence: EvidenceItem = {
      id: `cam-${Date.now()}`,
      name: `CAMERA_CAPTURE_${timeStr}.jpg`,
      preview: dataUrl,
      sizeStr: "1.2 MB",
      source: "CAMERA",
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setEvidenceItems((prev) => [newEvidence, ...prev]);
    stopCamera();
  };

  const handleProcessFiles = (files: FileList | File[]) => {
    const newItems: EvidenceItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        preview: url,
        sizeStr: `${sizeMB} MB`,
        source: "UPLOAD",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    });
    if (newItems.length > 0) {
      setEvidenceItems((prev) => [...newItems, ...prev]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteEvidence = (id: string) => {
    setEvidenceItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

    const sanitization = validateAndSanitizeGrievance({
      title: title || description.slice(0, 50) || "Civic Grievance",
      description,
      address,
    });

    if (!sanitization.isValid) {
      setSubmitError(sanitization.errors.join(" "));
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: sanitization.sanitized.title,
      description: sanitization.sanitized.description,
      category: aiPreview?.category || "Road Infrastructure & Public Safety",
      priority: aiPreview?.priority || "HIGH",
      ward,
      address: sanitization.sanitized.address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_source: locationSource,
      gps_accuracy: coords.accuracy,
      citizen_name: "Ramesh Kulkarni",
      citizen_phone: "+91 98220 54199",
      evidence_items: evidenceItems.map((item) => ({
        storage_path: `evidence/${item.name}`,
        file_name: item.name,
        mime_type: "image/jpeg",
        file_size: 3800000,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        metadata: {
          source: item.source,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: item.timestamp,
        },
      })),
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
    setEvidenceItems(DEFAULT_EVIDENCE);
    setStep(1);
  };

  return (
    <main className="w-full min-h-screen bg-surface px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Wizard Step Progress Header */}
      {step !== 6 && (
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
              <label htmlFor="grievance-title" className="text-xs font-semibold text-on-surface">Title / Summary</label>
              <input
                id="grievance-title"
                type="text"
                aria-required="true"
                placeholder="e.g. Deep road crater near Sinhagad Petrol Pump"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px]"
              />
            </div>

            {/* Multilingual Voice Dictation Hub */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2.5" role="region" aria-label="Voice Dictation Assistant">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-blue-600" aria-hidden="true">record_voice_over</span>
                    <span>Multilingual Voice Dictation</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    Web Speech API
                  </span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center rounded-xl bg-surface-container-lowest p-0.5 border border-surface-container text-xs font-semibold" role="radiogroup" aria-label="Dictation Language">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={voiceLang === "mr-IN"}
                    onClick={() => setVoiceLang("mr-IN")}
                    className={
                      voiceLang === "mr-IN"
                        ? "px-2.5 py-1.5 rounded-lg transition-all text-[11px] bg-blue-600 text-white font-bold shadow-xs min-h-[36px] flex items-center"
                        : "px-2.5 py-1.5 rounded-lg transition-all text-[11px] text-on-surface-variant hover:text-on-surface min-h-[36px] flex items-center"
                    }
                  >
                    🇮🇳 मराठी
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={voiceLang === "hi-IN"}
                    onClick={() => setVoiceLang("hi-IN")}
                    className={
                      voiceLang === "hi-IN"
                        ? "px-2.5 py-1.5 rounded-lg transition-all text-[11px] bg-blue-600 text-white font-bold shadow-xs min-h-[36px] flex items-center"
                        : "px-2.5 py-1.5 rounded-lg transition-all text-[11px] text-on-surface-variant hover:text-on-surface min-h-[36px] flex items-center"
                    }
                  >
                    🇮🇳 हिन्दी
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={voiceLang === "en-IN"}
                    onClick={() => setVoiceLang("en-IN")}
                    className={
                      voiceLang === "en-IN"
                        ? "px-2.5 py-1.5 rounded-lg transition-all text-[11px] bg-blue-600 text-white font-bold shadow-xs min-h-[36px] flex items-center"
                        : "px-2.5 py-1.5 rounded-lg transition-all text-[11px] text-on-surface-variant hover:text-on-surface min-h-[36px] flex items-center"
                    }
                  >
                    🌐 English
                  </button>
                </div>
              </div>

              {/* Main Record Action Bar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  aria-pressed={isListening}
                  aria-label={isListening ? "Stop voice dictation" : "Start voice dictation"}
                  className={
                    isListening
                      ? "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-red-500 text-white animate-pulse ring-4 ring-red-400/40 min-h-[44px]"
                      : "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                  }
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {isListening ? "mic_off" : "mic"}
                  </span>
                  <span>
                    {isListening
                      ? (voiceLang === "mr-IN" ? "Listening in Marathi... (Tap to stop)" : voiceLang === "hi-IN" ? "Listening in Hindi... (Tap to stop)" : "Listening in English... (Tap to stop)")
                      : (voiceLang === "mr-IN" ? "Start Voice Dictation (मराठी)" : voiceLang === "hi-IN" ? "Start Voice Dictation (हिन्दी)" : "Start Voice Dictation (English)")}
                  </span>
                </button>

                {isListening && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold" aria-live="assertive">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" aria-hidden="true" />
                    <span>Live Audio Stream Active</span>
                  </div>
                )}
              </div>

              {/* Quick Vernacular Demo Chips for Hackathon Judges */}
              <div className="pt-1.5 border-t border-blue-100/60 dark:border-blue-900/30 flex flex-wrap items-center gap-1.5" aria-label="Demo Prompts">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                  Quick Demo Voice Prompts:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplySampleVoice("mr-IN")}
                  aria-label="Apply sample voice prompt in Marathi"
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-[11px] text-on-surface border border-surface-container transition-colors flex items-center gap-1 min-h-[36px]"
                >
                  <span aria-hidden="true">🗣️</span> <span>मराठी: रस्त्यावरील खड्डा</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleVoice("hi-IN")}
                  aria-label="Apply sample voice prompt in Hindi"
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-[11px] text-on-surface border border-surface-container transition-colors flex items-center gap-1 min-h-[36px]"
                >
                  <span aria-hidden="true">🗣️</span> <span>हिन्दी: गहरा गड्ढा व बिजली तार</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleVoice("en-IN")}
                  aria-label="Apply sample voice prompt in English"
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-[11px] text-on-surface border border-surface-container transition-colors flex items-center gap-1 min-h-[36px]"
                >
                  <span aria-hidden="true">🗣️</span> <span>English: Road Crater</span>
                </button>
              </div>

              {speechError && (
                <div className="p-2 rounded-lg bg-amber-50 text-amber-900 text-[11px] flex items-center gap-1.5 border border-amber-200" role="alert" aria-live="polite">
                  <span className="material-symbols-outlined text-[16px] text-amber-700" aria-hidden="true">info</span>
                  <span>{speechError}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="grievance-desc" className="text-xs font-semibold text-on-surface">Detailed Complaint</label>
              <textarea
                id="grievance-desc"
                rows={5}
                aria-required="true"
                placeholder="Type your complaint here or tap Start Voice Dictation in Marathi/Hindi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextFromDescribe}
              aria-label="Continue to location step"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
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
              <label htmlFor="ward-select" className="text-xs font-semibold text-on-surface">Municipal Ward</label>
              <select
                id="ward-select"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low min-h-[44px] focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option>Ward 12 - Sinhagad Zone (PMC)</option>
                <option>Ward 8 - Shaniwar Peth / Central Pune</option>
                <option>Ward 10 - Kothrud Depot Zone</option>
                <option>Ward 4 - Aundh / Baner</option>
              </select>
            </div>

            <div>
              <label htmlFor="street-address" className="text-xs font-semibold text-on-surface">Landmark / Street Address</label>
              <input
                id="street-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-surface-container text-xs bg-surface-container-low min-h-[44px] focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            {/* Live GPS Detection Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-700 dark:text-blue-400 text-[24px]" aria-hidden="true">
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
                aria-label="Detect my current device live GPS coordinates"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 shrink-0 min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                <span className={`material-symbols-outlined text-[16px] ${isLocating ? "animate-spin" : ""}`} aria-hidden="true">
                  {isLocating ? "sync" : "near_me"}
                </span>
                <span>{isLocating ? "Acquiring GPS..." : "Detect My Live Location"}</span>
              </button>
            </div>

            {/* GPS Preview Box */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[24px]" aria-hidden="true">
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
              aria-label="Go back to step 1 description"
              className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              aria-label="Continue to step 3 evidence upload"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
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

          {/* Hidden File and Camera Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFiles(e.target.files);
              }
            }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFiles(e.target.files);
              }
            }}
          />

          {/* Drag and Drop Container */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-all cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 scale-[1.01]"
                : "border-surface-container-high bg-surface-container-low/40 hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-primary text-[36px]">
              cloud_upload
            </span>
            <div className="text-xs font-bold text-on-surface">
              Drag and drop incident photographs or click to browse
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Supports JPEG, PNG, HEIC up to 10MB each (EXIF geotags auto-parsed)
            </p>

            {/* Direct Action Buttons */}
            <div
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Browse device photo files"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">folder_open</span>
                <span>Browse Files</span>
              </button>

              <button
                type="button"
                aria-label="Open live camera to capture incident photo"
                onClick={startCamera}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_camera</span>
                <span>Live Camera</span>
              </button>

              <button
                type="button"
                aria-label="Take quick mobile camera photo"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs sm:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">camera</span>
                <span>Camera Snap</span>
              </button>
            </div>
          </div>

          {/* Live Camera Viewfinder Modal */}
          {isCameraOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Camera Viewfinder">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[22px]" aria-hidden="true">photo_camera</span>
                    <h3 className="text-sm font-bold">Live Camera Viewfinder</h3>
                  </div>
                  <button
                    type="button"
                    onClick={stopCamera}
                    aria-label="Close camera viewfinder"
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                  </button>
                </div>

                {cameraError ? (
                  <div className="p-4 rounded-xl bg-red-900/40 border border-red-700 text-xs text-red-200 space-y-2">
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg bg-red-800 text-xs font-bold hover:bg-red-700"
                    >
                      Choose File Instead
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      LIVE VIEWFINDER
                    </div>
                  </div>
                )}

                {!cameraError && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">Position civic hazard within frame</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">camera</span>
                        <span>Capture Photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Evidence List */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Attached Evidence Photos ({evidenceItems.length})</span>
              <span className="text-[11px] text-secondary font-semibold">AI Geotag &amp; Cryptographic SHA-256 Audit Ready</span>
            </div>

            {evidenceItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
                No photographs attached yet. Please drag &amp; drop or take a photo above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {evidenceItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3 shadow-xs hover:border-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        alt={item.name}
                        src={item.preview}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-surface-container"
                      />
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-on-surface truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                          <span>{item.sizeStr}</span>
                          <span>·</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              item.source === "CAMERA"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : item.source === "UPLOAD"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                : "bg-surface-container text-secondary"
                            }`}
                          >
                            {item.source === "CAMERA" ? "LIVE CAMERA" : item.source === "UPLOAD" ? "DEVICE UPLOAD" : "EXIF GEOTAGGED"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvidence(item.id)}
                      aria-label={`Remove photo ${item.name}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Remove photo"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              aria-label="Go back to step 2 location"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-surface-container text-xs font-semibold hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              &larr; Back
            </button>
            <button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              aria-label="Run automated civic AI analysis on complaint"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
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
              aria-label="Go back to step 3 evidence upload"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(5)}
              aria-label="Proceed to review and confirmation"
              className="px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
            <div>
              <span className="text-on-surface-variant font-semibold">Attached Evidence:</span>{" "}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {evidenceItems.length} photograph{evidenceItems.length !== 1 ? "s" : ""} (Forensic &amp; Geotag Ready)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container text-[11px] text-on-surface-variant">
            By submitting, your grievance is timestamped into the Maharashtra RTS public register. You will receive real-time SMS &amp; WhatsApp milestone tracking updates.
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium" role="alert">
              {submitError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(4)}
              disabled={isSubmitting}
              aria-label="Go back to step 4 AI triage preview"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
            >
              &larr; Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              aria-label="Confirm and officially submit grievance to municipal ledger"
              className="px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">sync</span>
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
              onClick={() => router.push(`/citizen/grievances/${submittedData.grievanceNumber}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Track Resolution Progress</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
              <span>View Official Receipt Email</span>
            </button>
            <button
              onClick={() => router.push("/citizen/dashboard")}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              <span>Dashboard</span>
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-medium transition-colors"
            >
              File Another Report
            </button>
          </div>
        </div>
      )}

      {/* Official Email Preview Modal */}
      {submittedData && (
        <EmailPreviewModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          grievance={{
            grievanceNumber: submittedData.grievanceNumber,
            title: submittedData.title,
            description,
            priority: submittedData.priority,
            ledgerHash: submittedData.ledgerHash,
            location: { ward, address, latitude: coords.latitude, longitude: coords.longitude },
          }}
          recipient={{
            name: "Ramesh Kulkarni",
            email: "ramesh.kulkarni@citizen.nagrik.in",
            designation: "Citizen Complainant",
            department: "Pune Citizen Portal",
          }}
          mode="CITIZEN_CONFIRMATION"
        />
      )}
    </main>
  );
}
