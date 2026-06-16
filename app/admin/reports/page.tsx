"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_BOOKINGS, ADMIN_STAFF, ADMIN_STORES, ADMIN_CUSTOMERS } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo] = useState("2026-06-30");

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const filtered = ADMIN_BOOKINGS.filter(b => b.date >= dateFrom && b.date <= dateTo);
  const completed = filtered.filter(b => b.status === "已完成");
  const totalRevenue = completed.reduce((s, b) => s + b.price, 0);
  const completionRate = filtered.length > 0 ? Math.round((completed.length / filtered.length) * 100) : 0;
  const newCustomers = ADMIN_CUSTOMERS.filter(c => c.joinDate >= dateFrom && c.joinDate <= dateTo).length;

  // By store
  const storeStats = ADMIN_STORES.map(store => {
    const storeCompleted = completed.filter(b => b.storeId === store.id);
    return {
      name: store.name,
      revenue: storeCompleted.reduce((s, b) => s + b.price, 0),
      count: storeCompleted.length,
    };
  });

  // By staff
  const staffStats = ADMIN_STAFF.map(staff => {
    const staffCompleted = completed.filter(b => b.staffId === staff.id);
    const revenue = staffCompleted.reduce((s, b) => s + b.price, 0);
    const commission = Math.round(revenue * staff.commissionRate / 100);
    return {
      name: staff.name,
      revenue,
      count: staffCompleted.length,
      commission,
      commissionRate: staff.commissionRate,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">業績報表</h1>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-5">
        <div className="text-sm font-medium text-[#1c1c1c] mb-3">選擇期間</div>
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          />
          <span className="text-[#8a7a6e] text-sm">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">總營收</div>
          <div className="text-2xl font-semibold text-[#8b6748]">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">總預約數</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">完成率</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">{completionRate}%</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">新增會員數</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">{newCustomers}</div>
        </div>
      </div>

      {/* Store breakdown */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">各門市業績</h2>
        <div className="space-y-3">
          {storeStats.map(s => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-[#e8ddd2] last:border-0">
              <div>
                <div className="text-sm text-[#1c1c1c]">{s.name}</div>
                <div className="text-xs text-[#8a7a6e]">{s.count} 筆完成</div>
              </div>
              <div className="text-sm font-medium text-[#8b6748]">${s.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff breakdown */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">各員工業績與抽成</h2>
        <div className="space-y-3">
          {staffStats.map(s => (
            <div key={s.name} className="py-2 border-b border-[#e8ddd2] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-[#1c1c1c]">{s.name}</div>
                <div className="text-sm font-medium text-[#8b6748]">${s.revenue.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#8a7a6e]">
                <span>{s.count} 筆完成 · 抽成 {s.commissionRate}%</span>
                <span>抽成金額：<span className="text-[#8b6748]">${s.commission.toLocaleString()}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
