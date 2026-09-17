export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CivicRole = "CITIZEN" | "OFFICER" | "DEPARTMENT_ADMIN" | "SYSTEM_ADMIN";
export type GrievancePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
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

export type VerificationStatus =
  | "LIKELY_AUTHENTIC"
  | "NEEDS_VERIFICATION"
  | "POTENTIALLY_MANIPULATED"
  | "INSUFFICIENT_EVIDENCE";

export type CommChannel = "SMS" | "WHATSAPP" | "EMAIL" | "PUSH";

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      jurisdictions: {
        Row: {
          id: string;
          name: string;
          code: string;
          type: "CITY" | "ZONE" | "WARD";
          parent_id: string | null;
          boundary_geojson: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          type: "CITY" | "ZONE" | "WARD";
          parent_id?: string | null;
          boundary_geojson?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          type?: "CITY" | "ZONE" | "WARD";
          parent_id?: string | null;
          boundary_geojson?: Json | null;
          created_at?: string;
        };
      };
      authorities: {
        Row: {
          id: string;
          name: string;
          designation: string;
          department_id: string;
          jurisdiction_id: string | null;
          email: string;
          phone: string | null;
          escalation_parent_id: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          designation: string;
          department_id: string;
          jurisdiction_id?: string | null;
          email: string;
          phone?: string | null;
          escalation_parent_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          designation?: string;
          department_id?: string;
          jurisdiction_id?: string | null;
          email?: string;
          phone?: string | null;
          escalation_parent_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: CivicRole;
          designation: string | null;
          department_id: string | null;
          authority_id: string | null;
          jurisdiction_id: string | null;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: CivicRole;
          designation?: string | null;
          department_id?: string | null;
          authority_id?: string | null;
          jurisdiction_id?: string | null;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: CivicRole;
          designation?: string | null;
          department_id?: string | null;
          authority_id?: string | null;
          jurisdiction_id?: string | null;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grievances: {
        Row: {
          id: string;
          grievance_number: string;
          citizen_id: string | null;
          title: string;
          description: string;
          original_text_log: string | null;
          language: string | null;
          category: string;
          subcategory: string | null;
          department_id: string | null;
          jurisdiction_id: string | null;
          authority_id: string | null;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          priority: GrievancePriority;
          status: GrievanceStatus;
          duration_text: string | null;
          affected_population: number | null;
          ledger_hash: string | null;
          expected_resolution_at: string | null;
          audio_transcript: Json | null;
          authority_directive: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grievance_number: string;
          citizen_id?: string | null;
          title: string;
          description: string;
          original_text_log?: string | null;
          language?: string | null;
          category: string;
          subcategory?: string | null;
          department_id?: string | null;
          jurisdiction_id?: string | null;
          authority_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          priority?: GrievancePriority;
          status?: GrievanceStatus;
          duration_text?: string | null;
          affected_population?: number | null;
          ledger_hash?: string | null;
          expected_resolution_at?: string | null;
          audio_transcript?: Json | null;
          authority_directive?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grievance_number?: string;
          citizen_id?: string | null;
          title?: string;
          description?: string;
          original_text_log?: string | null;
          language?: string | null;
          category?: string;
          subcategory?: string | null;
          department_id?: string | null;
          jurisdiction_id?: string | null;
          authority_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          priority?: GrievancePriority;
          status?: GrievanceStatus;
          duration_text?: string | null;
          affected_population?: number | null;
          ledger_hash?: string | null;
          expected_resolution_at?: string | null;
          audio_transcript?: Json | null;
          authority_directive?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          grievance_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          sha256: string;
          metadata: Json;
          verification_status: VerificationStatus;
          risk_score: number | null;
          analysis: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          grievance_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          sha256: string;
          metadata?: Json;
          verification_status?: VerificationStatus;
          risk_score?: number | null;
          analysis?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          grievance_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          file_size?: number;
          sha256?: string;
          metadata?: Json;
          verification_status?: VerificationStatus;
          risk_score?: number | null;
          analysis?: Json;
          created_at?: string;
        };
      };
      ai_analyses: {
        Row: {
          id: string;
          grievance_id: string;
          model_name: string;
          category: string;
          subcategory: string | null;
          severity_score: number | null;
          severity_description: string | null;
          summary: string;
          affected_population_estimate: string | null;
          duration_text: string | null;
          jurisdiction_text: string | null;
          department_id: string | null;
          jurisdiction_id: string | null;
          priority: GrievancePriority;
          entities: Json;
          recommended_action: string | null;
          recommendation_rationale: string | null;
          confidence: number | null;
          raw_output: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          grievance_id: string;
          model_name: string;
          category: string;
          subcategory?: string | null;
          severity_score?: number | null;
          severity_description?: string | null;
          summary: string;
          affected_population_estimate?: string | null;
          duration_text?: string | null;
          jurisdiction_text?: string | null;
          department_id?: string | null;
          jurisdiction_id?: string | null;
          priority: GrievancePriority;
          entities?: Json;
          recommended_action?: string | null;
          recommendation_rationale?: string | null;
          confidence?: number | null;
          raw_output?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          grievance_id?: string;
          model_name?: string;
          category?: string;
          subcategory?: string | null;
          severity_score?: number | null;
          severity_description?: string | null;
          summary?: string;
          affected_population_estimate?: string | null;
          duration_text?: string | null;
          jurisdiction_text?: string | null;
          department_id?: string | null;
          jurisdiction_id?: string | null;
          priority?: GrievancePriority;
          entities?: Json;
          recommended_action?: string | null;
          recommendation_rationale?: string | null;
          confidence?: number | null;
          raw_output?: Json | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          grievance_id: string | null;
          grievance_number: string | null;
          actor_type: "CITIZEN" | "OFFICER" | "AI_AGENT" | "SYSTEM";
          actor_name: string;
          actor_id: string | null;
          action: string;
          details: string;
          before_data: Json | null;
          after_data: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          grievance_id?: string | null;
          grievance_number?: string | null;
          actor_type: "CITIZEN" | "OFFICER" | "AI_AGENT" | "SYSTEM";
          actor_name: string;
          actor_id?: string | null;
          action: string;
          details: string;
          before_data?: Json | null;
          after_data?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          grievance_id?: string | null;
          grievance_number?: string | null;
          actor_type?: "CITIZEN" | "OFFICER" | "AI_AGENT" | "SYSTEM";
          actor_name?: string;
          actor_id?: string | null;
          action?: string;
          details?: string;
          before_data?: Json | null;
          after_data?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      sla_rules: {
        Row: {
          id: string;
          sla_code: string;
          department_id: string | null;
          category: string | null;
          acknowledgement_hours: number;
          resolution_hours: number;
          reminder_before_hours: number;
          escalation_after_hours: number;
          statutory_framework: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sla_code: string;
          department_id?: string | null;
          category?: string | null;
          acknowledgement_hours?: number;
          resolution_hours?: number;
          reminder_before_hours?: number;
          escalation_after_hours?: number;
          statutory_framework?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sla_code?: string;
          department_id?: string | null;
          category?: string | null;
          acknowledgement_hours?: number;
          resolution_hours?: number;
          reminder_before_hours?: number;
          escalation_after_hours?: number;
          statutory_framework?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      agent_actions: {
        Row: {
          id: string;
          agent_run_id: string | null;
          grievance_id: string;
          actor: "CITIZEN" | "AI_AGENT" | "SYSTEM" | "AUTHORITY";
          action_type: string;
          tool_name: string | null;
          title: string;
          description: string;
          icon: string | null;
          input: Json | null;
          output: Json | null;
          success: boolean;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_run_id?: string | null;
          grievance_id: string;
          actor: "CITIZEN" | "AI_AGENT" | "SYSTEM" | "AUTHORITY";
          action_type: string;
          tool_name?: string | null;
          title: string;
          description: string;
          icon?: string | null;
          input?: Json | null;
          output?: Json | null;
          success?: boolean;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_run_id?: string | null;
          grievance_id?: string;
          actor?: "CITIZEN" | "AI_AGENT" | "SYSTEM" | "AUTHORITY";
          action_type?: string;
          tool_name?: string | null;
          title?: string;
          description?: string;
          icon?: string | null;
          input?: Json | null;
          output?: Json | null;
          success?: boolean;
          is_completed?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
