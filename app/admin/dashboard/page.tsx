"use client";

import { useAdmin } from "@/lib/adminContext";
import { ADMIN_BOOKINGS, ADMIN_CUSTOMERS, ADMIN_STAFF } from "@/lib/adminMockData";
import Link from "next/link";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5">
      <div className="text-xs text-[#8a7a6e] mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color || "text-[#1c1c1c]"}`}>{value}</div>
      {sub && <div className="text-xs text-[#8a7a6e] mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAdmin();
  if (!user) return null;

  const today = "2026-06-13";
  const todayBookings = ADMIN_BOOKINGS.filter(b => b.date === today);
  const monthBookings = ADMIN_BOOKINGS.filter(b => b.date.startsWith("2026-06"));
  const monthRevenue = monthBookings.filter(b => b.status === "已完成").reduce((s, b) => s + b.price, 0);
  const pendingCount = ADMIN_BOOKINGS.filter(b => b.status === "待確認").length;

  if (user.role === "管理者") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1c1c1c]">總覽</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">2026年6月13日 星期六</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="今日預約數" value={String(todayBookings.length)} sub="全館" color="text-[#8b6748]" />
          <StatCard label="本日營收" value={`$${ADMIN_BOOKINGS.filter(b => b.date === today && b.status === "已完成").reduce((s, b) => s + b.price, 0).toLocaleString()}`} sub="已完成訂單" color="text-[#8b6748]" />
          <StatCard label="本月營收" value={`$${monthRevenue.toLocaleString()}`} sub="已完成訂單" color="text-[#8b6748]" />
          <StatCard label="待處理事項" value={String(pendingCount)} sub="待確認預約" color={pendingCount > 0 ? "text-amber-600" : "text-[#1c1c1c]"} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mb-4">
          <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">今日預約</h2>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-[#8a7a6e]">今日無預約</p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#e8ddd2] last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#1c1c1c]">{b.time} · {b.customerName}</div>
                    <div className="text-xs text-[#8a7a6e]">{b.serviceName} · {b.staffName} · {b.storeName}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/bookings" className="bg-[#8b6748] text-white text-center py-3 rounded-xl text-sm font-medium">管理預約</Link>
          <Link href="/admin/reports" className="bg-white border border-[#e8ddd2] text-[#8b6748] text-center py-3 rounded-xl text-sm font-medium">查看報表</Link>
        </div>
      </div>
    );
  }

  if (user.role === "店長") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1c1c1c]">今日總覽</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">2026年6月13日</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="今日總預約" value={String(todayBookings.length)} color="text-[#8b6748]" />
          <StatCard label="待確認" value={String(pendingCount)} color={pendingCount > 0 ? "text-amber-600" : "text-[#1c1c1c]"} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mb-4">
          <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">全員今日排班</h2>
          {ADMIN_STAFF.map(s => {
            const staffBookings = todayBookings.filter(b => b.staffId === s.id);
            return (
              <div key={s.id} className="py-3 border-b border-[#e8ddd2] last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-[#1c1c1c]">{s.name}</div>
                  <div className="text-xs text-[#8a7a6e]">{s.internalLevel}</div>
                </div>
                {staffBookings.length === 0 ? (
                  <div className="text-xs text-[#8a7a6e]">今日無預約</div>
                ) : staffBookings.map(b => (
                  <div key={b.id} className="text-xs text-[#8a7a6e] ml-2">{b.time} {b.customerName} · {b.serviceName}</div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/bookings" className="bg-[#8b6748] text-white text-center py-3 rounded-xl text-sm font-medium">管理預約</Link>
          <Link href="/admin/customers" className="bg-white border border-[#e8ddd2] text-[#8b6748] text-center py-3 rounded-xl text-sm font-medium">會員管理</Link>
        </div>
      </div>
    );
  }

  // Staff role
  const myStaff = ADMIN_STAFF.find(s => s.username === user.username);
  const myBookings = myStaff ? todayBookings.filter(b => b.staffId === myStaff.id) : [];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">我的今日排程</h1>
        <p className="text-sm text-[#8a7a6e] mt-1">2026年6月13日</p>
      </div>

      <StatCard label="今日預約" value={String(myBookings.length)} color="text-[#8b6748]" />

      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mt-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">預約明細</h2>
        {myBookings.length === 0 ? (
          <p className="text-sm text-[#8a7a6e]">今日無預約</p>
        ) : (
          <div className="space-y-3">
            {myBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#e8ddd2] last:border-0">
                <div>
                  <div className="text-sm font-medium text-[#1c1c1c]">{b.time} · {b.customerName}</div>
                  <div className="text-xs text-[#8a7a6e]">{b.serviceName} · {b.storeName}</div>
                  <div className="text-xs text-[#8a7a6e]">緩衝：{b.bufferMinutes} 分鐘</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/admin/schedule" className="bg-[#8b6748] text-white text-center py-3 rounded-xl text-sm font-medium">我的排班</Link>
        <Link href="/admin/bookings" className="bg-white border border-[#e8ddd2] text-[#8b6748] text-center py-3 rounded-xl text-sm font-medium">我的預約</Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "待確認": "bg-amber-50 text-amber-700 border-amber-200",
    "已確認": "bg-blue-50 text-blue-700 border-blue-200",
    "已完成": "bg-green-50 text-green-700 border-green-200",
    "已取消": "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}
