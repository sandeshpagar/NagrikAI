"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGrievances } from "@/context/GrievanceContext";
import { Role } from "@/lib/types";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps = {}) {
  const { role, currentUser, switchRole, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markNotificationRead } = useGrievances();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const roles: { key: Role; label: string; desc: string; icon: string }[] = [
    {
      key: "OFFICER",
      label: "Authority Officer",
      desc: "PMC Ward 12 Engineering",
      icon: "badge",
    },
    {
      key: "CITIZEN",
      label: "Citizen Portal",
      desc: "Ramesh Kulkarni (Citizen)",
      icon: "person",
    },
    {
      key: "DEPARTMENT_ADMIN",
      label: "Department Admin",
      desc: "Superintending Engineer (West)",
      icon: "supervisor_account",
    },
    {
      key: "SYSTEM_ADMIN",
      label: "System Admin",
      desc: "Addl. Municipal Commissioner",
      icon: "admin_panel_settings",
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
      <div className="h-16 w-full px-space-md flex items-center justify-between gap-space-md">
        {/* Left: Hamburger & Brand Emblem */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center justify-center"
              title="Toggle Sidebar Menu"
              aria-label="Toggle Sidebar Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          )}
          <Link href="/" className="flex items-center gap-3">
            <img
              alt="NagrikAI Official Emblem"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_rHO2eON6emV5NfZ-ea189OcGnfzLXDWv5gUw0-FUWf8ynzIqT8D3gGoq3P8xhZZ1iRNbwwyPetryotWkLRrAOqxFmY76h3hYKd-crvdz7lR3M1YxBF3ft83TuuHdgmBuT5tSMNtPUriFyHD4CG7dorwfbGznAqIiQQpqrsdTyHY3gDbNKW0MERxYdzDiZTQxCA4fUn0j3j7vUr8nehU0w_oWlPYOwhhmJNv9At_ZIGDzlRiG158KOA"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline text-xl text-primary tracking-tight font-bold">
                  NagrikAI
                </span>
                <span className="hidden lg:inline-flex items-center px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">
                  Govt / Municipal
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant leading-none">
                नागरिक AI · Civic Intelligence Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Sentinel Telemetry Badge (Desktop) */}
        <div className="hidden 2xl:flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container-low text-secondary font-medium text-xs shrink-0 border border-surface-container">
          <span className="material-symbols-outlined text-[14px] text-secondary animate-pulse">
            radio_button_checked
          </span>
          <span>AI Follow-up Agent: Monitoring 1,420 Active Grievances · 98.4% SLA Compliance</span>
        </div>

        {/* Right: Search, Language, Notifications, Role Switcher */}
        <div className="flex items-center justify-end gap-3 flex-1">
          {/* Search Box */}
          <div className="relative max-w-xs w-full hidden md:block">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search GRV-2026-1042..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-high transition-colors border border-transparent focus:border-primary/20"
            />
          </div>

          {/* Multilingual Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant text-xs px-2.5 py-1 rounded bg-surface-container-low">
            <span className="material-symbols-outlined text-[16px]">translate</span>
            <span>English | हिन्दी | मराठी</span>
          </div>

          {/* Notification Center */}
          {/* Unauthenticated State: Clean Sign In CTA */}
          {!isAuthenticated ? (
            <Link
              href="/auth/login"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              <span>Official Sign In</span>
            </Link>
          ) : (
            <>
              {/* Notifications Hub */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  title="Notifications"
                >
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-error-foreground text-[10px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-elevated border border-surface-container p-2 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between p-2 border-b border-surface-container">
                      <span className="font-semibold text-xs text-on-surface">Notifications</span>
                      <span className="text-[11px] text-primary font-medium">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-surface-container">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 hover:bg-surface-container-low cursor-pointer transition-colors ${
                            !n.read ? "bg-surface-container-low/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs text-on-surface">{n.title}</span>
                            <span className="text-[10px] text-on-surface-variant">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left"
                >
                  <img
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/20"
                    src={currentUser.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBIQi0Wax_aYH0YvIgha4da_y5mQJE-k7LaKsFCkGnd8MCfSABdc1QNU-8X-LeGBu6U5euyrGNPoHs_zmUqFaktsCtcNkOLk0rfnVlanJQ9XrHVLfwpA_e4NeclXfwJJVHup9QVIK6eYdFVHzCzqFw-wZHqu47I6leMKsRr-HFQoK568Z9vVL6NAV3yRz2MBz7K2y8OuA-Pm-YxW6Fur7w0xbAT9bYokIKoJf2s66xZeGhhNd_zUdFW4w"}
                  />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs text-on-surface font-semibold leading-tight flex items-center gap-1">
                      {currentUser.fullName}
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant leading-tight">
                      {currentUser.designation || currentUser.role}
                    </span>
                  </div>
                </button>

                {/* Role Dropdown */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-elevated border border-surface-container p-2 z-50">
                    <div className="px-2 py-1 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Switch Active Role
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {roles.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => {
                            switchRole(r.key);
                            setShowRoleMenu(false);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                            role === r.key
                              ? "bg-blue-100 text-blue-950 font-bold border border-blue-300"
                              : "hover:bg-surface-container text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{r.label}</span>
                            <span className="text-[10px] opacity-80">{r.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 mt-2 border-t border-surface-container flex flex-col gap-0.5">
                      <Link
                        href="/auth/login"
                        onClick={() => setShowRoleMenu(false)}
                        className="p-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">swap_horiz</span>
                        <span>Switch Persona / Login</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          logout();
                        }}
                        className="p-2 rounded-lg text-xs font-bold text-error hover:bg-error-container/40 flex items-center gap-2 transition-colors text-left w-full"
                      >
                        <span className="material-symbols-outlined text-[18px] text-error">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
