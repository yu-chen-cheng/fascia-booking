"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { MONTHLY_EXPENSES, FIXED_EXPENSE_TEMPLATES, ADMIN_STORES, ADMIN_STAFF, ADMIN_BOOKINGS, MonthlyExpense, ExpenseCategory } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

const CATEGORIES: ExpenseCategory[] = ["房租", "水電", "薪水費", "耗材", "其他"];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "房租": "bg-red-50 text-red-700",
  "水電": "bg-blue-50 text-blue-700",
  "薪水費": "bg-orange-50 text-orange-700",
  "耗材": "bg-green-50 text-green-700",
  "其他": "bg-gray-100 text-gray-600",
};

export default function ExpensesPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [expenses, setExpenses] = useState<MonthlyExpense[]>(MONTHLY_EXPENSES);
  const [month, setMonth] = useState("2026-06");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<MonthlyExpense>>({
    category: "耗材", storeId: "ST01", amount: 0,
  });

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const monthExpenses = expenses.filter(e => e.month === month);
  const unconfirmed = monthExpenses.filter(e => !e.confirmed);

  // Calculate salary for each staff based on completed bookings this month
  const staffSalaries = ADMIN_STAFF.map(s => {
    const completedThisMonth = ADMIN_BOOKINGS.filter(
      b => b.staffId === s.id && b.status === "已完成" && b.date.startsWith(month)
    );
    const sessionCount = completedThisMonth.length;
    const commissionTotal = sessionCount * s.commissionPerSession;
    const storeName = ADMIN_STORES.find(st => st.id === s.storeId)?.name || "";

    if (s.employmentType === "僱傭制") {
      // 底薪 + 抽成 + 職位加給
      const total = s.baseSalary + commissionTotal + s.positionAllowance;
      return { ...s, sessionCount, commissionTotal, totalSalary: total, storeName };
    } else {
      // 承攬制：只有抽成，無底薪
      return { ...s, sessionCount, commissionTotal, totalSalary: commissionTotal, storeName };
    }
  });
  const totalSalaryExpense = staffSalaries.reduce((s, st) => s + st.totalSalary, 0);

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0) + totalSalaryExpense;
  const confirmedTotal = monthExpenses.filter(e => e.confirmed).reduce((s, e) => s + e.amount, 0);

  const confirmAll = () => {
    setExpenses(prev => prev.map(e =>
      e.month === month ? { ...e, confirmed: true } : e
    ));
  };

  const confirmOne = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, confirmed: true } : e));
  };

  const addExpense = () => {
    if (!newExpense.name || !newExpense.amount) return;
    const id = `ME${String(expenses.length + 1).padStart(2, "0")}`;
    setExpenses(prev => [...prev, {
      ...newExpense,
      id,
      month,
      confirmed: false,
      isFixed: false,
    } as MonthlyExpense]);
    setShowAddModal(false);
    setNewExpense({ category: "耗材", storeId: "ST01", amount: 0 });
  };

  const getStoreName = (storeId: string) => {
    if (storeId === "all") return "全館";
    return ADMIN_STORES.find(s => s.id === storeId)?.name || storeId;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">費用管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">固定費用防呆確認</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm"
        >
          + 新增費用
        </button>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
        />
      </div>

      {/* 防呆警示 */}
      {unconfirmed.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-amber-800 mb-1">
                ⚠ 尚有 {unconfirmed.length} 筆費用未確認
              </div>
              <div className="text-xs text-amber-700">
                請確認本月固定支出已正確記錄，否則報表利潤計算將不準確
              </div>
            </div>
            <button
              onClick={confirmAll}
              className="ml-4 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium whitespace-nowrap"
            >
              全部確認
            </button>
          </div>
        </div>
      )}

      {unconfirmed.length === 0 && monthExpenses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <div className="text-sm font-medium text-green-800">✓ 本月所有費用已確認</div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">本月總支出（含薪水）</div>
          <div className="text-2xl font-semibold text-red-600">${totalExpense.toLocaleString()}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">薪水費 ${totalSalaryExpense.toLocaleString()} + 其他 ${monthExpenses.reduce((s,e)=>s+e.amount,0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e] mb-1">固定費用確認狀況</div>
          <div className="text-2xl font-semibold text-[#1c1c1c]">${confirmedTotal.toLocaleString()}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">
            {unconfirmed.length > 0
              ? <span className="text-amber-600">待確認 {unconfirmed.length} 筆</span>
              : <span className="text-green-600">全部確認 ✓</span>
            }
          </div>
        </div>
      </div>

      {/* Fixed expenses */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-1">固定費用</h2>
        <p className="text-xs text-[#8a7a6e] mb-4">每月自動帶入，需人工確認金額正確</p>
        {monthExpenses.filter(e => e.isFixed).length === 0 ? (
          <p className="text-sm text-[#8a7a6e]">本月無固定費用記錄</p>
        ) : (
          <div className="space-y-2">
            {monthExpenses.filter(e => e.isFixed).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-[#e8ddd2] last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category]}`}>{e.category}</span>
                  <div>
                    <div className="text-sm text-[#1c1c1c]">{e.name}</div>
                    <div className="text-xs text-[#8a7a6e]">{getStoreName(e.storeId)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1c1c1c]">${e.amount.toLocaleString()}</span>
                  {e.confirmed ? (
                    <span className="text-xs text-green-600 font-medium">✓ 已確認</span>
                  ) : (
                    <button
                      onClick={() => confirmOne(e.id)}
                      className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg"
                    >
                      確認
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff salary section */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <h2 className="text-sm font-medium text-[#1c1c1c] mb-1">薪水費明細</h2>
        <p className="text-xs text-[#8a7a6e] mb-4">依本月已完成預約自動計算</p>
        <div className="space-y-3">
          {staffSalaries.map(s => (
            <div key={s.id} className="py-2.5 border-b border-[#e8ddd2] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    s.employmentType === "僱傭制"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>{s.employmentType}</span>
                  <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                  <span className="text-xs text-[#8a7a6e]">{s.storeName}</span>
                </div>
                <span className="text-sm font-medium text-[#1c1c1c]">${s.totalSalary.toLocaleString()}</span>
              </div>
              <div className="text-xs text-[#8a7a6e] ml-0 space-y-0.5">
                {s.employmentType === "僱傭制" && (
                  <div className="flex justify-between">
                    <span>底薪</span><span>${s.baseSalary.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>抽成（{s.sessionCount} 筆 × ${s.commissionPerSession.toLocaleString()}）</span>
                  <span>${s.commissionTotal.toLocaleString()}</span>
                </div>
                {s.positionAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>職位加給</span><span>${s.positionAllowance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#e8ddd2] flex justify-between text-sm font-medium">
          <span className="text-[#1c1c1c]">薪水費合計</span>
          <span className="text-orange-700">${totalSalaryExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* Variable expenses */}
      {monthExpenses.filter(e => !e.isFixed).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <h2 className="text-sm font-medium text-[#1c1c1c] mb-4">臨時支出</h2>
          <div className="space-y-2">
            {monthExpenses.filter(e => !e.isFixed).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-[#e8ddd2] last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category]}`}>{e.category}</span>
                  <div>
                    <div className="text-sm text-[#1c1c1c]">{e.name}</div>
                    <div className="text-xs text-[#8a7a6e]">{getStoreName(e.storeId)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1c1c1c]">${e.amount.toLocaleString()}</span>
                  {e.confirmed ? (
                    <span className="text-xs text-green-600 font-medium">✓</span>
                  ) : (
                    <button onClick={() => confirmOne(e.id)} className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">確認</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed expense templates note */}
      <div className="bg-[#faf7f2] rounded-2xl p-4 mt-4">
        <h3 className="text-xs font-medium text-[#8b6748] mb-2">固定費用範本設定</h3>
        <div className="space-y-1.5">
          {FIXED_EXPENSE_TEMPLATES.map(t => (
            <div key={t.id} className="flex justify-between text-xs text-[#8a7a6e]">
              <span>{t.name}</span>
              <span>${t.amount.toLocaleString()} ／月</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8a7a6e] mt-3">如需修改固定費用金額，請聯絡系統管理員調整範本。</p>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增臨時支出</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">名稱</label>
                <input
                  placeholder="例：精油補貨"
                  value={newExpense.name || ""}
                  onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">類別</label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">門市</label>
                <select
                  value={newExpense.storeId}
                  onChange={e => setNewExpense(p => ({ ...p, storeId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  <option value="all">全館</option>
                  {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">金額</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newExpense.amount || ""}
                  onChange={e => setNewExpense(p => ({ ...p, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">備註（選填）</label>
                <input
                  placeholder=""
                  value={newExpense.note || ""}
                  onChange={e => setNewExpense(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button
                onClick={addExpense}
                disabled={!newExpense.name || !newExpense.amount}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
