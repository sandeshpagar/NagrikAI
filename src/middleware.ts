import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { isRouteAllowedForRole } from "@/lib/auth/roles";

// In-Memory Sliding-Window Rate Limiter for API endpoints
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/min per client IP
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(identifier) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitStore.set(identifier, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitStore.set(identifier, timestamps);

  // Periodic cleanup if map grows too large
  if (rateLimitStore.size > 1000) {
    for (const [key, tsList] of rateLimitStore.entries()) {
      const validTs = tsList.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (validTs.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTs);
      }
    }
  }

  return false;
}

// OWASP Recommended Security Response Headers
function attachSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self)"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Rate Limiting Defense (Burst & DoS protection)
  if (pathname.startsWith("/api/")) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(clientIp)) {
      const rateLimitResponse = NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Civic rate limit exceeded. Please wait 60 seconds before retrying.",
          retryAfter: 60,
        },
        { status: 429 }
      );
      rateLimitResponse.headers.set("Retry-After", "60");
      return attachSecurityHeaders(rateLimitResponse);
    }
  }

  // 2. Identify if route is protected by RBAC
  const isProtectedRoute =
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/authority") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute) {
    // Check for active session cookie
    const roleCookie = request.cookies.get("nagrik_role")?.value as Role | undefined;
    const authSessionCookie = request.cookies.get("nagrik_session")?.value;

    // Unauthenticated user attempting to access protected area -> redirect to login
    if (!authSessionCookie || authSessionCookie !== "active" || !roleCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return attachSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const activeRole: Role = roleCookie;

    // Validate role boundary against requested path -> redirect to unauthorized if role not permitted
    if (!isRouteAllowedForRole(pathname, activeRole)) {
      const unauthorizedUrl = new URL("/auth/unauthorized", request.url);
      unauthorizedUrl.searchParams.set("role", activeRole);
      unauthorizedUrl.searchParams.set("target", pathname);
      return attachSecurityHeaders(NextResponse.redirect(unauthorizedUrl));
    }
  }

  // 3. Attach OWASP Security Headers to Allowed Request / Response
  return attachSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
