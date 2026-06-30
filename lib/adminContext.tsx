"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "管理者" | "店長" | "員工" | "會計";
export type StaffLevel = "準師" | "初階職人" | "進階職人" | "資深職人" | "技術長";
export type EmploymentType = "承攬制" | "僱傭制";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  level: StaffLevel;
  employmentType: EmploymentType;
  branchId: string | null;   // null = 不限分店（管理者/會計）
  branchName: string;
  baseSalary: number;
  positionAllowance: number;
  sessionThreshold: number;
}

const BRANCHES = [
  { id: "ST01", name: "小巨蛋店" },
  { id: "ST02", name: "大安店" },
  { id: "ST03", name: "板橋店" },
];

interface AdminContextType {
  user: AdminUser | null;
  // 目前操作的分店（管理者/會計可切換，員工/店長固定自己的店）
  activeBranchId: string;
  activeBranchName: string;
  setActiveBranch: (id: string) => void;
  canSwitchBranch: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = "fascia_admin_user";
const BRANCH_KEY = "fascia_admin_branch";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState("ST01");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const u: AdminUser = JSON.parse(stored);
        setUser(u);
        // 員工/店長固定自己的店；管理者/會計讀上次選的店
        if (u.branchId) {
          setActiveBranchId(u.branchId);
        } else {
          const savedBranch = localStorage.getItem(BRANCH_KEY);
          setActiveBranchId(savedBranch ?? "ST01");
        }
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
      if (!res.ok) return { success: false, error: data.error ?? "登入失敗" };
      setUser(data.staff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.staff));
      // 設定初始分店
      const branch = data.staff.branchId ?? localStorage.getItem(BRANCH_KEY) ?? "ST01";
      setActiveBranchId(branch);
      return { success: true };
    } catch {
      return { success: false, error: "網路錯誤，請稍後再試" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const setActiveBranch = (id: string) => {
    setActiveBranchId(id);
    localStorage.setItem(BRANCH_KEY, id);
  };

  const canSwitchBranch = !!user && (user.role === "管理者" || user.role === "會計");
  const activeBranchName = BRANCHES.find(b => b.id === activeBranchId)?.name ?? "";

  return (
    <AdminContext.Provider value={{
      user, login, logout, isLoading,
      activeBranchId, activeBranchName, setActiveBranch, canSwitchBranch,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
