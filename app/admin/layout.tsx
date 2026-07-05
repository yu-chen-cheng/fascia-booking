"use client";

import { AdminProvider, useAdmin } from "@/lib/adminContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const BRANCHES = [
  { id: "ST01", name: "小巨蛋" },
  { id: "ST02", name: "大安" },
  { id: "ST03", name: "板橋" },
];

// Nav definition per role
function getNav(role: string) {
  const base = [
    { href: "/admin/bookings",  label: "預約", icon: "📅" },
    { href: "/admin/schedule",  label: "排班", icon: "🗓" },
    { href: "/admin/cashout",   label: "結帳", icon: "💴" },
  ];
  if (role === "店長") return [
    ...base,
    { href: "/admin/customers", label: "會員", icon: "👤" },
  ];
  if (role === "管理者") return [
    ...base,
    { href: "/admin/customers", label: "會員", icon: "👤" },
    { href: "/admin/reports",   label: "報表", icon: "📊" },
    { href: "/admin/settings",  label: "設定", icon: "⚙️" },
  ];
  // 店員 — 結帳改為業績（個人報表）
  return [
    { href: "/admin/bookings",  label: "預約", icon: "📅" },
    { href: "/admin/schedule",  label: "排班", icon: "🗓" },
    { href: "/admin/my-report", label: "業績", icon: "📊" },
  ];
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, activeBranchId, activeBranchName, setActiveBranch, canSwitchBranch } = useAdmin();
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

  if (!user || pathname === "/admin/login") return <>{children}</>;

  const navItems = getNav(user.role);
  const isAdmin = user.role === "管理者";

  return (
    <div className="min-h-screen bg-[#faf7f2] flex">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-[#e8ddd2] min-h-screen fixed top-0 left-0 z-20">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#e8ddd2]">
          <div className="text-[#8b6748] font-semibold text-sm tracking-widest">FASCIA 法夏</div>
          <div className="text-[10px] text-[#8a7a6e] mt-0.5">後台管理系統</div>
        </div>

        {/* Branch switcher — 管理者 only */}
        {isAdmin && (
          <div className="px-3 py-3 border-b border-[#e8ddd2]">
            <div className="text-[10px] text-[#8a7a6e] mb-1.5 px-1">分店</div>
            <div className="flex gap-1">
              {BRANCHES.map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveBranch(b.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeBranchId === b.id
                      ? "bg-[#8b6748] text-white"
                      : "text-[#8a7a6e] hover:bg-[#faf7f2] border border-[#e8ddd2]"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-[#8b6748] text-white"
                  : "text-[#1c1c1c] hover:bg-[#faf7f2]"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-[#e8ddd2]">
          <div className="text-xs font-medium text-[#1c1c1c]">{user.name}</div>
          <div className="text-[10px] text-[#8b6748] mt-0.5">
            {user.role}
            {!isAdmin && ` · ${activeBranchName}`}
          </div>
          <button
            onClick={() => { logout(); router.replace("/admin/login"); }}
            className="text-[10px] text-[#8a7a6e] hover:text-[#8b6748] transition-colors mt-2 block"
          >
            登出
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 md:ml-52 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-[#e8ddd2] px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#8b6748] font-semibold text-sm">FASCIA 法夏</div>
              <div className="text-[10px] text-[#8a7a6e]">{user.name} · {user.role}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Branch switcher pill — 管理者 mobile */}
              {isAdmin && (
                <div className="flex gap-1">
                  {BRANCHES.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setActiveBranch(b.id)}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        activeBranchId === b.id
                          ? "bg-[#8b6748] text-white"
                          : "text-[#8a7a6e] border border-[#e8ddd2]"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => { logout(); router.replace("/admin/login"); }}
                className="text-[10px] text-[#8a7a6e] border border-[#e8ddd2] px-2.5 py-1 rounded-full"
              >
                登出
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8ddd2] z-20">
          <div className="flex">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
                  pathname.startsWith(item.href) ? "text-[#8b6748]" : "text-[#8a7a6e]"
                }`}
              >
                <span className="text-xl leading-none mb-0.5">{item.icon}</span>
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
