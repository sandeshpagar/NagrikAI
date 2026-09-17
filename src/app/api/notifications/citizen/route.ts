import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_URL}/api/v1/notifications/citizen?${searchParams.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    // Default Fallback Mock Notifications
    return NextResponse.json({
      success: true,
      unread_count: 3,
      total_count: 8,
      notifications: [
        {
          id: "notif-seed-08",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "SLA Escalation Triggered",
          message: "Grievance escalated to Tier 2 (Superintending Engineer Er. Sunita Deshpande) for expedited executive oversight.",
          event_type: "ESCALATION",
          type: "alert",
          channel: "ALL",
          read: false,
          created_at: "2026-09-17T17:35:00.000Z",
          metadata: { tier: 2, authority: "Er. Sunita Deshpande" }
        },
        {
          id: "notif-seed-07",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Field Inspection & Action Scheduled",
          message: "Ward 12 rapid road repair squad dispatched. Cold-mix asphalt patching committed for 18 Sep 2026.",
          event_type: "EXPECTED_ACTION",
          type: "info",
          channel: "WHATSAPP",
          read: false,
          created_at: "2026-09-17T17:00:00.000Z",
          metadata: { scheduled_date: "2026-09-18T10:00:00Z" }
        },
        {
          id: "notif-seed-06",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Status Updated to In Progress",
          message: "Municipal civil engineer acknowledged the complaint and accepted the AI recommended standard operating procedure.",
          event_type: "STATUS_CHANGE",
          type: "info",
          channel: "IN_APP",
          read: false,
          created_at: "2026-09-17T15:45:00.000Z",
          metadata: { new_status: "IN_PROGRESS" }
        },
        {
          id: "notif-seed-05",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Evidence Request: Additional Landmarks",
          message: "AI verification engine requested clear intersection photos to pinpoint storm drain blockage near Sinhagad Road.",
          event_type: "EVIDENCE_REQUEST",
          type: "warning",
          channel: "SMS",
          read: true,
          created_at: "2026-09-17T14:15:00.000Z",
          metadata: { requested_item: "Intersection landmark photo" }
        },
        {
          id: "notif-seed-04",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Statutory RTSA Official Acknowledgement",
          message: "Formal receipt acknowledged under Maharashtra RTSA 2015. 72-hour statutory SLA clock commenced.",
          event_type: "ACKNOWLEDGEMENT",
          type: "success",
          channel: "SMS",
          read: true,
          created_at: "2026-09-17T12:05:00.000Z",
          metadata: { sla_hours: 72 }
        },
        {
          id: "notif-seed-03",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Authority Mapped: PMC Ward 12",
          message: "Assigned to Er. Rajesh Sharma (Executive Engineer, PMC Road Maintenance Division).",
          event_type: "ASSIGNMENT",
          type: "info",
          channel: "ALL",
          read: true,
          created_at: "2026-09-17T11:55:00.000Z",
          metadata: { officer: "Er. Rajesh Sharma", ward: "Ward 12" }
        },
        {
          id: "notif-seed-02",
          grievance_id: "GRV-2026-1042",
          citizen_id: "citizen-001",
          title: "Grievance Lodged Successfully",
          message: "Case GRV-2026-1042 recorded with 2 geotagged photos and DigiLocker Aadhaar verification.",
          event_type: "SUBMISSION",
          type: "success",
          channel: "ALL",
          read: true,
          created_at: "2026-09-17T10:32:00.000Z",
          metadata: { tracking_id: "GRV-2026-1042" }
        },
        {
          id: "notif-seed-01",
          grievance_id: "GRV-2026-1038",
          citizen_id: "citizen-001",
          title: "Case Resolved: Streetlight Restored",
          message: "Work order completed. Luminaires replaced and verified by Ward electrical supervisor. Please rate your service.",
          event_type: "RESOLUTION",
          type: "success",
          channel: "SMS",
          read: true,
          created_at: "2026-09-16T18:20:00.000Z",
          metadata: { rating_eligible: true }
        }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_URL}/api/v1/notifications/citizen/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline fallback
    }

    return NextResponse.json({
      id: `notif-${Date.now()}`,
      grievance_id: body.grievance_id,
      citizen_id: body.citizen_id || "citizen-001",
      title: body.title || "Grievance Notification",
      message: body.message || "Status updated.",
      event_type: body.event_type,
      type: body.type || "info",
      channel: body.channel || "ALL",
      read: false,
      created_at: new Date().toISOString(),
      metadata: body.metadata || {}
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create notification" }, { status: 500 });
  }
}
