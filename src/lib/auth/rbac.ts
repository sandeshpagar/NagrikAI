import { Role } from "@/lib/types";

export type Permission =
  | "grievance:create"
  | "grievance:view_own"
  | "grievance:view_all"
  | "grievance:accept_recommendation"
  | "grievance:modify_directive"
  | "grievance:reject_recommendation"
  | "grievance:assign_crew"
  | "grievance:escalate"
  | "sla:configure_rules"
  | "audit:view_ledger"
  | "analytics:view_department"
  | "analytics:view_system"
  | "admin:manage_authorities"
  | "admin:manage_jurisdictions";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CITIZEN: [
    "grievance:create",
    "grievance:view_own",
  ],
  OFFICER: [
    "grievance:view_all",
    "grievance:accept_recommendation",
    "grievance:modify_directive",
    "grievance:reject_recommendation",
    "grievance:assign_crew",
    "grievance:escalate",
    "analytics:view_department",
  ],
  DEPARTMENT_ADMIN: [
    "grievance:view_all",
    "grievance:accept_recommendation",
    "grievance:modify_directive",
    "grievance:reject_recommendation",
    "grievance:assign_crew",
    "grievance:escalate",
    "sla:configure_rules",
    "analytics:view_department",
    "audit:view_ledger",
  ],
  SYSTEM_ADMIN: [
    "grievance:create",
    "grievance:view_own",
    "grievance:view_all",
    "grievance:accept_recommendation",
    "grievance:modify_directive",
    "grievance:reject_recommendation",
    "grievance:assign_crew",
    "grievance:escalate",
    "sla:configure_rules",
    "audit:view_ledger",
    "analytics:view_department",
    "analytics:view_system",
    "admin:manage_authorities",
    "admin:manage_jurisdictions",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
