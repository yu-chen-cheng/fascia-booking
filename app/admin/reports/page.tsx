"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_BOOKINGS, ADMIN_STAFF, ADMIN_STORES, ADMIN_CUSTOMERS, MONTHLY_EXPENSES, PaymentMethod } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PAYMENT_METHODS: PaymentMethod[] = ["現金", "電子支付", "轉帳", "信用卡", "儲值金"];

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  "現金": "bg-green-50 text-green-700",
  "電子支付": "bg-blue-50 text-blue-700",
  "轉帳": "bg-purple-50 text-purple-700",
  "信用卡": "bg-orange-50 text-orange-700",
  "儲值金": "bg-[#faf7f2] text-[#8b6748]",
};

export default function ReportsPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo] = useState("2026-06-30");
  const [selectedStore, setSelectedStore] = useState<string>("all");

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const today = "2026-06-13";

  // Filter by date range and store
  const filtered = ADMIN_BOOKINGS.filter(b => {
    const inRange = b.date >= dateFrom && b.date <= dateTo;
    const inStore = selectedStore === "all" || b.storeId === selectedStore;
    return inRange && inStore;
  });
  const completed = filtered.filter(b => b.status === "已完成");
  const totalRevenue = completed.reduce((s, b) => s + b.price, 0);
  const completionRate = filtered.length > 0 ? Math.round((completed.length / filtered.length) * 100) : 0;
  const newCustomers = ADMIN_CUSTOMERS.filter(c => c.joinDate >= dateFrom && c.joinDate <= dateTo).length;

  // Expenses for the selected month range
  const reportMonth = dateFrom.slice(0, 7); // "2026-06"
  const monthExpenses = MONTHLY_EXPENSES.filter(e => e.month === reportMonth);
  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const unconfirmedExpenses = monthExpenses.filter(e => !e.confirmed);
  const netProfit = totalRevenue - totalExpense;

  // Today revenue
  const todayCompleted = ADMIN_BOOKINGS.filter(b =>
    b.date === today &&
    b.status === "已完成" &&
    (selectedStore === "all" || b.storeId === selectedStore)
  );
  const todayRevenue = todayCompleted.reduce((s, b) => s + b.price, 0);

  // Payment method breakdown
  const paymentStats = PAYMENT_METHODS.map(method => {
    const methodBookings = completed.filter(b => b.paymentMethod === method);
    const revenue = methodBookings.reduce((s, b) => s + b.price, 0);
    return { method, revenue, count: methodBookings.length };
  }).filter(p => p.count > 0);

  // By store
  const storeStats = ADMIN_STORES.map(store => {
    const storeCompleted = ADMIN_BOOKINGS.filter(b =>
      b.status === "已完成" && b.storeId === store.id && b.date >= dateFrom && b.date <= dateTo
    );
    return {
      id: store.id,
      name: store.name,
      revenue: storeCompleted.reduce((s, b) => s + b.price, 0),
      count: storeCompleted.length,
    };
  });

  // By staff
  const staffStats = ADMIN_STAFF.map(staff => {
    const staffCompleted = completed.filter(b => b.staffId === staff.id);
    const revenue = staffCompleted.reduce((s, b) => s + b.price, 0);
    const totalCommission = staffCompleted.length * staff.commissionPerSession;
    return {
      name: staff.name,
      revenue,
      count: staffCompleted.length,
      commissionPerSession: staff.commissionPerSession,
      totalCommission,
      positionAllowance: staff.positionAllowance,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">業績報表</h1>
      </div>

      {/* Store tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedStore("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedStore === "all" ? "bg-[#8b6748] text-white" : "bg-white border border-[#e8ddd2] text-[#8a7a6e]"}`}
        >
          全部分店
        </button>
        {ADMIN_STORES.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStore(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedStore === s.id ? "bg-[#8b6748] text-white" : "bg-white border border-[#e8ddd2] text-[#8a7a6e]"}`}
          >
            {s.name}
          </button>
        ))}
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
          <div className="text-xs text-[#8a7a6e] mb-1">本日營收</div>
          <div className="text-2xl font-semibold text-[#8b6748]">${todayRevenue.toLocaleString()}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">{todayCompleted.length} 筆完成</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">期間總營收</div>
          <div className="text-2xl font-semibold text-[#8b6748]">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">{completed.length} 筆完成</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">完成率</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">{completionRate}%</div>
          <div className="text-xs text-[#8a7a6e] mt-1">共 {filtered.length} 筆預約</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">新增會員數</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">{newCustomers}</div>
        </div>
      </div>

      {/* Expense warning */}
      {unconfirmedExpenses.length > 0 && (
        <Link href="/admin/expenses" className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-800">⚠ 有 {unconfirmedExpenses.length} 筆費用尚未確認</div>
              <div className="text-xs text-amber-700 mt-0.5">利潤計算可能不準確，點此前往確認費用</div>
            </div>
            <span className="text-amber-600 text-sm">→</span>
          </div>
        </Link>
      )}

      {/* Revenue vs Expense */}
      {monthExpenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
          <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">收支概覽（{reportMonth}）</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8a7a6e]">期間總營收</span>
              <span className="text-sm font-medium text-[#8b6748]">+${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8a7a6e]">總支出</span>
              <span className="text-sm font-medium text-red-600">−${totalExpense.toLocaleString()}</span>
            </div>
            <div className="border-t border-[#e8ddd2] pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1c1c1c]">淨利潤</span>
              <span className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {netProfit >= 0 ? "+" : ""}${netProfit.toLocaleString()}
              </span>
            </div>
            {unconfirmedExpenses.length > 0 && (
              <p className="text-xs text-amber-600">* 尚有未確認費用，利潤數字僅供參考</p>
            )}
          </div>
        </div>
      )}

      {/* Payment method breakdown */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">付款方式分析</h2>
        {paymentStats.length === 0 ? (
          <p className="text-sm text-[#8a7a6e]">此期間無已完成訂單</p>
        ) : (
          <div className="space-y-2">
            {paymentStats.map(p => {
              const pct = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[p.method as PaymentMethod]}`}>{p.method}</span>
                      <span className="text-xs text-[#8a7a6e]">{p.count} 筆</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8a7a6e]">{pct}%</span>
                      <span className="text-sm font-medium text-[#8b6748]">${p.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#f5f0e8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8b6748] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Store breakdown */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">各門市業績</h2>
        <div className="space-y-3">
          {storeStats.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#e8ddd2] last:border-0">
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
                <span>{s.count} 筆完成 · 每筆抽成 ${s.commissionPerSession.toLocaleString()}</span>
                <span>抽成合計：<span className="text-[#8b6748]">${s.totalCommission.toLocaleString()}</span></span>
              </div>
              {s.positionAllowance > 0 && (
                <div className="text-xs text-[#8a7a6e] mt-0.5 text-right">
                  職位加給：<span className="text-[#8b6748]">${s.positionAllowance.toLocaleString()}</span>／月
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
