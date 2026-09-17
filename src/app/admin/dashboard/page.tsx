"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AdminTab = "overview" | "departments" | "officers" | "jurisdictions" | "sla_policies" | "settings";

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Form states
  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [newDept, setNewDept] = useState({ code: "", name: "", head_officer: "", contact_email: "", contact_phone: "", description: "" });
  const [showOfficerModal, setShowOfficerModal] = useState<boolean>(false);
  const [newOfficer, setNewOfficer] = useState({ name: "", designation: "", tier: "TIER_1_JE", department_code: "PMC-CIVIL", assigned_ward: "Ward 12", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (role !== "SYSTEM_ADMIN" && role !== "DEPARTMENT_ADMIN") {
        router.replace(`/auth/unauthorized?role=${role}&target=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isAuthenticated, authLoading, role, router, pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchOpts = { cache: "no-store" as RequestCache };
      const [ovRes, deptRes, offRes, jurRes, polRes, setRes] = await Promise.all([
        fetch(`/api/admin/overview?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/admin/departments?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/admin/officers?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/admin/jurisdictions?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/admin/escalation-policies?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/admin/settings?_t=${Date.now()}`, fetchOpts),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (offRes.ok) setOfficers(await offRes.json());
      if (jurRes.ok) setJurisdictions(await jurRes.json());
      if (polRes.ok) setPolicies(await polRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (role === "SYSTEM_ADMIN" || role === "DEPARTMENT_ADMIN")) {
      loadData();
    }
  }, [isAuthenticated, role]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });
      if (res.ok) {
        const created = await res.json();
        setShowDeptModal(false);
        setNewDept({ code: "", name: "", head_officer: "", contact_email: "", contact_phone: "", description: "" });
        setActionMessage("Department registered successfully with audit trail.");
        // Immediate local state update for instant UI refresh
        setDepartments((prev) => [...prev, created]);
        await loadData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || errData.error || "Failed to create department. Please check the code and inputs.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error: Failed to reach admin service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOfficer),
      });
      if (res.ok) {
        const created = await res.json();
        setShowOfficerModal(false);
        setNewOfficer({ name: "", designation: "", tier: "TIER_1_JE", department_code: "PMC-CIVIL", assigned_ward: "Ward 12", email: "", phone: "" });
        setActionMessage("Officer appointed and jurisdiction assigned.");
        // Immediate local state update for instant UI refresh
        setOfficers((prev) => [...prev, created]);
        await loadData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || errData.error || "Failed to appoint officer. Please check your inputs.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error: Failed to reach admin service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOfficer = async (officerId: string, officerName: string) => {
    if (!confirm(`Are you sure you want to remove officer '${officerName}'?`)) return;
    try {
      // Immediate local state update for instant UI response
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
      const res = await fetch(`/api/admin/officers/${encodeURIComponent(officerId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionMessage(`Officer '${officerName}' removed from directory.`);
        await loadData();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete officer:", err);
      await loadData();
    }
  };

  const handleDeleteDept = async (deptCode: string, deptName: string) => {
    if (!confirm(`Are you sure you want to remove department '${deptName}' (${deptCode})?`)) return;
    try {
      // Immediate local state update for instant UI response
      setDepartments((prev) => prev.filter((d) => d.code !== deptCode));
      const res = await fetch(`/api/admin/departments/${encodeURIComponent(deptCode)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionMessage(`Department '${deptName}' removed.`);
        await loadData();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete department:", err);
      await loadData();
    }
  };

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !currentValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setActionMessage(`System setting '${key}' updated to ${!currentValue}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !isAuthenticated || (role !== "SYSTEM_ADMIN" && role !== "DEPARTMENT_ADMIN")) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-on-surface-variant font-medium">
          {!isAuthenticated
            ? "Authentication required. Redirecting to login..."
            : "Clearance check: Admin clearance required. Redirecting..."}
        </span>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              System Administration &amp; Governance Console
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">
              Phase 17 Active
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            PMC Department management, officer hierarchy matrix, statutory SLA rules, and platform settings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/audit"
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5 transition-all text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
            <span>Audit Ledger</span>
          </Link>
          <Link
            href="/authority/analytics"
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Civic Analytics</span>
          </Link>
        </div>
      </div>

      {/* Action notification alert */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-surface-container">
        {[
          { id: "overview", label: "Overview & Health", icon: "dashboard" },
          { id: "departments", label: "PMC Departments", icon: "domain" },
          { id: "officers", label: "Officer Directory", icon: "badge" },
          { id: "jurisdictions", label: "Jurisdiction & Wards", icon: "map" },
          { id: "sla_policies", label: "SLA & Escalations", icon: "timer" },
          { id: "settings", label: "System Settings", icon: "tune" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
              <div className="text-xs text-on-surface-variant font-semibold uppercase">Departments</div>
              <div className="font-headline text-3xl font-extrabold text-on-surface mt-1">
                {overview?.total_departments ?? departments.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Active municipal divisions</div>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
              <div className="text-xs text-on-surface-variant font-semibold uppercase">On-Duty Officers</div>
              <div className="font-headline text-3xl font-extrabold text-primary mt-1">
                {overview?.active_officers ?? officers.length}
              </div>
              <div className="text-[11px] text-on-surface-variant font-medium mt-1">Tier 1, 2 &amp; 3 hierarchy</div>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
              <div className="text-xs text-on-surface-variant font-semibold uppercase">Wards &amp; Zones</div>
              <div className="font-headline text-3xl font-extrabold text-secondary mt-1">
                {overview?.total_jurisdictions ?? jurisdictions.length}
              </div>
              <div className="text-[11px] text-on-surface-variant font-medium mt-1">Pune Municipal Corporation</div>
            </div>
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card">
              <div className="text-xs text-on-surface-variant font-semibold uppercase">Statutory SLA Rules</div>
              <div className="font-headline text-3xl font-extrabold text-amber-600 mt-1">
                {overview?.active_sla_rules ?? 8}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">RTSA 2015 strict mode</div>
            </div>
          </div>

          {/* System Services Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[28px]">database</span>
              <div>
                <div className="text-xs font-bold text-on-surface">Supabase PostgreSQL + pgvector</div>
                <div className="text-[11px] text-emerald-600 font-semibold">
                  Status: {overview?.db_status || "connected"} · RLS Active
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[28px]">psychology</span>
              <div>
                <div className="text-xs font-bold text-on-surface">AI Multi-Agent Pipeline</div>
                <div className="text-[11px] text-blue-600 font-semibold">
                  Gemini 2.5 Flash + Fallback Heuristics
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
              <div>
                <div className="text-xs font-bold text-on-surface">SHA-256 Ledger Integrity</div>
                <div className="text-[11px] text-primary font-semibold">
                  Immutable Cryptographic Receipts Active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === "departments" && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface">PMC Municipal Departments</h2>
              <p className="text-[11px] text-on-surface-variant">Manage operational divisions and departmental heads</p>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Department
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Department Name</th>
                  <th className="py-2.5 px-3">Head Officer</th>
                  <th className="py-2.5 px-3">Contact Email</th>
                  <th className="py-2.5 px-3">Officers</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {departments.map((d: any) => (
                  <tr key={d.id} className="hover:bg-surface-container-low/40">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{d.code}</td>
                    <td className="py-3 px-3 font-semibold text-on-surface">
                      <div>{d.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-normal">{d.description}</div>
                    </td>
                    <td className="py-3 px-3 text-on-surface">{d.head_officer}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant">{d.contact_email}</td>
                    <td className="py-3 px-3 font-bold text-on-surface">{d.total_officers}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteDept(d.code, d.name)}
                        className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-500/10 font-bold text-[11px] transition-colors"
                        title="Remove department"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OFFICERS */}
      {activeTab === "officers" && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Authority Officers Directory &amp; Matrix</h2>
              <p className="text-[11px] text-on-surface-variant">
                Manage field junior engineers, executive divisional heads, and apex commissioners
              </p>
            </div>
            <button
              onClick={() => setShowOfficerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Appoint Officer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-2.5 px-3">Officer Name</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Assigned Ward</th>
                  <th className="py-2.5 px-3">Email &amp; Phone</th>
                  <th className="py-2.5 px-3">SLA Rate</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {officers.map((o: any) => (
                  <tr key={o.id} className="hover:bg-surface-container-low/40">
                    <td className="py-3 px-3 font-semibold text-on-surface flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {o.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{o.name}</span>
                    </td>
                    <td className="py-3 px-3 text-on-surface">{o.designation}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.tier === "TIER_3_AMC"
                            ? "bg-red-500/10 text-red-600"
                            : o.tier === "TIER_2_EE"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {o.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-primary font-bold">{o.department_code}</td>
                    <td className="py-3 px-3 font-semibold text-on-surface">{o.assigned_ward}</td>
                    <td className="py-3 px-3 text-[11px] text-on-surface-variant">
                      <div>{o.email}</div>
                      <div className="font-mono text-[10px]">{o.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{o.sla_compliance_rate}%</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteOfficer(o.id, o.name)}
                        className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-500/10 font-bold text-[11px] transition-colors"
                        title="Remove officer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: JURISDICTIONS */}
      {activeTab === "jurisdictions" && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Jurisdiction &amp; Ward Coverage Matrix</h2>
              <p className="text-[11px] text-on-surface-variant">Ward boundary postal codes and zonal office locations</p>
            </div>
            <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-xl">
              Apex Fallback: PMC Central Cell Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {jurisdictions.map((j: any) => (
              <div key={j.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-on-surface">
                    Ward {j.ward_number} · {j.name}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {j.zone}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant">{j.office_address}</div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-on-surface-variant font-semibold">Pincodes:</span>
                  {j.pincodes.map((pin: string) => (
                    <span key={pin} className="px-2 py-0.5 rounded bg-surface-container-lowest border border-surface-container font-mono text-[10px] text-primary">
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SLA POLICIES */}
      {activeTab === "sla_policies" && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Statutory SLA Rules &amp; Escalation Chain Policies</h2>
              <p className="text-[11px] text-on-surface-variant">
                Enforced in accordance with Maharashtra Right to Public Services Act (RTSA 2015)
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              72h Statutory Ceiling
            </span>
          </div>

          <div className="space-y-3">
            {policies.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{p.department_code}</span>
                    <span className="text-xs font-bold text-on-surface">Priority: {p.priority}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    AUTO-ESCALATION ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container">
                    <div className="text-[10px] text-on-surface-variant font-medium">Tier 1 Desk</div>
                    <div className="font-semibold text-on-surface mt-0.5">{p.tier1_role}</div>
                    <div className="text-[11px] text-blue-600 font-bold mt-1">SLA: {p.tier1_sla_hours} Hours</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container">
                    <div className="text-[10px] text-on-surface-variant font-medium">Tier 2 Division</div>
                    <div className="font-semibold text-on-surface mt-0.5">{p.tier2_role}</div>
                    <div className="text-[11px] text-amber-600 font-bold mt-1">SLA: {p.tier2_sla_hours} Hours</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container">
                    <div className="text-[10px] text-on-surface-variant font-medium">Tier 3 Apex HQ</div>
                    <div className="font-semibold text-on-surface mt-0.5">{p.tier3_role}</div>
                    <div className="text-[11px] text-red-500 font-bold mt-1">SLA: {p.tier3_sla_hours} Hours</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-card space-y-6">
          <div>
            <h2 className="text-sm font-bold text-on-surface">Global System Configuration &amp; Feature Flags</h2>
            <p className="text-[11px] text-on-surface-variant">Control AI inference models, autonomous sentinel loops, and safety switches</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-on-surface">Statutory RTSA Strict Mode</div>
                <div className="text-[11px] text-on-surface-variant">Enforces strict 72-hour maximum resolution deadline and pre-breach alerts</div>
              </div>
              <button
                onClick={() => handleToggleSetting("statutory_rtsa_strict_mode", settings?.statutory_rtsa_strict_mode ?? true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.statutory_rtsa_strict_mode ?? true
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {settings?.statutory_rtsa_strict_mode ?? true ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-on-surface">Citizen In-App Notifications Hub</div>
                <div className="text-[11px] text-on-surface-variant">Enables dynamic in-app notification center for citizen updates (Phase 15)</div>
              </div>
              <button
                onClick={() => handleToggleSetting("citizen_notifications_enabled", settings?.citizen_notifications_enabled ?? true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.citizen_notifications_enabled ?? true
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {settings?.citizen_notifications_enabled ?? true ? "ACTIVE" : "PAUSED"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-on-surface">Telephony / Voice Agent Module (Phase 18 Preview)</div>
                <div className="text-[11px] text-on-surface-variant">Toggles telephony voice intake adapter behind feature flag</div>
              </div>
              <button
                onClick={() => handleToggleSetting("telephony_voice_agent_enabled", settings?.telephony_voice_agent_enabled ?? false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.telephony_voice_agent_enabled ?? false
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {settings?.telephony_voice_agent_enabled ?? false ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-on-surface">Maintenance Mode</div>
                <div className="text-[11px] text-on-surface-variant">Suspends new citizen submissions while preserving authority review queues</div>
              </div>
              <button
                onClick={() => handleToggleSetting("maintenance_mode", settings?.maintenance_mode ?? false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.maintenance_mode ?? false
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {settings?.maintenance_mode ?? false ? "ACTIVE (OFFLINE)" : "NORMAL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-4 shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Add Municipal Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-on-surface-variant hover:text-on-surface text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Department Code</label>
                <input
                  required
                  placeholder="e.g. PMC-PARKS"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Department Name</label>
                <input
                  required
                  placeholder="e.g. Tree Authority & Garden Division"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Head Officer</label>
                <input
                  required
                  placeholder="e.g. Er. Rajesh Patil"
                  value={newDept.head_officer}
                  onChange={(e) => setNewDept({ ...newDept, head_officer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="parks.pmc@punecorporation.org"
                  value={newDept.contact_email}
                  onChange={(e) => setNewDept({ ...newDept, contact_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Phone</label>
                <input
                  required
                  placeholder="+91-20-25501105"
                  value={newDept.contact_phone}
                  onChange={(e) => setNewDept({ ...newDept, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? "Registering..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Appoint Officer */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-4 shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Appoint Authority Officer</h3>
              <button onClick={() => setShowOfficerModal(false)} className="text-on-surface-variant hover:text-on-surface text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Full Name</label>
                <input
                  required
                  placeholder="e.g. Er. Vikram Shinde"
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Designation</label>
                <input
                  required
                  placeholder="e.g. Junior Engineer (Drainage)"
                  value={newOfficer.designation}
                  onChange={(e) => setNewOfficer({ ...newOfficer, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Department</label>
                  <select
                    value={newOfficer.department_code}
                    onChange={(e) => setNewOfficer({ ...newOfficer, department_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.code}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Tier</label>
                  <select
                    value={newOfficer.tier}
                    onChange={(e) => setNewOfficer({ ...newOfficer, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="TIER_1_JE">Tier 1 (JE)</option>
                    <option value="TIER_2_EE">Tier 2 (EE)</option>
                    <option value="TIER_3_AMC">Tier 3 (AMC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Ward</label>
                  <select
                    value={newOfficer.assigned_ward}
                    onChange={(e) => setNewOfficer({ ...newOfficer, assigned_ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Ward 12">Ward 12</option>
                    <option value="Ward 10">Ward 10</option>
                    <option value="Ward 8">Ward 8</option>
                    <option value="Ward 4">Ward 4</option>
                    <option value="ALL_PMC_WARDS">All Wards</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="officer@punecorporation.org"
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Phone</label>
                <input
                  required
                  placeholder="+91-9822000000"
                  value={newOfficer.phone}
                  onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? "Appointing..." : "Appoint Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
