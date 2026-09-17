import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ward = searchParams.get("ward");

    const query = new URLSearchParams();
    if (ward) query.set("ward", ward);

    const res = await fetch(`${BACKEND_URL}/api/v1/analytics/breakdowns?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        categories: { categories: [] },
        departments: { departments: [] },
        wards: { wards: [] },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analytics breakdowns proxy error:", error);
    return NextResponse.json({
      categories: { categories: [] },
      departments: { departments: [] },
      wards: { wards: [] },
    });
  }
}
