"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_BOOKINGS, ADMIN_STAFF, ADMIN_STORES, ADMIN_CUSTOMERS, MONTHLY_EXPENSES, PRODUCT_SALES, STORED_VALUE_RECORDS, PaymentMethod } from "@/lib/adminMockData";
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

  // Stored value analysis
  const storedValueDeposits = STORED_VALUE_RECORDS.filter(r => r.date >= dateFrom && r.date <= dateTo);
  const totalDeposited = storedValueDeposits.reduce((s, r) => s + r.amount, 0);
  // Total consumed via 儲值金 payment in completed bookings (all time, to match customer balances)
  const storedValueUsedBookings = completed.filter(b => b.paymentMethod === "儲值金");
  const totalConsumed = storedValueUsedBookings.reduce((s, b) => s + b.price, 0);
  // Remaining balance = sum of all customers' storedValue
  const totalRemainingBalance = ADMIN_CUSTOMERS.reduce((s, c) => s + (c.storedValue ?? 0), 0);

  // Per-customer stored value breakdown
  const customerStoredValueBreakdown = ADMIN_CUSTOMERS
    .filter(c => (c.storedValue ?? 0) > 0 || STORED_VALUE_RECORDS.some(r => r.customerId === c.id))
    .map(c => {
      const deposits = STORED_VALUE_RECORDS.filter(r => r.customerId === c.id).reduce((s, r) => s + r.amount, 0);
      const consumed = ADMIN_BOOKINGS.filter(b => b.customerId === c.id && b.paymentMethod === "儲值金" && b.status === "已完成").reduce((s, b) => s + b.price, 0);
      return { name: c.name, phone: c.phone, deposits, consumed, balance: c.storedValue ?? 0 };
    })
    .filter(c => c.deposits > 0 || c.balance > 0)
    .sort((a, b) => b.balance - a.balance);

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

    // Return rate: customers who booked this staff more than once in period
    const customerIds = staffCompleted.map(b => b.customerId);
    const uniqueCustomers = new Set(customerIds).size;
    const returningCustomers = customerIds.length - uniqueCustomers;
    const returnRate = uniqueCustomers > 0 ? Math.round((returningCustomers / uniqueCustomers) * 100) : 0;

    return {
      name: staff.name,
      revenue,
      count: staffCompleted.length,
      commissionPerSession: staff.commissionPerSession,
      totalCommission,
      positionAllowance: staff.positionAllowance,
      returnRate,
      uniqueCustomers,
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

      {/* Stored value breakdown */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-medium text-[#1c1c1c]">儲值金分析</h2>
          <span className="text-xs text-[#8a7a6e]">— 收到但尚未消費的金額需列清</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#faf7f2] rounded-xl p-3 text-center">
            <div className="text-xs text-[#8a7a6e] mb-1">期間充值</div>
            <div className="text-lg font-semibold text-[#8b6748]">${totalDeposited.toLocaleString()}</div>
            <div className="text-[10px] text-[#8a7a6e] mt-0.5">已入帳</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-[#8a7a6e] mb-1">已消費</div>
            <div className="text-lg font-semibold text-green-700">${totalConsumed.toLocaleString()}</div>
            <div className="text-[10px] text-[#8a7a6e] mt-0.5">儲值金付款</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
            <div className="text-xs text-amber-700 mb-1 font-medium">未消費餘額</div>
            <div className="text-lg font-semibold text-amber-700">${totalRemainingBalance.toLocaleString()}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">客人尚未使用</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-xs text-amber-700">
            ⚠ 未消費餘額 <strong>${totalRemainingBalance.toLocaleString()}</strong> 為客人已付但尚未兌換成服務的金額，屬於負債，不計入利潤。
          </p>
        </div>
        {customerStoredValueBreakdown.length > 0 && (
          <div>
            <div className="text-xs text-[#8a7a6e] mb-2 font-medium">各客戶儲值明細</div>
            <div className="space-y-2">
              {customerStoredValueBreakdown.map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-[#f0e8df] last:border-0">
                  <div>
                    <div className="text-sm text-[#1c1c1c]">{c.name}</div>
                    <div className="text-xs text-[#8a7a6e]">充值 ${c.deposits.toLocaleString()} · 已用 ${c.consumed.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${c.balance > 0 ? "text-amber-700" : "text-green-600"}`}>
                      餘 ${c.balance.toLocaleString()}
                    </div>
                    {c.balance < 0 && (
                      <div className="text-xs text-red-500">欠款</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

      {/* ── Rankings ── */}
      {(() => {
        const MEDALS = ["🥇", "🥈", "🥉"];
        const byCount = [...staffStats].filter(s => s.count > 0).sort((a, b) => b.count - a.count);
        const byRevenue = [...staffStats].filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue);
        const maxCount = byCount[0]?.count || 1;
        const maxRevenue = byRevenue[0]?.revenue || 1;
        return (
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* 名氣王 */}
            <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👑</span>
                <h2 className="text-sm font-semibold text-[#1c1c1c]">名氣榜</h2>
                <span className="text-xs text-[#8a7a6e]">— 本月預約次數</span>
              </div>
              {byCount.length === 0 ? <p className="text-sm text-[#8a7a6e]">此期間無資料</p> : (
                <div className="space-y-3">
                  {byCount.map((s, i) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base w-6">{MEDALS[i] || `${i + 1}`}</span>
                          <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#8b6748]">{s.count} 次</span>
                      </div>
                      <div className="h-2 bg-[#f5f0e8] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8b6748] to-[#c4a882] rounded-full transition-all" style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 感召榜 */}
            {(() => {
              const byReturn = [...staffStats].filter(s => s.uniqueCustomers > 0).sort((a, b) => b.returnRate - a.returnRate);
              const maxReturn = byReturn[0]?.returnRate || 1;
              return (
                <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🌟</span>
                    <h2 className="text-sm font-semibold text-[#1c1c1c]">職人榜</h2>
                    <span className="text-xs text-[#8a7a6e]">— 客人指定回購率</span>
                  </div>
                  <p className="text-xs text-[#8a7a6e] mb-3">同一位客人在此期間再次預約同一技師的比例</p>
                  {byReturn.length === 0 ? <p className="text-sm text-[#8a7a6e]">此期間無資料</p> : (
                    <div className="space-y-3">
                      {byReturn.map((s, i) => (
                        <div key={s.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base w-6">{MEDALS[i] || `${i + 1}`}</span>
                              <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-[#8b6748]">{s.returnRate}%</span>
                          </div>
                          <div className="h-2 bg-[#f5f0e8] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#d4b896] to-[#8b6748] rounded-full transition-all" style={{ width: `${Math.round((s.returnRate / maxReturn) * 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-[#8a7a6e] mt-0.5">{s.uniqueCustomers} 位客人中，{s.returnRate > 0 ? Math.round(s.uniqueCustomers * s.returnRate / 100) : 0} 位回頭</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* 職人榜・推薦 (product sales) */}
      {(() => {
        const productStats = ADMIN_STAFF.map(staff => {
          const sales = PRODUCT_SALES.filter(ps =>
            ps.staffId === staff.id &&
            ps.date >= dateFrom && ps.date <= dateTo &&
            (selectedStore === "all" || ps.storeId === selectedStore)
          );
          return {
            name: staff.name,
            salesCount: sales.reduce((s, p) => s + p.qty, 0),
            salesRevenue: sales.reduce((s, p) => s + p.totalPrice, 0),
            commission: sales.reduce((s, p) => s + p.commission, 0),
          };
        }).filter(s => s.salesCount > 0).sort((a, b) => b.salesCount - a.salesCount);

        if (productStats.length === 0) return null;
        const maxSales = productStats[0].salesCount;
        return (
          <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎁</span>
              <h2 className="text-sm font-semibold text-[#1c1c1c]">行銷榜</h2>
              <span className="text-xs text-[#8a7a6e]">— 產品銷售件數</span>
            </div>
            <p className="text-xs text-[#8a7a6e] mb-3">調理結束後向客人推薦並售出產品的次數</p>
            <div className="space-y-3">
              {productStats.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base w-6">{["🥇","🥈","🥉"][i] || `${i+1}`}</span>
                      <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#8b6748]">{s.salesCount} 件</span>
                      <span className="text-xs text-[#8a7a6e] ml-2">抽成 ${s.commission.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#f5f0e8] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#a8c4b8] to-[#5a9e88] rounded-full" style={{ width: `${Math.round((s.salesCount / maxSales) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
