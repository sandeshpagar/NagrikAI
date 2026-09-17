"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { ROLE_CONFIGS } from "@/lib/auth/roles";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect");
  const { loginWithPersona, loginWithPassword, loginWithOtp, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"CITIZEN" | "OFFICER">("CITIZEN");

  // Citizen Mobile OTP State
  const [mobile, setMobile] = useState("9822012345");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [citizenError, setCitizenError] = useState("");

  // Officer Credentials State
  const [officerEmail, setOfficerEmail] = useState("rajesh.sharma@pmc.gov.in");
  const [officerPassword, setOfficerPassword] = useState("password123");
  const [officerRole, setOfficerRole] = useState<Role>("OFFICER");
  const [officerError, setOfficerError] = useState("");

  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenError("");
    const res = await loginWithOtp(mobile, otp, redirectTarget || undefined);
    if (!res.success && res.error) {
      setCitizenError(res.error);
    }
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError("");
    const res = await loginWithPassword(
      officerEmail,
      officerPassword,
      officerRole,
      redirectTarget || undefined
    );
    if (!res.success && res.error) {
      setOfficerError(res.error);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-3">
          <img
            alt="NagrikAI Official Emblem"
            className="h-10 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_rHO2eON6emV5NfZ-ea189OcGnfzLXDWv5gUw0-FUWf8ynzIqT8D3gGoq3P8xhZZ1iRNbwwyPetryotWkLRrAOqxFmY76h3hYKd-crvdz7lR3M1YxBF3ft83TuuHdgmBuT5tSMNtPUriFyHD4CG7dorwfbGznAqIiQQpqrsdTyHY3gDbNKW0MERxYdzDiZTQxCA4fUn0j3j7vUr8nehU0w_oWlPYOwhhmJNv9At_ZIGDzlRiG158KOA"
          />
          <div className="text-left">
            <span className="font-headline text-2xl font-bold text-primary block leading-none">
              NagrikAI
            </span>
            <span className="text-[11px] text-on-surface-variant leading-none">
              Civic Intelligence &amp; Governance Portal
            </span>
          </div>
        </Link>
        <h1 className="text-xl font-bold text-on-surface pt-2">
          Secure Platform Authentication
        </h1>
        <p className="text-xs text-on-surface-variant">
          Sign in to access your civic services, officer queue, or municipal governance
        </p>

        {redirectTarget && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-left flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-700">lock</span>
            <span>Authentication required to access: <code className="font-mono font-bold">{redirectTarget}</code></span>
          </div>
        )}
      </div>

      {/* Main Authentication Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-6 px-4 shadow-card rounded-2xl sm:px-8 border border-surface-container space-y-5">
          {/* Tab Switcher: Citizen vs Authority */}
          <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl border border-surface-container">
            <button
              type="button"
              onClick={() => setActiveTab("CITIZEN")}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "CITIZEN"
                  ? "bg-surface-container-lowest text-emerald-800 shadow-sm border border-surface-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Citizen Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("OFFICER")}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "OFFICER"
                  ? "bg-surface-container-lowest text-blue-900 shadow-sm border border-surface-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Municipal Authority</span>
            </button>
          </div>

          {/* Citizen Tab Form */}
          {activeTab === "CITIZEN" && (
            <form onSubmit={handleCitizenLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Mobile Number (Aadhaar / Digilocker Linked)
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-on-surface-variant font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="98220 12345"
                    className="w-full pl-12 pr-3 py-2 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-emerald-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-on-surface">
                    One-Time Passcode (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(true);
                      setOtp("123456");
                    }}
                    className="text-[11px] text-emerald-700 hover:underline font-bold"
                  >
                    {otpSent ? "Resend Demo OTP" : "Send Demo OTP"}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-emerald-600 font-mono tracking-widest text-center font-bold"
                  required
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Demo access: Enter code <strong className="text-emerald-800">123456</strong> for instant login.
                </p>
              </div>

              {citizenError && (
                <div className="p-2 rounded-lg bg-red-50 text-red-800 text-xs font-medium border border-red-200">
                  {citizenError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>{isLoading ? "Verifying..." : "Verify & Open Citizen Dashboard"}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/auth/register"
                  className="text-xs text-on-surface-variant hover:text-emerald-700 font-medium"
                >
                  New citizen? <strong className="underline">Register your profile here</strong>
                </Link>
              </div>
            </form>
          )}

          {/* Authority Tab Form */}
          {activeTab === "OFFICER" && (
            <form onSubmit={handleOfficerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Official Government Email (PMC / Urban Dev)
                </label>
                <input
                  type="email"
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder="officer.name@pmc.gov.in"
                  className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Password
                </label>
                <input
                  type="password"
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-blue-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Official Authority Role
                </label>
                <select
                  value={officerRole}
                  onChange={(e) => setOfficerRole(e.target.value as Role)}
                  className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface font-semibold"
                >
                  <option value="OFFICER">Authority Officer (Junior Engineer / Field Officer)</option>
                  <option value="DEPARTMENT_ADMIN">Department Admin (Superintending Engineer)</option>
                  <option value="SYSTEM_ADMIN">System Admin (Additional Municipal Commissioner)</option>
                </select>
              </div>

              {officerError && (
                <div className="p-2 rounded-lg bg-red-50 text-red-800 text-xs font-medium border border-red-200">
                  {officerError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>{isLoading ? "Authenticating..." : "Sign In to Official Console"}</span>
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
              </button>
            </form>
          )}
        </div>

        {/* 1-Click Evaluator Personas Section */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-container"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-[11px] font-bold text-on-surface-variant tracking-wider">
                Instant Evaluator Personas (1-Click Test)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(ROLE_CONFIGS) as Role[]).map((rKey) => {
              const cfg = ROLE_CONFIGS[rKey];
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => loginWithPersona(rKey, redirectTarget || undefined)}
                  className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container hover:border-primary/40 hover:bg-surface-container-low transition-all text-left flex items-start gap-2.5 shadow-sm group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.badgeClass}`}>
                    <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                        {cfg.shortTitle}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">
                      {cfg.description}
                    </p>
                    <span className="text-[10px] text-primary font-semibold mt-0.5 inline-block">
                      Opens {cfg.defaultPath} &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-on-surface-variant font-medium">Loading NagrikAI Portal...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}

