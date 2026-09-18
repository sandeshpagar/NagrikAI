"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CitizenNav } from "./CitizenNav";
import { useAuth } from "@/context/AuthContext";
import { isRouteAllowedForRole } from "@/lib/auth/roles";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Minimal auth pages render full-screen without chrome
  const isMinimalAuthPage = pathname === "/auth/login" || pathname === "/auth/register";

  // Check if route is protected (authority, citizen, admin areas)
  const isProtectedRoute =
    pathname.startsWith("/authority") ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/admin");

  // Client-Side Route Guard: strict immediate redirection
  useEffect(() => {
    if (isLoading || isMinimalAuthPage) return;

    if (isProtectedRoute) {
      if (!isAuthenticated) {
        // Intercept unauthenticated user immediately and redirect to login
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!isRouteAllowedForRole(pathname, role)) {
        // Intercept unauthorized role immediately and redirect to 403 screen
        router.replace(
          `/auth/unauthorized?role=${role}&target=${encodeURIComponent(pathname)}`
        );
      }
    }
  }, [pathname, isAuthenticated, isLoading, role, isProtectedRoute, isMinimalAuthPage, router]);

  if (isMinimalAuthPage) {
    return <div className="min-h-screen w-full bg-surface">{children}</div>;
  }

  // If visiting a protected route and not yet authorized, show security clearance loader
  // NEVER render protected children to an unauthenticated or unauthorized user
  if (
    isProtectedRoute &&
    (isLoading || !isAuthenticated || !isRouteAllowedForRole(pathname, role))
  ) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface gap-3 px-4 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-on-surface">
            {!isAuthenticated
              ? "Security Clearance Required"
              : "Verifying Role Authorization"}
          </p>
          <p className="text-xs text-on-surface-variant">
            {!isAuthenticated
              ? "Redirecting to official login portal..."
              : `Checking clearance for ${role}...`}
          </p>
        </div>
      </div>
    );
  }

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <>
      {/* Accessible Skip to Content Link for Keyboard & Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-xs transition-all"
      >
        Skip to main content
      </a>

      <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex w-full">
        {/* Desktop Permanent Sidebar (Always open on >= 1024px) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile / Tablet Drawer Sidebar (Accessible via Hamburger on < 1024px) */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            {/* Slide-out Drawer */}
            <div className="relative z-50 w-72 h-full bg-surface-container-low shadow-elevated animate-in slide-in-from-left duration-200">
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} isDrawer={true} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main id="main-content" tabIndex={-1} className="flex-1 w-full lg:pl-72 pt-16 pb-20 lg:pb-8 transition-all min-w-0 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (for citizen view) */}
      <CitizenNav />
    </>
  );
}
