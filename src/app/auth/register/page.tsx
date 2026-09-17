"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithPersona } = useAuth();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("Ward 12 - Sinhagad Zone");
  const [aadhaarConsent, setAadhaarConsent] = useState(true);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate user creation and login as Citizen
    loginWithPersona("CITIZEN");
    router.push("/citizen/dashboard");
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
          <span className="font-headline text-2xl font-bold text-primary">NagrikAI</span>
        </Link>
        <h1 className="text-xl font-bold text-on-surface pt-2">
          Citizen Portal Registration
        </h1>
        <p className="text-xs text-on-surface-variant">
          Register with Maharashtra Right to Public Services Act (RTS) Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-6 px-4 shadow-card rounded-2xl sm:px-8 border border-surface-container">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface">
                Full Name (as per Aadhaar / Official ID)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Shankar Kulkarni"
                className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface">
                Mobile Number
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
              <label className="block text-xs font-semibold text-on-surface">
                Primary Residential Ward (Pune Municipal Corporation)
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="mt-1 w-full p-2.5 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface font-semibold"
              >
                <option>Ward 12 - Sinhagad Zone (PMC)</option>
                <option>Ward 8 - Shaniwar Peth / Central Pune</option>
                <option>Ward 10 - Kothrud Depot Zone</option>
                <option>Ward 4 - Aundh / Baner</option>
              </select>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="aadhaar-consent"
                checked={aadhaarConsent}
                onChange={(e) => setAadhaarConsent(e.target.checked)}
                className="mt-0.5 rounded border-surface-container text-emerald-600 focus:ring-emerald-500"
                required
              />
              <label htmlFor="aadhaar-consent" className="text-[11px] text-on-surface-variant leading-tight">
                I authorize verification of my mobile credentials with Digilocker/UIDAI for automated municipal complaint authenticity tracking.
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Complete Registration</span>
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-xs text-on-surface-variant hover:text-emerald-700 font-medium"
              >
                Already registered? <strong className="underline">Sign in here</strong>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
