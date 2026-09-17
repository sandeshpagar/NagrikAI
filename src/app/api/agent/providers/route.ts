import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const fastApiResponse = await fetch(`${BACKEND_URL}/api/v1/agent/providers`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (fastApiResponse.ok) {
      const data = await fastApiResponse.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback if backend offline
  }

  return NextResponse.json({
    active_provider: "heuristic",
    configured_default: "ollama",
    ollama: {
      base_url: "http://localhost:11434",
      text_model: "qwen2.5:7b",
    },
    openrouter: {
      base_url: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.2-3b-instruct:free",
      key_configured: false,
    },
    heuristic_fallback: "Available (Zero-network 100% uptime)",
  });
}
