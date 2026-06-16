"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "管理者" | "店長" | "員工";

export interface AdminUser {
  username: string;
  role: Role;
  name: string;
  staffId?: string;
}

interface AdminContextType {
  user: AdminUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const MOCK_USERS: Record<string, { password: string; user: AdminUser }> = {
  admin: {
    password: "admin123",
    user: { username: "admin", role: "管理者", name: "系統管理員" },
  },
  manager: {
    password: "mgr123",
    user: { username: "manager", role: "店長", name: "王小明", staffId: "S001" },
  },
  staff1: {
    password: "staff123",
    user: { username: "staff1", role: "員工", name: "陳美玲", staffId: "S002" },
  },
};

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("fascia_admin_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("fascia_admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const record = MOCK_USERS[username];
    if (record && record.password === password) {
      setUser(record.user);
      localStorage.setItem("fascia_admin_user", JSON.stringify(record.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fascia_admin_user");
  };

  return (
    <AdminContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
