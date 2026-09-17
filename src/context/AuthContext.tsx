"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Role, UserProfile } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mock-data";

interface AuthContextType {
  role: Role;
  currentUser: UserProfile;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("OFFICER");
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS.OFFICER);

  useEffect(() => {
    setCurrentUser(MOCK_USERS[role] || MOCK_USERS.OFFICER);
  }, [role]);

  const switchRole = (newRole: Role) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ role, currentUser, switchRole }}>
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
