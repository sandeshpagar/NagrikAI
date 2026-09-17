import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { isRouteAllowedForRole } from "@/lib/auth/roles";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify if route is protected
  const isProtectedRoute =
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/authority") ||
    pathname.startsWith("/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 2. Check for active session cookie
  const roleCookie = request.cookies.get("nagrik_role")?.value as Role | undefined;
  const authSessionCookie = request.cookies.get("nagrik_session")?.value;

  // Unauthenticated user attempting to access protected area -> redirect to login
  if (!authSessionCookie || authSessionCookie !== "active" || !roleCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const activeRole: Role = roleCookie;

  // 3. Validate role boundary against requested path -> redirect to unauthorized if role not permitted
  if (!isRouteAllowedForRole(pathname, activeRole)) {
    const unauthorizedUrl = new URL("/auth/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("role", activeRole);
    unauthorizedUrl.searchParams.set("target", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 4. Allowed - Proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/authority/:path*",
    "/citizen/:path*",
    "/admin/:path*",
  ],
};
