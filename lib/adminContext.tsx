"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "管理者" | "店長" | "員工";
export type StaffLevel = "準師" | "初階職人" | "進階職人" | "資深職人" | "明星職人";
export type EmploymentType = "承攬制" | "僱傭制";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  level: StaffLevel;
  employmentType: EmploymentType;
  branchId: string | null;
  branchName: string;
  baseSalary: number;
  positionAllowance: number;
  sessionThreshold: number;
}

interface AdminContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = "fascia_admin_user";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error ?? "登入失敗" };
      }
      setUser(data.staff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.staff));
      return { success: true };
    } catch {
      return { success: false, error: "網路錯誤，請稍後再試" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
