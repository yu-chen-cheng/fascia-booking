"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => n.toLocaleString();

const PAY_LABELS: Record<string, string> = {
  cash: "現金", stored_value: "儲值金", e_payment: "電子支付",
  credit_card: "信用卡", bank_transfer: "轉帳",
  voucher: "墨攻券", partner: "特約廠商", sponsored: "贊助",
};

export default function ReportsPage() {
  const { user, activeBranchId, activeBranchName, canSwitchBranch } = useAdmin();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<"業績" | "收款" | "費用">("業績");

  const dateFrom = month + "-01";
  const dateTo = (() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m, 0).toISOString().slice(0, 10);
  })();

  useEffect(() => { loadData(); }, [month, activeBranchId]);

  async function loadData() {
    setLoading(true);
    const [{ data: co }, { data: sp }, { data: ex }] = await Promise.all([
      supabase.from("service_checkouts")
        .select("*")
        .eq("branch_id", activeBranchId)
        .gte("created_at", dateFrom + "T00:00:00+08:00")
        .lte("created_at", dateTo + "T23:59:59+08:00"),
      supabase.from("staff_profiles")
        .select("id,name,level,employment_type,base_salary,position_allowance,session_threshold")
        .eq("branch_id", activeBranchId).eq("is_active", true),
      supabase.from("daily_checkouts")
        .select("*").eq("branch_id", activeBranchId)
        .gte("date", dateFrom).lte("date", dateTo),
    ]);
    setCheckouts(co ?? []);
    setStaffList(sp ?? []);
    setExpenses(ex ?? []);
    setLoading(false);
  }

  // Per-staff commission summary
  const staffStats = useMemo(() => {
    return staffList.map(staff => {
      const myCos = checkouts.filter(c => c.staff_id === staff.id);
      const sessions = myCos.length;
      const totalRevenue = myCos.reduce((s, c) => s + c.total_amount, 0);
      const totalCommission = myCos.reduce((s, c) => s + c.staff_commission, 0);

      let salary = 0;
      if (staff.employment_type === "僱傭制") {
        salary = staff.base_salary + staff.position_allowance;
        // Commission kicks in after session_threshold
        const billable = myCos.slice(staff.session_threshold ?? 40);
        const extraComm = billable.reduce((s: number, c: any) => s + c.staff_commission, 0);
        salary += extraComm;
      } else {
        salary = totalCommission + staff.position_allowance;
      }

      return { ...staff, sessions, totalRevenue, totalCommission, estimatedPay: salary };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [staffList, checkouts]);

  // Payment method totals
  const payTotals = useMemo(() => {
    const t: Record<string, number> = {};
    Object.keys(PAY_LABELS).forEach(k => t[k] = 0);
    t.total = 0;
    checkouts.forEach(c => {
      Object.keys(PAY_LABELS).forEach(k => { t[k] = (t[k] || 0) + (c[k] || 0); });
      t.total += c.total_amount;
    });
    return t;
  }, [checkouts]);

  // Expense totals from daily_checkouts
  const expenseTotals = useMemo(() => {
    const laundry = expenses.reduce((s, e) => s + (e.laundry_fee || 0), 0);
    const misc = expenses.reduce((s, e) => s + (e.miscellaneous || 0), 0);
    return { laundry, misc, total: laundry + misc };
  }, [expenses]);

  const totalCommission = staffStats.reduce((s, st) => s + st.totalCommission, 0);
  const totalRevenue = payTotals.total;
  const grossProfit = totalRevenue - totalCommission - expenseTotals.total;

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-[#1c1c1c]">業績報表</h1>
          <div className="text-xs text-[#8a7a6e]">{activeBranchName}</div>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="text-sm border border-[#e8ddd2] rounded-lg px-3 py-1.5" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: "總收入", val: `$${fmt(totalRevenue)}`, color: "text-[#8b6748]" },
          { label: "服務筆數", val: `${checkouts.length} 筆`, color: "text-[#1c1c1c]" },
          { label: "技師抽成", val: `$${fmt(totalCommission)}`, color: "text-green-700" },
          { label: "毛利估算", val: `$${fmt(grossProfit)}`, color: grossProfit >= 0 ? "text-blue-700" : "text-red-600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-[#e8ddd2] text-center">
            <div className="text-xs text-[#8a7a6e]">{label}</div>
            <div className={`text-base font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5ede4] rounded-xl p-1 mb-4">
        {(["業績", "收款", "費用"] as const).map(t => (
          <button key={t} onClick={() => setViewTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${viewTab === t ? "bg-white text-[#8b6748] shadow-sm" : "text-[#8a7a6e]"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="py-10 text-center text-sm text-[#8a7a6e]">載入中…</div> : (
        <>
          {viewTab === "業績" && (
            <div className="space-y-2">
              {staffStats.length === 0 && <div className="py-10 text-center text-sm text-[#8a7a6e]">本月無資料</div>}
              {staffStats.map(st => (
                <div key={st.id} className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-[#1c1c1c]">{st.name}</div>
                      <div className="text-xs text-[#8a7a6e]">{st.level} · {st.employment_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#8b6748]">${fmt(st.totalRevenue)}</div>
                      <div className="text-xs text-[#8a7a6e]">{st.sessions} 筆</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-green-600">抽成合計</div>
                      <div className="font-bold text-green-800">${fmt(st.totalCommission)}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-blue-600">職務加給</div>
                      <div className="font-bold text-blue-800">${fmt(st.position_allowance)}</div>
                    </div>
                    <div className="bg-[#faf7f2] rounded-lg p-2 text-center">
                      <div className="text-[#8a7a6e]">預估薪資</div>
                      <div className="font-bold text-[#8b6748]">${fmt(st.estimatedPay)}</div>
                    </div>
                  </div>
                  {st.employment_type === "僱傭制" && (
                    <div className="mt-1 text-xs text-[#8a7a6e] text-center">
                      底薪 ${fmt(st.base_salary)}，滿 {st.session_threshold} 人次後計抽成
                      {st.sessions >= st.session_threshold ? ` ✓ 已達標（${st.sessions}/${st.session_threshold}）` : ` (${st.sessions}/${st.session_threshold})`}
                    </div>
                  )}
                </div>
              ))}

              {/* Total commission */}
              {staffStats.length > 0 && (
                <div className="bg-[#faf7f2] rounded-xl p-4 border border-[#e8ddd2]">
                  <div className="flex justify-between font-bold text-sm">
                    <span>技師薪資合計</span>
                    <span className="text-[#8b6748]">${fmt(staffStats.reduce((s, st) => s + st.estimatedPay, 0))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewTab === "收款" && (
            <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
              <div className="text-sm font-medium text-[#1c1c1c] mb-3">月收款方式拆分</div>
              {Object.entries(PAY_LABELS).map(([key, label]) => {
                const val = payTotals[key] || 0;
                const pct = totalRevenue > 0 ? Math.round((val / totalRevenue) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 py-2 border-b border-[#f0e8df] last:border-0">
                    <div className="text-sm text-[#8a7a6e] w-20">{label}</div>
                    <div className="flex-1 bg-[#f5ede4] rounded-full h-2">
                      <div className="bg-[#8b6748] h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-sm font-medium w-20 text-right">${fmt(val)}</div>
                    <div className="text-xs text-[#8a7a6e] w-8 text-right">{pct}%</div>
                  </div>
                );
              })}
              <div className="mt-3 flex justify-between font-bold text-sm border-t border-[#e8ddd2] pt-3">
                <span>總計</span><span className="text-[#8b6748]">${fmt(totalRevenue)}</span>
              </div>
            </div>
          )}

          {viewTab === "費用" && (
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#8a7a6e]">本月無日結費用記錄</div>
              ) : (
                <>
                  <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                    <div className="text-sm font-medium text-[#1c1c1c] mb-3">每日費用記錄</div>
                    {expenses.filter(e => e.laundry_fee > 0 || e.miscellaneous > 0).map(e => (
                      <div key={e.id} className="py-2 border-b border-[#f0e8df] last:border-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#8a7a6e]">{e.date}</span>
                          <span>${fmt((e.laundry_fee || 0) + (e.miscellaneous || 0))}</span>
                        </div>
                        {e.laundry_fee > 0 && <div className="text-xs text-[#8a7a6e]">洗衣費 ${fmt(e.laundry_fee)}{e.laundry_date ? ` (${e.laundry_date})` : ""}</div>}
                        {e.miscellaneous > 0 && <div className="text-xs text-[#8a7a6e]">雜支 ${fmt(e.miscellaneous)}{e.miscellaneous_note ? ` - ${e.miscellaneous_note}` : ""}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#faf7f2] rounded-xl p-4 border border-[#e8ddd2]">
                    <div className="flex justify-between text-sm"><span className="text-[#8a7a6e]">洗衣費合計</span><span>${fmt(expenseTotals.laundry)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[#8a7a6e]">雜支合計</span><span>${fmt(expenseTotals.misc)}</span></div>
                    <div className="flex justify-between font-bold text-sm border-t border-[#e8ddd2] mt-2 pt-2">
                      <span>費用合計</span><span className="text-red-600">${fmt(expenseTotals.total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
