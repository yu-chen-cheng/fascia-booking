"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/adminContext";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
const fmt = (n: number) => n.toLocaleString();

const STATUS_LABEL: Record<string, string> = {
  confirmed: "確認", completed: "完成", cancelled: "取消", no_show: "爽約",
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  no_show: "bg-red-50 text-red-700 border-red-200",
};

export default function DashboardPage() {
  const { user, activeBranchId, activeBranchName } = useAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const monthStr = today.slice(0, 7);

  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clockedIn, setClockedIn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [activeBranchId]);

  async function loadData() {
    setLoading(true);

    // Build branch filter for bookings (store_id uses different naming)
    const storeMap: Record<string, string> = { ST01: "xiaoJudan", ST02: "daan", ST03: "banqiao" };
    const storeId = storeMap[activeBranchId] ?? activeBranchId;

    const [{ data: todayB }, { data: sp }, { data: clocks }, { data: monthCO }, { data: todayCO }] = await Promise.all([
      supabase.from("bookings").select("*, customers(name)")
        .eq("store_id", storeId).eq("date", today)
        .order("time_slot"),
      supabase.from("staff_profiles")
        .select("id,name,level").eq("branch_id", activeBranchId).eq("is_active", true),
      supabase.from("clock_records")
        .select("staff_id,clock_in,clock_out,staff_profiles(name)")
        .eq("branch_id", activeBranchId).eq("date", today),
      supabase.from("service_checkouts")
        .select("total_amount")
        .eq("branch_id", activeBranchId)
        .gte("created_at", monthStr + "-01T00:00:00+08:00"),
      supabase.from("service_checkouts")
        .select("total_amount")
        .eq("branch_id", activeBranchId)
        .gte("created_at", today + "T00:00:00+08:00")
        .lte("created_at", today + "T23:59:59+08:00"),
    ]);

    setTodayBookings(todayB ?? []);
    setStaffList(sp ?? []);
    setClockedIn(clocks ?? []);
    setTodayRevenue((todayCO ?? []).reduce((s: number, c: any) => s + c.total_amount, 0));
    setMonthRevenue((monthCO ?? []).reduce((s: number, c: any) => s + c.total_amount, 0));
    setLoading(false);
  }

  if (!user) return null;

  const todayDateLabel = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

  const confirmedCount = todayBookings.filter(b => b.status === "confirmed").length;
  const completedCount = todayBookings.filter(b => b.status === "completed").length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">首頁總覽</h1>
        <div className="text-sm text-[#8a7a6e] mt-0.5">{todayDateLabel} · {activeBranchName}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e]">今日預約</div>
          <div className="text-3xl font-bold text-[#8b6748] mt-1">{todayBookings.length}</div>
          <div className="text-xs text-[#8a7a6e] mt-0.5">確認 {confirmedCount} · 完成 {completedCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
          <div className="text-xs text-[#8a7a6e]">今日收款</div>
          <div className="text-2xl font-bold text-[#8b6748] mt-1">${fmt(todayRevenue)}</div>
          <div className="text-xs text-[#8a7a6e] mt-0.5">本月累計 ${fmt(monthRevenue)}</div>
        </div>
      </div>

      {loading ? <div className="py-8 text-center text-sm text-[#8a7a6e]">載入中…</div> : (
        <>
          {/* Today's schedule */}
          <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-medium text-[#1c1c1c]">今日預約</h2>
              <Link href="/admin/bookings" className="text-xs text-[#8b6748]">查看全部 →</Link>
            </div>
            {todayBookings.length === 0 ? (
              <div className="text-sm text-[#8a7a6e] py-4 text-center">今日無預約</div>
            ) : (
              <div className="space-y-2">
                {todayBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#f0e8df] last:border-0">
                    <div>
                      <div className="text-sm text-[#1c1c1c]">
                        <span className="font-medium">{b.time_slot}</span>
                        {" · "}
                        {b.customers?.name ?? "—"}
                      </div>
                      <div className="text-xs text-[#8a7a6e]">{b.service_id}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[b.status] ?? ""}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clock-in status */}
          {staffList.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-medium text-[#1c1c1c]">今日出勤</h2>
                <Link href="/admin/attendance" className="text-xs text-[#8b6748]">打卡記錄 →</Link>
              </div>
              <div className="space-y-2">
                {staffList.map(s => {
                  const clock = clockedIn.find((c: any) => c.staff_id === s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="text-[#1c1c1c]">{s.name}</div>
                      {clock ? (
                        <div className="text-xs text-green-700">
                          {new Date(clock.clock_in).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                          {clock.clock_out ? ` — ${new Date(clock.clock_out).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : " 打卡中"}
                        </div>
                      ) : (
                        <div className="text-xs text-[#d0c4b8]">未打卡</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/bookings" className="bg-[#8b6748] text-white text-center py-3 rounded-xl text-sm font-medium">管理預約</Link>
        <Link href="/admin/cashout" className="bg-white border border-[#e8ddd2] text-[#8b6748] text-center py-3 rounded-xl text-sm font-medium">每日結帳</Link>
        <Link href="/admin/schedule" className="bg-white border border-[#e8ddd2] text-[#1c1c1c] text-center py-3 rounded-xl text-sm">排班管理</Link>
        <Link href="/admin/reports" className="bg-white border border-[#e8ddd2] text-[#1c1c1c] text-center py-3 rounded-xl text-sm">業績報表</Link>
      </div>
    </div>
  );
}
