import { Role } from "@/lib/types";

export interface RoleConfig {
  key: Role;
  label: string;
  shortTitle: string;
  description: string;
  icon: string;
  defaultPath: string;
  badgeClass: string;
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  CITIZEN: {
    key: "CITIZEN",
    label: "Citizen Portal",
    shortTitle: "Citizen",
    description: "Public grievance reporting & real-time milestone tracking",
    icon: "person",
    defaultPath: "/citizen/dashboard",
    badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  },
  OFFICER: {
    key: "OFFICER",
    label: "Authority Officer",
    shortTitle: "Junior Engineer",
    description: "Field triage, evidence validation & crew dispatch execution",
    icon: "engineering",
    defaultPath: "/authority/dashboard",
    badgeClass: "bg-blue-100 text-blue-950 border border-blue-300",
  },
  DEPARTMENT_ADMIN: {
    key: "DEPARTMENT_ADMIN",
    label: "Department Admin",
    shortTitle: "Superintending Engineer",
    description: "Escalation oversight, inter-agency SLA management & resource routing",
    icon: "supervisor_account",
    defaultPath: "/authority/dashboard",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
  },
  SYSTEM_ADMIN: {
    key: "SYSTEM_ADMIN",
    label: "System Admin",
    shortTitle: "Municipal Commissioner",
    description: "Tamper-proof audit inspection, system parameters & global policy",
    icon: "admin_panel_settings",
    defaultPath: "/admin/dashboard",
    badgeClass: "bg-purple-100 text-purple-900 border border-purple-300",
  },
};

/**
 * Maps each role to its designated landing route after login
 */
export function getDefaultRouteForRole(role: Role): string {
  return ROLE_CONFIGS[role]?.defaultPath || "/citizen/dashboard";
}

/**
 * Checks if a user with a given role is authorized to visit the target pathname
 */
export function isRouteAllowedForRole(pathname: string, role: Role): boolean {
  // Public routes accessible by everyone
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico")
  ) {
    return true;
  }

  // Citizen paths
  if (pathname.startsWith("/citizen")) {
    return role === "CITIZEN" || role === "SYSTEM_ADMIN";
  }

  // Authority paths
  if (pathname.startsWith("/authority")) {
    return role === "OFFICER" || role === "DEPARTMENT_ADMIN" || role === "SYSTEM_ADMIN";
  }

  // Admin paths
  if (pathname.startsWith("/admin")) {
    // Dept admins can view audit logs, System admins have full admin access
    if (pathname.startsWith("/admin/audit")) {
      return role === "SYSTEM_ADMIN" || role === "DEPARTMENT_ADMIN";
    }
    return role === "SYSTEM_ADMIN";
  }

  // Default allow other unmatched routes
  return true;
}
