export type Role = "CITIZEN" | "OFFICER" | "DEPARTMENT_ADMIN" | "SYSTEM_ADMIN";

export interface UserProfile {
  id: string;
  fullName: string;
  role: Role;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  jurisdictionName?: string;
  avatarUrl?: string;
  phone?: string;
  email: string;
}

export type GrievanceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "AI_ANALYZING"
  | "EVIDENCE_REVIEW"
  | "ASSIGNED"
  | "NOTIFIED"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "OVERDUE"
  | "ESCALATED"
  | "REJECTED";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type EvidenceVerificationStatus =
  | "LIKELY_AUTHENTIC"
  | "NEEDS_VERIFICATION"
  | "POTENTIALLY_MANIPULATED"
  | "INSUFFICIENT_EVIDENCE";

export interface EvidenceItem {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  exifData?: {
    device?: string;
    lens?: string;
    dateTime?: string;
    bearing?: string;
    iso?: string;
    focalLength?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  matchPercentage: number;
  angleDescription: string;
  verificationStatus: EvidenceVerificationStatus;
  manipulationScore: number;
  syntheticAiScore: number;
  weatherCorrelation: string;
}

export interface AIAnalysis {
  category: string;
  subcategory: string;
  severityScore: number; // e.g. 8.8 / 10
  severityDescription: string;
  affectedPopulationEstimate: string; // e.g. "~14.5k daily commuters"
  durationText: string; // e.g. "3 days post-monsoon"
  jurisdiction: string; // e.g. "Dual-Dept: PMC Civil + MSEDCL"
  confidenceScore: number; // e.g. 94.2
  extractedEntities: string[];
  multimodalSummary: string;
}

export interface SimilarGrievance {
  id: string;
  grievanceNumber: string;
  title: string;
  similarityScore: number; // e.g. 92
  reportedAt: string;
  status: GrievanceStatus;
}

export interface AIRecommendation {
  recommendedAction: string;
  rationale: string;
  expectedResolutionHours: number;
  confidenceScore: number;
  status: "PENDING_REVIEW" | "ACCEPTED" | "MODIFIED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: string;
  modificationNotes?: string;
}

export interface AgentStep {
  id: string;
  actor: "CITIZEN" | "AI_AGENT" | "SYSTEM" | "AUTHORITY";
  title: string;
  timestamp: string;
  description: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  isCompleted: boolean;
  isPending?: boolean;
}

export interface SLAGovernance {
  slaCode: string;
  totalHours: number;
  elapsedHours: number;
  remainingHours: number;
  deadlineIso: string;
  escalationLevel: number;
  status: "ON_TRACK" | "APPROACHING" | "OVERDUE" | "ESCALATED";
  tiers: {
    tierNumber: number;
    title: string;
    designation: string;
    officerName: string;
    triggerCondition: string;
    status: "ACTIVE" | "UPCOMING" | "ESCALATED";
  }[];
}

export interface Grievance {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  originalTextLog: string;
  language: string;
  audioTranscript?: {
    marathi: string;
    model: string;
    duration: string;
    confidence: number;
  };
  citizen: {
    id: string;
    name: string;
    uid: string;
    isVerified: boolean;
    phoneMasked: string;
  };
  filedAt: string;
  priority: Priority;
  status: GrievanceStatus;
  ledgerHash: string;
  location: {
    ward: string;
    zone: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  sla: SLAGovernance;
  evidence: EvidenceItem[];
  aiAnalysis: AIAnalysis;
  similarComplaints: SimilarGrievance[];
  recommendation: AIRecommendation;
  agentTimeline: AgentStep[];
  authorityDirective?: {
    officerName: string;
    designation: string;
    loggedAt: string;
    directiveText: string;
    aiPolicyVerification: string;
  };
}

export interface AuditLogEntry {
  id: string;
  grievanceNumber?: string;
  timestamp: string;
  actorType: "CITIZEN" | "OFFICER" | "AI_AGENT" | "SYSTEM";
  actorName: string;
  action: string;
  details: string;
}

export interface AuthorityContact {
  id: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  office_address: string;
  department_name?: string;
  department_code?: string;
  jurisdiction_name?: string;
}

export interface EscalationTierInfo {
  tier: number;
  role: "FIELD_OFFICER" | "DEPARTMENT_ADMIN" | "SYSTEM_ADMIN" | string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  trigger_condition: string;
  sla_threshold_hours?: number;
}

export interface AuthorityResolutionResult {
  jurisdiction: string;
  category: string;
  department: string;
  responsible_authority: AuthorityContact;
  escalation_chain: EscalationTierInfo[];
  is_fallback: boolean;
  mapping_rule_id: string;
  resolution_timestamp: string;
}

