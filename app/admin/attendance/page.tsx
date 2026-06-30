"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

// 三間分店的 GPS 座標
const BRANCH_LOCATIONS = {
  ST01: { name: "小巨蛋店", lat: 25.0507, lng: 121.5569 },
  ST02: { name: "大安店",   lat: 25.0297, lng: 121.5479 },
  ST03: { name: "板橋店",   lat: 25.0115, lng: 121.4609 },
};
const CHECKIN_RADIUS_M = 100; // 公尺

// 加班計算
const STANDARD_HOURS = 8;   // 標準工時
const MEAL_HOURS = 1;        // 用餐時間
const TOTAL_REQUIRED = STANDARD_HOURS + MEAL_HOURS; // 9小時在場
const OT_RATE_1 = 1.33;     // 前兩小時加班倍率
const OT_RATE_2 = 1.67;     // 第三小時起

interface ClockRecord {
  id: string;
  staff_id: string;
  branch_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  standard_hours: number;
  overtime_hours: number;
  overtime_pay: number;
  notes: string | null;
  staff_name?: string;
}

interface StaffProfile {
  id: string;
  name: string;
  branch_id: string;
  base_salary: number;
  level: string;
  employment_type: string;
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcOvertime(clockIn: string, clockOut: string, baseSalary: number): {
  workedHours: number; overtimeHours: number; overtimePay: number;
} {
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const workedMins = (outH * 60 + outM) - (inH * 60 + inM);
  const workedHours = workedMins / 60;
  const overtimeHours = Math.max(0, workedHours - TOTAL_REQUIRED);

  // 時薪估算：底薪 / 30天 / 8小時（僱傭制才有加班費）
  let overtimePay = 0;
  if (baseSalary > 0 && overtimeHours > 0) {
    const hourlyRate = baseSalary / 30 / 8;
    const ot1 = Math.min(overtimeHours, 2);
    const ot2 = Math.max(0, overtimeHours - 2);
    overtimePay = Math.round(hourlyRate * (ot1 * OT_RATE_1 + ot2 * OT_RATE_2));
  }
  return { workedHours, overtimeHours, overtimePay };
}

export default function AttendancePage() {
  const { user, activeBranchId } = useAdmin();
  const today = new Date();
  const todayYMD = toYMD(today);
  const currentMonth = todayYMD.slice(0, 7);

  const isStaff = user?.role === "員工";
  const canViewAll = user?.role === "管理者" || user?.role === "店長" || user?.role === "會計";

  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [myRecord, setMyRecord] = useState<ClockRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "checking" | "ok" | "far" | "denied">("idle");
  const [nearestBranch, setNearestBranch] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startDate = `${viewMonth}-01`;
    const endDate = `${viewMonth}-31`;

    if (canViewAll) {
      // 管理者：查詢該分店所有人的打卡
      const { data: staff } = await supabase
        .from("staff_profiles")
        .select("id,name,branch_id,base_salary,level,employment_type")
        .eq("branch_id", activeBranchId)
        .eq("is_active", true);
      setStaffList(staff ?? []);

      const staffIds = (staff ?? []).map(s => s.id);
      if (staffIds.length > 0) {
        const { data: recs } = await supabase
          .from("clock_records")
          .select("*")
          .in("staff_id", staffIds)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });
        // 加上員工名稱
        const enriched = (recs ?? []).map(r => ({
          ...r,
          staff_name: staff?.find(s => s.id === r.staff_id)?.name ?? "",
        }));
        setRecords(enriched);
      } else {
        setRecords([]);
      }
    } else {
      // 員工：只查自己今天的打卡
      const { data } = await supabase
        .from("clock_records")
        .select("*")
        .eq("staff_id", user?.id ?? "")
        .eq("date", todayYMD)
        .maybeSingle();
      setMyRecord(data ?? null);

      // 查詢本月所有紀錄（員工查自己）
      const { data: monthRecs } = await supabase
        .from("clock_records")
        .select("*")
        .eq("staff_id", user?.id ?? "")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      setRecords(monthRecs ?? []);
    }
    setLoading(false);
  }, [canViewAll, activeBranchId, viewMonth, user?.id, todayYMD]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // GPS 打卡
  const handleClockAction = async (action: "in" | "out") => {
    setClockLoading(true);
    setGpsStatus("checking");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // 找最近的分店
        let nearest = "";
        let minDist = Infinity;
        for (const [id, loc] of Object.entries(BRANCH_LOCATIONS)) {
          const d = getDistanceMeters(latitude, longitude, loc.lat, loc.lng);
          if (d < minDist) { minDist = d; nearest = id; }
        }
        setNearestBranch(nearest);

        if (minDist > CHECKIN_RADIUS_M) {
          setGpsStatus("far");
          setClockLoading(false);
          return;
        }
        setGpsStatus("ok");

        const now = new Date();
        const nowHHMM = toHHMM(now);
        const staffId = user?.id ?? "";

        // 取得員工底薪（用於加班費計算）
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("base_salary")
          .eq("id", staffId)
          .single();
        const baseSalary = profile?.base_salary ?? 0;

        if (action === "in") {
          // 建立或更新打卡紀錄（上班打卡）
          const { data: existing } = await supabase
            .from("clock_records")
            .select("id")
            .eq("staff_id", staffId)
            .eq("date", todayYMD)
            .maybeSingle();

          if (existing) {
            await supabase.from("clock_records").update({ clock_in: now.toISOString() }).eq("id", existing.id);
          } else {
            await supabase.from("clock_records").insert({
              staff_id: staffId,
              branch_id: nearest,
              date: todayYMD,
              clock_in: now.toISOString(),
              standard_hours: STANDARD_HOURS,
            });
          }
        } else {
          // 下班打卡
          const { data: existing } = await supabase
            .from("clock_records")
            .select("*")
            .eq("staff_id", staffId)
            .eq("date", todayYMD)
            .maybeSingle();

          if (existing?.clock_in) {
            const clockInHHMM = toHHMM(new Date(existing.clock_in));
            const { workedHours, overtimeHours, overtimePay } = calcOvertime(clockInHHMM, nowHHMM, baseSalary);
            await supabase.from("clock_records").update({
              clock_out: now.toISOString(),
              overtime_hours: overtimeHours,
              overtime_pay: overtimePay,
            }).eq("id", existing.id);
          }
        }

        await fetchData();
        setClockLoading(false);
      },
      (err) => {
        console.error(err);
        setGpsStatus("denied");
        setClockLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 月份統計
  const monthStats = () => {
    const target = isStaff ? records : records.filter(r => r.staff_id);
    const totalDays = target.filter(r => r.clock_in).length;
    const totalOT = target.reduce((s, r) => s + (r.overtime_hours ?? 0), 0);
    const totalOTPay = target.reduce((s, r) => s + (r.overtime_pay ?? 0), 0);
    return { totalDays, totalOT: Math.round(totalOT * 10) / 10, totalOTPay };
  };

  const stats = monthStats();

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">打卡薪資</h1>
        <p className="text-sm text-[#8a7a6e] mt-0.5">
          {isStaff ? "GPS 打卡 · 自動計算加班" : `${activeBranchId ? BRANCH_LOCATIONS[activeBranchId as keyof typeof BRANCH_LOCATIONS]?.name ?? "" : ""} 出勤紀錄`}
        </p>
      </div>

      {/* 員工：打卡區 */}
      {isStaff && (
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mb-5">
          <div className="text-sm font-medium text-[#1c1c1c] mb-1">今日出勤</div>
          <div className="text-xs text-[#8a7a6e] mb-4">{todayYMD.replace(/-/g, "/")}</div>

          {myRecord ? (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#8a7a6e]">上班時間</span>
                <span className="font-medium text-[#1c1c1c]">
                  {myRecord.clock_in ? toHHMM(new Date(myRecord.clock_in)) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8a7a6e]">下班時間</span>
                <span className="font-medium text-[#1c1c1c]">
                  {myRecord.clock_out ? toHHMM(new Date(myRecord.clock_out)) : "未打卡"}
                </span>
              </div>
              {myRecord.overtime_hours > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6e]">加班時數</span>
                  <span className="font-medium text-orange-600">{myRecord.overtime_hours.toFixed(1)} 小時</span>
                </div>
              )}
              {myRecord.overtime_pay > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a6e]">加班費</span>
                  <span className="font-medium text-orange-600">${myRecord.overtime_pay.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#8a7a6e] mb-4">今日尚未打卡</p>
          )}

          {/* GPS 狀態提示 */}
          {gpsStatus === "checking" && (
            <div className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-3">定位中，請稍候…</div>
          )}
          {gpsStatus === "far" && (
            <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">
              距離最近的分店（{nearestBranch ? BRANCH_LOCATIONS[nearestBranch as keyof typeof BRANCH_LOCATIONS]?.name : ""}）超過 {CHECKIN_RADIUS_M} 公尺，無法打卡。
            </div>
          )}
          {gpsStatus === "denied" && (
            <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">
              無法取得定位權限，請在瀏覽器設定中允許位置存取。
            </div>
          )}
          {gpsStatus === "ok" && (
            <div className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 mb-3">打卡成功！</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleClockAction("in")}
              disabled={clockLoading || !!myRecord?.clock_in}
              className="flex-1 py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40"
            >
              {clockLoading ? "定位中…" : "上班打卡"}
            </button>
            <button
              onClick={() => handleClockAction("out")}
              disabled={clockLoading || !myRecord?.clock_in || !!myRecord?.clock_out}
              className="flex-1 py-3 bg-[#1c1c1c] text-white rounded-xl text-sm font-medium disabled:opacity-40"
            >
              下班打卡
            </button>
          </div>
          <p className="text-[10px] text-[#8a7a6e] text-center mt-2">
            打卡需在分店 {CHECKIN_RADIUS_M} 公尺範圍內
          </p>
        </div>
      )}

      {/* 月份選擇 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => {
          const [y, m] = viewMonth.split("-").map(Number);
          const d = new Date(y, m - 2, 1);
          setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }} className="text-[#8b6748] text-lg px-2">‹</button>
        <span className="text-sm font-medium text-[#1c1c1c]">{viewMonth.replace("-", " 年 ")} 月</span>
        <button onClick={() => {
          const [y, m] = viewMonth.split("-").map(Number);
          const d = new Date(y, m, 1);
          setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }} className="text-[#8b6748] text-lg px-2">›</button>
      </div>

      {/* 月統計 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 text-center">
          <div className="text-2xl font-light text-[#1c1c1c]">{stats.totalDays}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">出勤天數</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 text-center">
          <div className="text-2xl font-light text-orange-600">{stats.totalOT}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">加班時數</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 text-center">
          <div className="text-xl font-light text-orange-600">${stats.totalOTPay.toLocaleString()}</div>
          <div className="text-xs text-[#8a7a6e] mt-1">加班費</div>
        </div>
      </div>

      {/* 打卡紀錄列表 */}
      {loading ? (
        <div className="text-center py-10 text-sm text-[#8a7a6e]">載入中…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#8a7a6e]">本月尚無打卡紀錄</div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const clockIn = r.clock_in ? toHHMM(new Date(r.clock_in)) : null;
            const clockOut = r.clock_out ? toHHMM(new Date(r.clock_out)) : null;
            const hasOT = r.overtime_hours > 0;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    {canViewAll && r.staff_name && (
                      <div className="text-xs font-medium text-[#8b6748] mb-0.5">{r.staff_name}</div>
                    )}
                    <div className="text-sm font-medium text-[#1c1c1c]">{r.date.replace(/-/g, "/")}</div>
                    <div className="text-xs text-[#8a7a6e] mt-0.5">
                      {clockIn ?? "—"} → {clockOut ?? "未下班"}
                    </div>
                  </div>
                  <div className="text-right">
                    {hasOT ? (
                      <>
                        <div className="text-xs text-orange-600 font-medium">+{r.overtime_hours.toFixed(1)}h 加班</div>
                        {r.overtime_pay > 0 && (
                          <div className="text-xs text-orange-500">${r.overtime_pay.toLocaleString()}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-green-600">正常</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 加班計算說明 */}
      <div className="mt-5 bg-[#faf7f2] rounded-xl p-4 text-xs text-[#8a7a6e]">
        <div className="font-medium text-[#1c1c1c] mb-1">加班計算規則</div>
        <div>標準工時 {STANDARD_HOURS}h + 用餐 {MEAL_HOURS}h = 共 {TOTAL_REQUIRED}h 在場</div>
        <div>第 1–2 小時加班：時薪 × {OT_RATE_1}</div>
        <div>第 3 小時起加班：時薪 × {OT_RATE_2}</div>
        <div className="mt-1 text-[10px]">時薪 = 月底薪 ÷ 30 天 ÷ 8 小時（僱傭制才有加班費）</div>
      </div>
    </div>
  );
}
