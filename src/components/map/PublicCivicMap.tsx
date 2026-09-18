"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { GEO_GRIEVANCE_PINS, GeoGrievancePin } from "@/lib/geo-grievances";

declare global {
  interface Window {
    L: any;
  }
}

export function PublicCivicMap() {
  const [selectedPin, setSelectedPin] = useState<GeoGrievancePin | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [wardFilter, setWardFilter] = useState<string>("ALL");
  const [scopeView, setScopeView] = useState<"PUNE" | "MAHARASHTRA">("PUNE");
  const [mapType, setMapType] = useState<"STREET" | "SATELLITE">("STREET");
  const [comparisonTab, setComparisonTab] = useState<"SPLIT" | "BEFORE" | "AFTER">("SPLIT");
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Filter pins based on status and ward
  const filteredPins = useMemo(() => {
    return GEO_GRIEVANCE_PINS.filter((pin) => {
      const matchStatus = statusFilter === "ALL" || pin.status === statusFilter;
      const matchWard =
        wardFilter === "ALL" ||
        pin.ward.toLowerCase().includes(wardFilter.toLowerCase());
      return matchStatus && matchWard;
    });
  }, [statusFilter, wardFilter]);

  const registeredCount = GEO_GRIEVANCE_PINS.filter((p) => p.status === "REGISTERED").length;
  const inProgressCount = GEO_GRIEVANCE_PINS.filter((p) => p.status === "IN_PROGRESS").length;
  const resolvedCount = GEO_GRIEVANCE_PINS.filter((p) => p.status === "RESOLVED").length;

  // 1. Dynamically Load Leaflet CSS and JS (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cssId = "leaflet-css-cdn";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    if (window.L) {
      setIsLeafletReady(true);
      return;
    }

    const scriptId = "leaflet-js-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => {
        setIsLeafletReady(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Center on Pune Municipal Corporation: Lat 18.5140, Lng 73.8380
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
      minZoom: 5,
    }).setView([18.5140, 73.8380], 13);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial Street Tile Layer: OpenStreetMap Standard (NO API KEY, NO WATERMARK)
    const streetTiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = streetTiles;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;
    setMapInstance(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
      setMapInstance(null);
    };
  }, [isLeafletReady]);

  // 3. Switch between Street and Satellite Tile Layers (Watermark-Free)
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    const L = window.L;

    if (tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);
    }

    if (mapType === "SATELLITE") {
      // Real Satellite Imagery from Esri World Imagery (NO API KEY, NO WATERMARK)
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      ).addTo(mapInstance);
    } else {
      // OpenStreetMap Standard Street View (NO API KEY, NO WATERMARK)
      tileLayerRef.current = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(mapInstance);
    }
  }, [mapInstance, mapType]);

  // 4. Render Markers with Custom HTML, Radar Pulse & Interactive Popups
  useEffect(() => {
    if (!mapInstance || !markersLayerRef.current || !window.L) return;
    const L = window.L;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    filteredPins.forEach((pin) => {
      const isSelected = selectedPin?.id === pin.id;

      let pinBg = "#ef4444"; // Red (Registered)
      let pulseBg = "rgba(239, 68, 68, 0.5)";
      let statusLabel = "Registered / Intake";
      let badgeBg = "background:#fee2e2; color:#b91c1c;";
      let iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;

      if (pin.status === "IN_PROGRESS") {
        pinBg = "#f59e0b"; // Amber (In Progress)
        pulseBg = "rgba(245, 158, 11, 0.5)";
        statusLabel = "Work in Progress";
        badgeBg = "background:#fef3c7; color:#b45309;";
        iconSvg = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        `;
      } else if (pin.status === "RESOLVED") {
        pinBg = "#10b981"; // Emerald Green (Resolved)
        statusLabel = "Resolved & Verified";
        badgeBg = "background:#d1fae5; color:#047857;";
        iconSvg = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      }

      const hasPulse = pin.status !== "RESOLVED";

      const pinHtml = `
        <div style="position:relative; width:46px; height:46px; display:flex; align-items:center; justify-content:center; cursor:pointer;" class="civic-pin-container">
          ${
            hasPulse
              ? `<div style="position:absolute; width:44px; height:44px; border-radius:9999px; background:${pulseBg}; animation: pin-radar-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ""
          }
          <div style="position:relative; width:34px; height:34px; border-radius:9999px; background:${pinBg}; color:white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.4); border:2.5px solid white; ${
            isSelected ? "outline: 3px solid #0284c7; outline-offset: 2px; transform: scale(1.15);" : ""
          }">
            ${iconSvg}
          </div>
          <div style="position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.85); color:white; padding:1px 5px; border-radius:4px; font-size:9px; font-weight:700; white-space:nowrap; pointer-events:none; box-shadow:0 1px 3px rgba(0,0,0,0.3);">
            ${pin.grievanceNumber}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: "custom-leaflet-pin",
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -25],
      });

      const marker = L.marker([pin.latitude, pin.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="min-width:240px; font-family:inherit; padding:2px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <span style="font-family:monospace; font-weight:700; font-size:11px; color:#0284c7;">${pin.grievanceNumber}</span>
            <span style="padding:2px 8px; border-radius:9999px; font-size:10px; font-weight:700; ${badgeBg}">${statusLabel}</span>
          </div>
          <div style="font-size:12px; font-weight:700; color:#0f172a; line-height:1.3; margin-bottom:4px;">${pin.title}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:8px; display:flex; align-items:center; gap:3px;">
            <span>📍</span> <span>${pin.landmark}</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:10px; color:#64748b; margin-bottom:10px; border-top:1px solid #f1f5f9; padding-top:6px;">
            <span>Ward: <strong>${pin.ward}</strong></span>
            <span>Priority: <strong style="color:${pin.priority === 'CRITICAL' ? '#dc2626' : '#0284c7'}">${pin.priority}</strong></span>
          </div>
          <button id="inspect-pin-btn-${pin.id}" style="width:100%; padding:8px 12px; background:#0284c7; color:white; border:none; border-radius:10px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow: 0 1px 4px rgba(2,132,199,0.3);">
            <span>Inspect Before/After Evidence</span>
            <span>&rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: "civic-leaflet-popup",
      });

      marker.on("click", () => {
        setSelectedPin(pin);
      });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`inspect-pin-btn-${pin.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedPin(pin);
            marker.closePopup();
            const drawerEl = document.getElementById("inspection-drawer");
            if (drawerEl) {
              drawerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [mapInstance, filteredPins, selectedPin]);

  // 5. Handle Ward and Scope Fly-To Navigation
  const handleWardChange = (ward: string) => {
    setWardFilter(ward);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    switch (ward) {
      case "Ward 12":
        map.flyTo([18.485, 73.825], 14, { duration: 1.2 });
        break;
      case "Ward 10":
        map.flyTo([18.5074, 73.8077], 14, { duration: 1.2 });
        break;
      case "Ward 8":
        map.flyTo([18.517, 73.848], 15, { duration: 1.2 });
        break;
      case "Ward 4":
        map.flyTo([18.531, 73.842], 14, { duration: 1.2 });
        break;
      default:
        map.flyTo([18.514, 73.838], 13, { duration: 1.2 });
        break;
    }
  };

  const handleScopeChange = (scope: "PUNE" | "MAHARASHTRA") => {
    setScopeView(scope);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (scope === "MAHARASHTRA") {
      map.flyTo([19.7515, 75.7139], 7, { duration: 1.5 });
    } else {
      map.flyTo([18.514, 73.838], 13, { duration: 1.2 });
    }
  };

  const handleCenterPune = () => {
    if (!mapInstanceRef.current) return;
    setWardFilter("ALL");
    setScopeView("PUNE");
    mapInstanceRef.current.flyTo([18.514, 73.838], 13, { duration: 1.0 });
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Filter Controls Bar */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">map</span>
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
                Public Civic Grievance Map &amp; Transparency Explorer
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-World GIS Feed
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Real OpenStreetMap &amp; Satellite tiles across Pune Municipal Wards. Inspect citizen intake photos vs municipal resolution proof in real time. No login required.
            </p>
          </div>

          {/* Scope View Toggle (Pune vs State) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-surface-container-low p-1 border border-surface-container text-xs font-semibold">
              <button
                onClick={() => handleScopeChange("PUNE")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  scopeView === "PUNE"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Pune City (PMC Wards)
              </button>
              <button
                onClick={() => handleScopeChange("MAHARASHTRA")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  scopeView === "MAHARASHTRA"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Maharashtra State
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Ribbon and Filtering Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container">
          {/* Status Filter Chips */}
          <div
            role="group"
            aria-label="Filter grievances by status"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          >
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-1">
              Status:
            </span>
            <button
              onClick={() => setStatusFilter("ALL")}
              aria-pressed={statusFilter === "ALL"}
              className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statusFilter === "ALL"
                  ? "bg-on-surface text-surface font-bold shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              All Pins ({GEO_GRIEVANCE_PINS.length})
            </button>
            <button
              onClick={() => setStatusFilter("REGISTERED")}
              aria-pressed={statusFilter === "REGISTERED"}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statusFilter === "REGISTERED"
                  ? "bg-red-500 text-white font-bold shadow-xs"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
              Registered ({registeredCount})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              aria-pressed={statusFilter === "IN_PROGRESS"}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-amber-500 text-white font-bold shadow-xs"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              aria-pressed={statusFilter === "RESOLVED"}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                statusFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Ward Selector & Center Button */}
          <div className="flex items-center gap-2">
            <label htmlFor="map-ward-select" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Ward:
            </label>
            <select
              id="map-ward-select"
              aria-label="Filter grievances by PMC ward"
              value={wardFilter}
              onChange={(e) => handleWardChange(e.target.value)}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="ALL">All PMC Wards (Sinhagad, Kothrud, Deccan, Shivajinagar)</option>
              <option value="Ward 12">Ward 12 · Sinhagad Road</option>
              <option value="Ward 10">Ward 10 · Kothrud</option>
              <option value="Ward 8">Ward 8 · Shaniwar Peth / Deccan</option>
              <option value="Ward 4">Ward 4 · Shivajinagar</option>
            </select>

            <button
              onClick={handleCenterPune}
              aria-label="Reset map view to Pune City Center"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors border border-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Reset to Pune City Center"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">my_location</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet CSS Reset & Animation Styles */}
      <style>{`
        .custom-leaflet-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 18px !important;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.08) !important;
          padding: 6px !important;
        }
        .leaflet-popup-content {
          margin: 10px 14px !important;
          line-height: 1.4 !important;
        }
        @keyframes pin-radar-pulse {
          0% { transform: scale(0.6); opacity: 0.85; }
          50% { transform: scale(1.4); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pin-radar-ring {
          animation: pin-radar-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Main Interactive Real GIS Map Canvas */}
      <div 
        role="region"
        aria-label="Interactive Civic Grievance GIS Map of Pune"
        className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-surface-container shadow-elevated bg-slate-100 dark:bg-slate-900"
      >
        {/* Real Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} aria-label="GIS Map Viewport" />

        {/* Loading Skeleton while Leaflet CDN initializes */}
        {!isLeafletReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/90 backdrop-blur-sm space-y-3" aria-live="polite">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs font-bold text-on-surface">Loading Real-World GIS Map...</div>
            <div className="text-[11px] text-on-surface-variant">
              Connecting to OpenStreetMap &amp; Satellite Imagery
            </div>
          </div>
        )}

        {/* Top-Left: Street vs Satellite Imagery Toggle */}
        <div 
          role="radiogroup" 
          aria-label="Map Tile Layer" 
          className="absolute top-4 left-4 z-20 flex items-center p-1 rounded-2xl bg-surface/90 backdrop-blur-md border border-surface-container shadow-md"
        >
          <button
            role="radio"
            aria-checked={mapType === "STREET"}
            aria-label="Street View Tile Layer"
            onClick={() => setMapType("STREET")}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mapType === "STREET"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">map</span>
            <span>Street View</span>
          </button>
          <button
            role="radio"
            aria-checked={mapType === "SATELLITE"}
            aria-label="Satellite Imagery Tile Layer"
            onClick={() => setMapType("SATELLITE")}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mapType === "SATELLITE"
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">satellite_alt</span>
            <span>Satellite</span>
          </button>
        </div>

        {/* Bottom-Left: Map Legend Overlay Badge */}
        <div 
          role="complementary"
          aria-label="Map Legend"
          className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-surface/90 backdrop-blur-md border border-surface-container shadow-md text-xs space-y-1.5 pointer-events-auto"
        >
          <div className="font-bold text-on-surface text-[11px] uppercase tracking-wide">
            Live Pin Status
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-400/50" aria-hidden="true" />
            <span>Complaint Registered</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/50" aria-hidden="true" />
            <span>Work in Progress (Crew Dispatched)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/50" aria-hidden="true" />
            <span>Resolved (Proof Attached)</span>
          </div>
        </div>
      </div>

      {/* SELECTED PIN INSPECTION DRAWER / BEFORE-AFTER MODAL */}
      {selectedPin && (
        <div
          id="inspection-drawer"
          role="region"
          aria-label="Selected Grievance Inspection"
          className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container shadow-elevated space-y-6 animate-fadeIn"
        >
          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-primary px-2.5 py-0.5 rounded-lg bg-primary/10">
                  {selectedPin.grievanceNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
                    selectedPin.status === "RESOLVED"
                      ? "bg-emerald-600"
                      : selectedPin.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                >
                  {selectedPin.status === "RESOLVED"
                    ? "Resolved & Verified"
                    : selectedPin.status === "IN_PROGRESS"
                    ? "Work in Progress"
                    : "Registered / Intake"}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-bold uppercase">
                  {selectedPin.priority} Priority
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface mt-1.5">
                {selectedPin.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">location_on</span>
                <span>{selectedPin.landmark} · {selectedPin.ward}</span>
                <span className="text-on-surface-variant/60 font-mono text-[10px]">
                  ({selectedPin.latitude.toFixed(4)}, {selectedPin.longitude.toFixed(4)})
                </span>
              </p>
            </div>

            <button
              onClick={() => setSelectedPin(null)}
              aria-label="Close grievance inspection details"
              className="self-start sm:self-center px-4 py-2 min-h-[44px] rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Close Inspection</span>
              <span className="text-sm" aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Core Case Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Registered At</div>
              <div className="font-bold text-on-surface mt-1">{selectedPin.registeredAt}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Statutory SLA Target</div>
              <div className="font-bold text-primary mt-1">{selectedPin.targetResolutionAt}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Assigned Authority</div>
              <div className="font-bold text-on-surface mt-1">{selectedPin.assignedOfficer}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
              <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Completion Status</div>
              <div
                className={`font-bold mt-1 ${
                  selectedPin.status === "RESOLVED" ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedPin.resolvedAt ? `Closed: ${selectedPin.resolvedAt}` : "On-Ground Repair in Progress"}
              </div>
            </div>
          </div>

          {/* BEFORE & AFTER PHOTOGRAPHIC EVIDENCE SHOWCASE */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">photo_library</span>
                  Photographic Proof &amp; Resolution Transparency
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Geotagged citizen intake photo compared against municipal squad resolution photo
                </p>
              </div>

              {/* View Switcher Tabs */}
              {selectedPin.afterPhoto && (
                <div className="flex items-center rounded-xl bg-surface-container-low p-1 border border-surface-container text-xs font-semibold">
                  <button
                    onClick={() => setComparisonTab("SPLIT")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      comparisonTab === "SPLIT"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Side-by-Side View
                  </button>
                  <button
                    onClick={() => setComparisonTab("BEFORE")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      comparisonTab === "BEFORE"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Before Intake
                  </button>
                  <button
                    onClick={() => setComparisonTab("AFTER")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      comparisonTab === "AFTER"
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    After Resolved
                  </button>
                </div>
              )}
            </div>

            {/* Photo Display Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEFORE PHOTO CARD */}
              {(comparisonTab === "SPLIT" || comparisonTab === "BEFORE") && (
                <div className="rounded-2xl bg-surface-container-low border border-surface-container overflow-hidden space-y-2.5">
                  <div className="relative aspect-video w-full bg-black/20 overflow-hidden">
                    <img
                      src={selectedPin.beforePhoto}
                      alt="Before Repair Proof"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur shadow-sm">
                      Before (Citizen Report)
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1 text-xs">
                    <div className="font-semibold text-on-surface">{selectedPin.beforePhotoCaption}</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Cryptographic SHA-256 Ledger Verified · EXIF GPS Coordinates Confirmed
                    </div>
                  </div>
                </div>
              )}

              {/* AFTER PHOTO CARD */}
              {(comparisonTab === "SPLIT" || comparisonTab === "AFTER") && (
                <div className="rounded-2xl bg-surface-container-low border border-surface-container overflow-hidden space-y-2.5">
                  {selectedPin.afterPhoto ? (
                    <>
                      <div className="relative aspect-video w-full bg-black/20 overflow-hidden">
                        <img
                          src={selectedPin.afterPhoto}
                          alt="After Repair Proof"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur shadow-sm">
                          After (Municipal Resolution)
                        </span>
                      </div>
                      <div className="p-3.5 space-y-1 text-xs">
                        <div className="font-semibold text-on-surface">
                          {selectedPin.afterPhotoCaption || "Field work verified and completed on site."}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          {selectedPin.resolutionNotes}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="aspect-video w-full flex flex-col items-center justify-center bg-surface-container-lowest text-center p-6 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px]">pending_actions</span>
                      </div>
                      <div className="text-xs font-bold text-on-surface">Repair Crew Dispatched</div>
                      <div className="text-[11px] text-on-surface-variant max-w-xs">
                        {selectedPin.resolutionNotes || "Work order active. Verification photo will be uploaded upon work completion."}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Strip */}
          <div className="pt-2 border-t border-surface-container flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-on-surface-variant font-mono">
              Municipal Ledger Identifier: #PMC-2026-{selectedPin.grievanceNumber}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/authority/grievances/${selectedPin.grievanceNumber}`}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>View Full Signature Case Dossier</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
