"use client";

import { AdminProvider, useAdmin } from "@/lib/adminContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="text-[#8b6748] text-sm">載入中…</div>
      </div>
    );
  }

  if (!user || pathname === "/admin/login") {
    return <>{children}</>;
  }

  const role = user.role;
  const isAdmin = role === "管理者" || role === "會計";
  const isManager = role === "店長";
  const isAccountant = false; // 會計現在等同管理者權限

  const navItems = [
    { href: "/admin/dashboard", label: "首頁", icon: "⊞" },
    ...(!(isAccountant) ? [
      { href: "/admin/schedule", label: "排班", icon: "⊡" },
      { href: "/admin/bookings", label: "預約", icon: "⊟" },
    ] : []),
    ...(isAdmin || isManager ? [{ href: "/admin/customers", label: "會員", icon: "◉" }] : []),
    ...(isAdmin || isManager ? [{ href: "/admin/notifications", label: "通知", icon: "◈" }] : []),
    ...(isAdmin || isManager || isAccountant ? [
      { href: "/admin/cashout", label: "結帳", icon: "💴" },
      { href: "/admin/reports", label: "報表", icon: "▦" },
      { href: "/admin/expenses", label: "費用", icon: "₩" },
    ] : []),
    ...(isAdmin || isManager ? [
      { href: "/admin/attendance", label: "打卡", icon: "⏱" },
    ] : []),
    ...(isAdmin ? [
      { href: "/admin/staff", label: "員工", icon: "◎" },
      { href: "/admin/services", label: "服務", icon: "◇" },
      { href: "/admin/inventory", label: "貨物", icon: "◻" },
    ] : []),
  ];

  const settingsItems = isAdmin ? [
    { href: "/admin/cashout", label: "每日結帳" },
    { href: "/admin/attendance", label: "打卡薪資" },
    { href: "/admin/staff", label: "員工管理" },
    { href: "/admin/services", label: "服務項目" },
    { href: "/admin/reports", label: "業績報表" },
    { href: "/admin/expenses", label: "費用管理" },
    { href: "/admin/inventory", label: "貨物管理" },
    { href: "/admin/notifications", label: "通知設定" },
  ] : isManager ? [
    { href: "/admin/cashout", label: "每日結帳" },
    { href: "/admin/attendance", label: "打卡薪資" },
    { href: "/admin/reports", label: "業績報表" },
    { href: "/admin/expenses", label: "費用管理" },
    { href: "/admin/notifications", label: "通知設定" },
  ] : isAccountant ? [
    { href: "/admin/cashout", label: "每日結帳" },
    { href: "/admin/reports", label: "業績報表" },
    { href: "/admin/expenses", label: "費用管理" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#faf7f2] flex">
      {/* Side nav - tablet/desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#e8ddd2] min-h-screen fixed top-0 left-0 z-20">
        <div className="px-5 py-6 border-b border-[#e8ddd2]">
          <div className="text-[#8b6748] font-semibold text-sm tracking-widest">FASCIA 法夏</div>
          <div className="text-xs text-[#8a7a6e] mt-1">後台管理系統</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {[
            { href: "/admin/dashboard", label: "首頁總覽" },
            { href: "/admin/schedule", label: "排班管理" },
            { href: "/admin/bookings", label: "預約管理" },
            ...(isAdmin || isManager ? [{ href: "/admin/customers", label: "會員管理" }] : []),
            ...settingsItems,
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-[#8b6748] text-white"
                  : "text-[#1c1c1c] hover:bg-[#faf7f2]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[#e8ddd2]">
          <div className="text-xs font-medium text-[#1c1c1c]">{user.name}</div>
          <div className="text-xs text-[#8b6748] mt-0.5">{user.role}</div>
          {user.branchName && <div className="text-xs text-[#8a7a6e]">{user.branchName}</div>}
          <button
            onClick={() => { logout(); router.replace("/admin/login"); }}
            className="text-xs text-[#8a7a6e] hover:text-[#8b6748] transition-colors mt-3 block"
          >
            登出
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="md:hidden bg-white border-b border-[#e8ddd2] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="text-[#8b6748] font-semibold text-sm">FASCIA 法夏</div>
            <div className="text-xs text-[#8a7a6e]">{user.name} · {user.role}{user.branchName ? ` · ${user.branchName}` : ""}</div>
          </div>
          <button
            onClick={() => { logout(); router.replace("/admin/login"); }}
            className="text-xs text-[#8a7a6e] border border-[#e8ddd2] px-3 py-1 rounded-full"
          >
            登出
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* Bottom tab bar mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8ddd2] z-20">
          <div className="flex">
            {navItems.slice(0, 5).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  pathname === item.href ? "text-[#8b6748]" : "text-[#8a7a6e]"
                }`}
              >
                <span className="text-lg leading-none mb-0.5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
