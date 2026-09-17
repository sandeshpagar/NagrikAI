"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import {
  Bell,
  CheckCheck,
  Calendar,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  Camera,
  MessageSquare,
  Smartphone,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

export interface NotificationItem {
  id: string;
  grievance_id: string;
  citizen_id?: string;
  title: string;
  message: string;
  event_type:
    | "SUBMISSION"
    | "ASSIGNMENT"
    | "ACKNOWLEDGEMENT"
    | "STATUS_CHANGE"
    | "EVIDENCE_REQUEST"
    | "EXPECTED_ACTION"
    | "RESOLUTION"
    | "ESCALATION"
    | string;
  type?: "info" | "success" | "warning" | "alert";
  channel?: "IN_APP" | "SMS" | "WHATSAPP" | "EMAIL" | "ALL" | string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose?: () => void;
  role?: Role | string;
  className?: string;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
  role,
  className = "",
}: NotificationCenterProps) {
  const authContext = useAuth();
  const currentRole = role || authContext?.role || "CITIZEN";
  const isAuthority = currentRole === "OFFICER" || currentRole === "DEPARTMENT_ADMIN" || currentRole === "SYSTEM_ADMIN";

  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIONS" | "ESCALATIONS" | "EVIDENCE">("ALL");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Categorization filter logic
  const filteredNotifications = notifications.filter((item) => {
    if (filterUnreadOnly && item.read) return false;

    if (activeTab === "ACTIONS") {
      return ["STATUS_CHANGE", "EXPECTED_ACTION", "SUBMISSION", "ACKNOWLEDGEMENT", "ASSIGNMENT", "RESOLUTION"].includes(
        item.event_type
      );
    }
    if (activeTab === "ESCALATIONS") {
      return item.event_type === "ESCALATION" || item.type === "alert";
    }
    if (activeTab === "EVIDENCE") {
      return item.event_type === "EVIDENCE_REQUEST" || item.type === "warning";
    }
    return true;
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "ESCALATION":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "EXPECTED_ACTION":
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case "EVIDENCE_REQUEST":
        return <Camera className="w-4 h-4 text-purple-500" />;
      case "ASSIGNMENT":
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case "ACKNOWLEDGEMENT":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "RESOLUTION":
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case "SUBMISSION":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case "WHATSAPP":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
          </span>
        );
      case "SMS":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-2.5 h-2.5" /> SMS
          </span>
        );
      case "IN_APP":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Bell className="w-2.5 h-2.5" /> In-App
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Multi-Channel
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            {isAuthority ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {isAuthority ? "Authority Operations & Alert Hub" : "Citizen Notification Hub"}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAuthority
                ? "PMC Ward 12 Municipal Escalations, SLA Warnings & Case Ledger"
                : "RTSA 2015 Multi-Channel Compliance Broadcasts"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs gap-1 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIONS")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === "ACTIONS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Status & Actions
          </button>
          <button
            onClick={() => setActiveTab("ESCALATIONS")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === "ESCALATIONS"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 hover:bg-rose-100/60"
            }`}
          >
            Escalations
          </button>
          <button
            onClick={() => setActiveTab("EVIDENCE")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === "EVIDENCE"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-purple-700 hover:bg-purple-100/60"
            }`}
          >
            Evidence
          </button>
        </div>

        <button
          onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
          className={`px-2 py-1 text-[11px] rounded-md font-medium shrink-0 transition-colors ${
            filterUnreadOnly
              ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {filterUnreadOnly ? "Showing Unread" : "Unread Only"}
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">No notifications in this category</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All updates are caught up and verified.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            const isEscalation = notif.event_type === "ESCALATION";

            return (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-slate-50/80 ${
                  isUnread
                    ? isEscalation
                      ? "bg-rose-50/60 border-l-4 border-rose-500"
                      : "bg-indigo-50/40 border-l-4 border-indigo-500"
                    : "border-l-4 border-transparent opacity-85"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isEscalation
                      ? "bg-rose-100 text-rose-600"
                      : notif.type === "warning"
                      ? "bg-purple-100 text-purple-600"
                      : notif.type === "success"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {getEventIcon(notif.event_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold ${isUnread ? "text-slate-900" : "text-slate-700"}`}>
                        {notif.title}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {getChannelBadge(notif.channel)}
                      <Link
                        href={isAuthority ? `/authority/grievances/${notif.grievance_id}` : `/citizen/track/${notif.grievance_id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(notif.id);
                          if (onClose) onClose();
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        {notif.grievance_id}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(notif.id);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">
          {isAuthority ? "Municipal Desk: Section 65B Certified Ledger" : "Audit: Section 65B Certified Delivery"}
        </span>
        <Link
          href={isAuthority ? "/authority/triage" : "/citizen/dashboard"}
          onClick={onClose}
          className="font-medium text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1"
        >
          {isAuthority ? "View Authority Triage Board →" : "View Grievance Board →"}
        </Link>
      </div>
    </div>
  );
}
