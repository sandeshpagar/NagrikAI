"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Grievance, GrievanceStatus, AuditLogEntry } from "@/lib/types";
import { MOCK_GRIEVANCES, INITIAL_AUDIT_LOGS, INITIAL_GRIEVANCE_1042 } from "@/lib/mock-data";
import { getGrievancesFromDb, getAuditLogsFromDb, insertGrievanceToDb } from "@/lib/supabase/db";

export interface NotificationItem {
  id: string;
  grievance_id?: string;
  grievanceNumber?: string;
  citizen_id?: string;
  title: string;
  message: string;
  time?: string;
  created_at?: string;
  event_type?: string;
  type: "info" | "warning" | "success" | "alert";
  channel?: string;
  read: boolean;
  metadata?: any;
}

interface GrievanceContextType {
  grievances: Grievance[];
  activeGrievance: Grievance;
  auditLogs: AuditLogEntry[];
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (item: Partial<NotificationItem>) => void;
  getGrievanceByNumber: (num: string) => Grievance | undefined;
  acceptRecommendation: (grievanceId: string) => void;
  modifyRecommendation: (grievanceId: string, customAction: string, reason: string) => void;
  rejectRecommendation: (grievanceId: string, reason: string) => void;
  updateStatus: (grievanceId: string, newStatus: GrievanceStatus, notes?: string) => void;
  postAuthorityDirective: (grievanceId: string, directiveText: string) => void;
  triggerCitizenUpdate: (grievanceId: string) => void;
  escalateGrievance: (grievanceId: string, reason: string) => void;
  submitNewGrievance: (data: Partial<Grievance>) => Grievance;
}

const GrievanceContext = createContext<GrievanceContextType | undefined>(undefined);


export function GrievanceProvider({ children }: { children: React.ReactNode }) {
  const [grievances, setGrievances] = useState<Grievance[]>(MOCK_GRIEVANCES);
  const [activeGrievance, setActiveGrievance] = useState<Grievance>(INITIAL_GRIEVANCE_1042);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-seed-08",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "SLA Escalation Triggered",
      message: "Grievance escalated to Tier 2 (Superintending Engineer Er. Sunita Deshpande) for expedited executive oversight.",
      event_type: "ESCALATION",
      type: "alert",
      channel: "ALL",
      read: false,
      created_at: "2026-09-17T17:35:00.000Z",
      time: "10m ago",
      metadata: { tier: 2, authority: "Er. Sunita Deshpande" }
    },
    {
      id: "notif-seed-07",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Field Inspection & Action Scheduled",
      message: "Ward 12 rapid road repair squad dispatched. Cold-mix asphalt patching committed for 18 Sep 2026.",
      event_type: "EXPECTED_ACTION",
      type: "info",
      channel: "WHATSAPP",
      read: false,
      created_at: "2026-09-17T17:00:00.000Z",
      time: "45m ago",
      metadata: { scheduled_date: "2026-09-18T10:00:00Z" }
    },
    {
      id: "notif-seed-06",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Status Updated to In Progress",
      message: "Municipal civil engineer acknowledged the complaint and accepted the AI recommended standard operating procedure.",
      event_type: "STATUS_CHANGE",
      type: "info",
      channel: "IN_APP",
      read: false,
      created_at: "2026-09-17T15:45:00.000Z",
      time: "2h ago",
      metadata: { new_status: "IN_PROGRESS" }
    },
    {
      id: "notif-seed-05",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Evidence Request: Additional Landmarks",
      message: "AI verification engine requested clear intersection photos to pinpoint storm drain blockage near Sinhagad Road.",
      event_type: "EVIDENCE_REQUEST",
      type: "warning",
      channel: "SMS",
      read: true,
      created_at: "2026-09-17T14:15:00.000Z",
      time: "3h ago",
      metadata: { requested_item: "Intersection landmark photo" }
    },
    {
      id: "notif-seed-04",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Statutory RTSA Official Acknowledgement",
      message: "Formal receipt acknowledged under Maharashtra RTSA 2015. 72-hour statutory SLA clock commenced.",
      event_type: "ACKNOWLEDGEMENT",
      type: "success",
      channel: "SMS",
      read: true,
      created_at: "2026-09-17T12:05:00.000Z",
      time: "5h ago",
      metadata: { sla_hours: 72 }
    },
    {
      id: "notif-seed-03",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Authority Mapped: PMC Ward 12",
      message: "Assigned to Er. Rajesh Sharma (Executive Engineer, PMC Road Maintenance Division).",
      event_type: "ASSIGNMENT",
      type: "info",
      channel: "ALL",
      read: true,
      created_at: "2026-09-17T11:55:00.000Z",
      time: "6h ago",
      metadata: { officer: "Er. Rajesh Sharma", ward: "Ward 12" }
    },
    {
      id: "notif-seed-02",
      grievance_id: "GRV-2026-1042",
      grievanceNumber: "GRV-2026-1042",
      citizen_id: "citizen-001",
      title: "Grievance Lodged Successfully",
      message: "Case GRV-2026-1042 recorded with 2 geotagged photos and DigiLocker Aadhaar verification.",
      event_type: "SUBMISSION",
      type: "success",
      channel: "ALL",
      read: true,
      created_at: "2026-09-17T10:32:00.000Z",
      time: "7h ago",
      metadata: { tracking_id: "GRV-2026-1042" }
    },
    {
      id: "notif-seed-01",
      grievance_id: "GRV-2026-1038",
      grievanceNumber: "GRV-2026-1038",
      citizen_id: "citizen-001",
      title: "Case Resolved: Streetlight Restored",
      message: "Work order completed. Luminaires replaced and verified by Ward electrical supervisor. Please rate your service.",
      event_type: "RESOLUTION",
      type: "success",
      channel: "SMS",
      read: true,
      created_at: "2026-09-16T18:20:00.000Z",
      time: "1d ago",
      metadata: { rating_eligible: true }
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    fetch(`/api/notifications/citizen/${id}/read`, { method: "POST" }).catch(() => {});
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch(`/api/notifications/citizen/read-all`, { method: "POST" }).catch(() => {});
  };

  const addNotification = (item: Partial<NotificationItem>) => {
    const newItem: NotificationItem = {
      id: item.id || `notif-${Date.now()}`,
      grievance_id: item.grievance_id || item.grievanceNumber || "GRV-2026-1042",
      grievanceNumber: item.grievanceNumber || item.grievance_id || "GRV-2026-1042",
      citizen_id: item.citizen_id || "citizen-001",
      title: item.title || "Grievance Update",
      message: item.message || "New operational update.",
      event_type: item.event_type || "STATUS_CHANGE",
      type: item.type || "info",
      channel: item.channel || "IN_APP",
      read: false,
      created_at: item.created_at || new Date().toISOString(),
      time: item.time || "Just now",
      metadata: item.metadata || {},
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  // Hydrate from live Supabase tables if configured and available
  useEffect(() => {
    const hydrateFromSupabase = async () => {
      try {
        const [dbGrievances, dbLogs] = await Promise.all([
          getGrievancesFromDb(),
          getAuditLogsFromDb(),
        ]);
        if (dbGrievances && dbGrievances.length > 0) {
          setGrievances(dbGrievances);
          const flagship = dbGrievances.find((g) => g.grievanceNumber === "GRV-2026-1042");
          if (flagship) setActiveGrievance(flagship);
        }
        if (dbLogs && dbLogs.length > 0) {
          setAuditLogs(dbLogs);
        }
      } catch (err) {
        console.warn("Could not sync with Supabase tables:", err);
      }
    };
    hydrateFromSupabase();
  }, []);

  const getGrievanceByNumber = (num: string) => {
    return grievances.find(
      (g) => g.grievanceNumber.toLowerCase() === num.toLowerCase() || g.id === num
    );
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const acceptRecommendation = (grievanceId: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            status: "IN_PROGRESS",
            recommendation: {
              ...g.recommendation,
              status: "ACCEPTED",
              reviewedBy: "Er. Rajesh Sharma (EE)",
              reviewedAt: new Date().toISOString(),
            },
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "AUTHORITY",
                title: "AI Recommendation Accepted",
                timestamp: "Just now",
                description: `Authority accepted: "${g.recommendation.recommendedAction}" and dispatched response teams.`,
                icon: "task_alt",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma (Executive Engineer)",
      action: "RECOMMENDATION_ACCEPTED",
      details: "Officer confirmed automated recommendation. Status shifted to IN_PROGRESS.",
    });
  };

  const modifyRecommendation = (
    grievanceId: string,
    customAction: string,
    reason: string
  ) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            status: "IN_PROGRESS",
            recommendation: {
              ...g.recommendation,
              recommendedAction: customAction,
              status: "MODIFIED",
              reviewedBy: "Er. Rajesh Sharma (EE)",
              reviewedAt: new Date().toISOString(),
              modificationNotes: reason,
            },
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "AUTHORITY",
                title: "Recommendation Modified by Officer",
                timestamp: "Just now",
                description: `Action altered to: "${customAction}". Note: ${reason}`,
                icon: "edit_note",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma (Executive Engineer)",
      action: "RECOMMENDATION_MODIFIED",
      details: `Modified action: "${customAction}". Reason given: ${reason}`,
    });
  };

  const rejectRecommendation = (grievanceId: string, reason: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            recommendation: {
              ...g.recommendation,
              status: "REJECTED",
              reviewedBy: "Er. Rajesh Sharma (EE)",
              reviewedAt: new Date().toISOString(),
              modificationNotes: reason,
            },
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "AUTHORITY",
                title: "Recommendation Rejected",
                timestamp: "Just now",
                description: `Officer rejected AI prescribed action. Reason: ${reason}`,
                icon: "cancel",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma (Executive Engineer)",
      action: "RECOMMENDATION_REJECTED",
      details: `Recommendation rejected: ${reason}`,
    });
  };

  const updateStatus = (grievanceId: string, newStatus: GrievanceStatus, notes?: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            status: newStatus,
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "AUTHORITY",
                title: `Status Changed to ${newStatus.replace("_", " ")}`,
                timestamp: "Just now",
                description: notes || `Case transitioned to ${newStatus}.`,
                icon: "sync_alt",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma (Executive Engineer)",
      action: "STATUS_UPDATED",
      details: `Status set to ${newStatus}. Notes: ${notes || "None"}`,
    });

    addNotification({
      grievance_id: grievanceId,
      grievanceNumber: grievanceId,
      title: newStatus === "RESOLVED" ? "Case Resolved" : `Status Changed: ${newStatus.replace("_", " ")}`,
      message: notes || `Case ${grievanceId} updated to ${newStatus}. Field action logged.`,
      event_type: newStatus === "RESOLVED" ? "RESOLUTION" : (newStatus === "ACTION_SCHEDULED" ? "EXPECTED_ACTION" : "STATUS_CHANGE"),
      type: newStatus === "RESOLVED" ? "success" : "info",
    });
  };

  const postAuthorityDirective = (grievanceId: string, directiveText: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            authorityDirective: {
              officerName: "Er. Rajesh Sharma",
              designation: "Executive Engineer (EE-PMC)",
              loggedAt: new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              directiveText,
              aiPolicyVerification:
                "Authority directive parsed and logged into municipal case register. Compliant with Ward 12 civil remediation protocol.",
            },
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma (Executive Engineer)",
      action: "INTERNAL_NOTE_POSTED",
      details: directiveText,
    });
  };

  const triggerCitizenUpdate = (grievanceId: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "AI_AGENT",
                title: "Manual Citizen Broadcast Sent",
                timestamp: "Just now",
                description:
                  "Sent instant multi-channel progress update to citizen via SMS and WhatsApp: Current status confirmed.",
                icon: "outgoing_mail",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "AI_AGENT",
      actorName: "NagrikAI Dispatcher",
      action: "MANUAL_BROADCAST_TRIGGERED",
      details: "Officer clicked 'Trigger AI Citizen Update'. SMS and push notification queued.",
    });
  };

  const escalateGrievance = (grievanceId: string, reason: string) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === grievanceId || g.grievanceNumber === grievanceId) {
          const updated: Grievance = {
            ...g,
            status: "ESCALATED",
            sla: {
              ...g.sla,
              status: "ESCALATED",
              escalationLevel: g.sla.escalationLevel + 1,
            },
            agentTimeline: [
              ...g.agentTimeline,
              {
                id: `step-${Date.now()}`,
                actor: "SYSTEM",
                title: "Case Escalated to Tier 2",
                timestamp: "Just now",
                description: `Escalated to Superintending Engineer. Reason: ${reason}`,
                icon: "warning",
                isCompleted: true,
              },
            ],
          };
          if (activeGrievance.id === g.id) setActiveGrievance(updated);
          return updated;
        }
        return g;
      })
    );

    addAuditLog({
      grievanceNumber: "GRV-2026-1042",
      actorType: "OFFICER",
      actorName: "Er. Rajesh Sharma",
      action: "GRIEVANCE_ESCALATED",
      details: `Escalation triggered: ${reason}`,
    });

    addNotification({
      grievance_id: grievanceId,
      grievanceNumber: grievanceId,
      title: "SLA Escalation Triggered",
      message: `Statutory escalation to Tier 2: ${reason}. Case assigned to Zonal Superintending Engineer.`,
      event_type: "ESCALATION",
      type: "alert",
    });
  };

  const submitNewGrievance = (data: Partial<Grievance>): Grievance => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newGrievance: Grievance = {
      id: `grv-${Date.now()}`,
      grievanceNumber: `GRV-2026-${randomNum}`,
      title: data.title || "Civic Complaint",
      description: data.description || "",
      originalTextLog: data.description || "",
      language: "English",
      citizen: {
        id: "usr-cit-01",
        name: "Ramesh Kulkarni",
        uid: "IND-MH-PN-8812",
        isVerified: true,
        phoneMasked: "+91 98220 *****",
      },
      filedAt: new Date().toISOString(),
      priority: data.priority || "HIGH",
      status: "SUBMITTED",
      ledgerHash: `#PMC-2026-SHA256-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      location: data.location || {
        ward: "Ward 12",
        zone: "Sinhagad Zone",
        address: "Sinhagad Road, Pune",
        latitude: 18.4965,
        longitude: 73.8312,
      },
      sla: {
        slaCode: "SLA-CIV-04",
        totalHours: 48,
        elapsedHours: 1,
        remainingHours: 47,
        deadlineIso: new Date(Date.now() + 48 * 3600000).toISOString(),
        escalationLevel: 0,
        status: "ON_TRACK",
        tiers: [],
      },
      evidence: data.evidence || [],
      aiAnalysis: data.aiAnalysis || {
        category: "Public Grievance",
        subcategory: "General Municipal",
        severityScore: 7.0,
        severityDescription: "Moderate civic urgency",
        affectedPopulationEstimate: "~300 residents",
        durationText: "Reported today",
        jurisdiction: "PMC Ward Office",
        confidenceScore: 92.0,
        extractedEntities: ["Pune"],
        multimodalSummary: "AI triage completed on submission.",
      },
      similarComplaints: [],
      recommendation: {
        recommendedAction: "Dispatch inspection supervisor to location.",
        rationale: "Initial automated assessment.",
        expectedResolutionHours: 24,
        confidenceScore: 90.0,
        status: "PENDING_REVIEW",
      },
      agentTimeline: [
        {
          id: "step-1",
          actor: "CITIZEN",
          title: "Citizen Grievance Logged",
          timestamp: "Just now",
          description: "Submitted successfully via NagrikAI Citizen Portal.",
          icon: "person",
          isCompleted: true,
        },
        {
          id: "step-2",
          actor: "AI_AGENT",
          title: "AI Analysis Completed",
          timestamp: "Just now",
          description: "Category and priority extracted. Routing to Ward officer.",
          icon: "auto_awesome",
          isCompleted: true,
        },
      ],
    };

    setGrievances((prev) => [newGrievance, ...prev]);

    // Asynchronously persist to Supabase if live DB is connected and not already saved via API
    if (!(data as any).alreadyPersisted) {
      insertGrievanceToDb(newGrievance).catch((err) => {
        console.warn("Could not persist grievance to remote Supabase DB:", err);
      });
    }

    addAuditLog({
      grievanceNumber: newGrievance.grievanceNumber,
      actorType: "CITIZEN",
      actorName: "Ramesh Kulkarni (Citizen)",
      action: "GRIEVANCE_SUBMITTED",
      details: `New grievance submitted: ${newGrievance.title}`,
    });

    addNotification({
      grievance_id: newGrievance.grievanceNumber,
      grievanceNumber: newGrievance.grievanceNumber,
      title: `Grievance Lodged: ${newGrievance.grievanceNumber}`,
      message: `Your grievance "${newGrievance.title}" was submitted successfully and queued for AI analysis.`,
      event_type: "SUBMISSION",
      type: "success",
    });

    return newGrievance;
  };

  return (
    <GrievanceContext.Provider
      value={{
        grievances,
        activeGrievance,
        auditLogs,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        getGrievanceByNumber,
        acceptRecommendation,
        modifyRecommendation,
        rejectRecommendation,
        updateStatus,
        postAuthorityDirective,
        triggerCitizenUpdate,
        escalateGrievance,
        submitNewGrievance,
      }}
    >
      {children}
    </GrievanceContext.Provider>
  );
}

export function useGrievances() {
  const context = useContext(GrievanceContext);
  if (!context) {
    throw new Error("useGrievances must be used within a GrievanceProvider");
  }
  return context;
}
