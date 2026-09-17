"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role, UserProfile } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mock-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getDefaultRouteForRole, isRouteAllowedForRole } from "@/lib/auth/roles";

export const GUEST_USER: UserProfile = {
  id: "guest",
  fullName: "Guest Citizen",
  role: "CITIZEN",
  email: "guest@nagrikai.gov.in",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
};

interface AuthContextType {
  role: Role;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (
    email: string,
    pass: string,
    targetRole?: Role,
    redirectUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (
    mobile: string,
    otp: string,
    redirectUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithPersona: (personaRole: Role, redirectUrl?: string) => void;
  logout: () => Promise<void>;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get cookie value in browser
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to set cookie in browser
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Helper to remove cookie
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("CITIZEN");
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from cookie or Supabase on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedRole = getCookie("nagrik_role") as Role | null;
        const hasSession = getCookie("nagrik_session") === "active";

        if (hasSession && savedRole && MOCK_USERS[savedRole]) {
          setRole(savedRole);
          setCurrentUser(MOCK_USERS[savedRole]);
          setIsAuthenticated(true);
        } else {
          // No active session: ensure unauthenticated guest state and clean cookies
          setIsAuthenticated(false);
          setCurrentUser(GUEST_USER);
          deleteCookie("nagrik_role");
          deleteCookie("nagrik_session");
        }

        // Check if Supabase client is active
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          if (supabase) {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              setIsAuthenticated(true);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Update user profile whenever role changes (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && MOCK_USERS[role]) {
      setCurrentUser(MOCK_USERS[role]);
      setCookie("nagrik_role", role, 7);
      setCookie("nagrik_session", "active", 7);
    }
  }, [role, isAuthenticated]);

  // One-click Evaluator Persona Login
  const loginWithPersona = (personaRole: Role, redirectUrl?: string) => {
    setRole(personaRole);
    setCurrentUser(MOCK_USERS[personaRole]);
    setIsAuthenticated(true);
    setCookie("nagrik_role", personaRole, 7);
    setCookie("nagrik_session", "active", 7);

    // Redirect to requested redirect target if allowed for this role, else role home
    if (redirectUrl && isRouteAllowedForRole(redirectUrl, personaRole)) {
      router.push(redirectUrl);
    } else {
      router.push(getDefaultRouteForRole(personaRole));
    }
  };

  // Password Login
  const loginWithPassword = async (
    email: string,
    pass: string,
    targetRole: Role = "OFFICER",
    redirectUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
          }
        }
      }

      // Simulated successful sign-in
      setRole(targetRole);
      setCurrentUser(MOCK_USERS[targetRole]);
      setIsAuthenticated(true);
      setCookie("nagrik_role", targetRole, 7);
      setCookie("nagrik_session", "active", 7);

      if (redirectUrl && isRouteAllowedForRole(redirectUrl, targetRole)) {
        router.push(redirectUrl);
      } else {
        router.push(getDefaultRouteForRole(targetRole));
      }
      return { success: true };
    } catch {
      return { success: false, error: "Authentication service error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Login (for Citizens)
  const loginWithOtp = async (
    mobile: string,
    otp: string,
    redirectUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      if (otp !== "123456" && otp.length !== 6) {
        setIsLoading(false);
        return { success: false, error: "Invalid verification code. Enter '123456' for instant demo access." };
      }

      setRole("CITIZEN");
      setCurrentUser(MOCK_USERS.CITIZEN);
      setIsAuthenticated(true);
      setCookie("nagrik_role", "CITIZEN", 7);
      setCookie("nagrik_session", "active", 7);

      if (redirectUrl && isRouteAllowedForRole(redirectUrl, "CITIZEN")) {
        router.push(redirectUrl);
      } else {
        router.push("/citizen/dashboard");
      }
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Flow
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
      deleteCookie("nagrik_role");
      deleteCookie("nagrik_session");
      setIsAuthenticated(false);
      setCurrentUser(GUEST_USER);
      setRole("CITIZEN");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: Role) => {
    setRole(newRole);
    setCookie("nagrik_role", newRole, 7);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentUser,
        isAuthenticated,
        isLoading,
        loginWithPassword,
        loginWithOtp,
        loginWithPersona,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
