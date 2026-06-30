"use client";

import { useState, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_STAFF, ADMIN_STORES } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

interface PunchRecord {
  id: string;
  staffId: string;
  storeId: string;
  date: string;      // YYYY-MM-DD
  clockIn: string;   // HH:mm
  clockOut: string;  // HH:mm or ""
  hours: number;     // calculated
  isOvertime: boolean;
  overtimeHours: number;
  note: string;
}

interface CommissionRecord {
  id: string;
  staffId: string;
  date: string;
  sessions: number;
  amount: number;
}

const OVERTIME_RATE = 1.33; // 加班費倍率
const REGULAR_HOURS = 8;    // 正常工時

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHours(mins: number): number {
  return Math.round((mins / 60) * 10) / 10;
}

const CURRENT_MONTH = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
})();

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
})();

// Mock existing punch records
const INIT_PUNCHES: PunchRecord[] = [
  { id: "p1", staffId: "T01", storeId: "ST01", date: TODAY, clockIn: "09:00", clockOut: "18:30", hours: 9.5, isOvertime: true, overtimeHours: 1.5, note: "" },
  { id: "p2", staffId: "T02", storeId: "ST01", date: TODAY, clockIn: "10:00", clockOut: "19:00", hours: 9, isOvertime: true, overtimeHours: 1, note: "" },
  { id: "p3", staffId: "T03", storeId: "ST02", date: TODAY, clockIn: "09:30", clockOut: "18:00", hours: 8.5, isOvertime: true, overtimeHours: 0.5, note: "" },
];

const INIT_COMMISSIONS: CommissionRecord[] = [
  { id: "c1", staffId: "T01", date: TODAY, sessions: 4, amount: 2000 },
  { id: "c2", staffId: "T02", date: TODAY, sessions: 3, amount: 1500 },
  { id: "c3", staffId: "T03", date: TODAY, sessions: 5, amount: 2500 },
];

type Tab = "打卡" | "月結薪資";

export default function AttendancePage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("打卡");
  const [punches, setPunches] = useState<PunchRecord[]>(INIT_PUNCHES);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(INIT_COMMISSIONS);
  const [selectedStore, setSelectedStore] = useState("ST01");
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [punchDate, setPunchDate] = useState(TODAY);

  // Add punch modal
  const [addModal, setAddModal] = useState(false);
  const [newPunch, setNewPunch] = useState({ staffId: "", clockIn: "09:00", clockOut: "", note: "" });

  // Commission modal
  const [commModal, setCommModal] = useState(false);
  const [newComm, setNewComm] = useState({ staffId: "", sessions: 1, amount: 500 });

  if (!user) return null;
  if (user.role !== "管理者" && user.role !== "店長") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const isAdmin = user.role === "管理者";

  // Staff filtered by store
  const storeStaff = ADMIN_STAFF.filter(s => s.storeId === selectedStore);

  // Punches for selected date+store
  const todayPunches = punches.filter(p => p.storeId === selectedStore && p.date === punchDate);

  // Monthly payroll calculation
  const monthlyPayroll = useMemo(() => {
    const monthPunches = punches.filter(p =>
      p.storeId === selectedStore && p.date.startsWith(selectedMonth)
    );
    const monthComms = commissions.filter(c =>
      ADMIN_STAFF.find(s => s.id === c.staffId && s.storeId === selectedStore) &&
      c.date.startsWith(selectedMonth)
    );

    return storeStaff.map(staff => {
      const sp = monthPunches.filter(p => p.staffId === staff.id);
      const sc = monthComms.filter(c => c.staffId === staff.id);

      const totalHours = sp.reduce((s, p) => s + p.hours, 0);
      const overtimeHours = sp.reduce((s, p) => s + p.overtimeHours, 0);
      const regularHours = totalHours - overtimeHours;
      const sessions = sc.reduce((s, c) => s + c.sessions, 0);
      const commissionTotal = sc.reduce((s, c) => s + c.amount, 0);

      let basePay = 0;
      let overtimePay = 0;

      if (staff.employmentType === "僱傭制") {
        basePay = staff.baseSalary + staff.positionAllowance;
        // 計算時薪（月薪/240小時）
        const hourlyRate = staff.baseSalary / 240;
        overtimePay = Math.round(overtimeHours * hourlyRate * OVERTIME_RATE);
      } else {
        // 承攬制：按場次抽成
        basePay = commissionTotal;
      }

      const totalPay = staff.employmentType === "僱傭制"
        ? basePay + overtimePay + commissionTotal
        : commissionTotal;

      return {
        staff,
        totalHours,
        regularHours,
        overtimeHours,
        sessions,
        commissionTotal,
        basePay,
        overtimePay,
        totalPay,
        workDays: [...new Set(sp.map(p => p.date))].length,
      };
    });
  }, [punches, commissions, selectedStore, selectedMonth, storeStaff]);

  const totalPayroll = monthlyPayroll.reduce((s, r) => s + r.totalPay, 0);

  const addPunch = () => {
    if (!newPunch.staffId || !newPunch.clockIn) return;
    const inMins = timeToMinutes(newPunch.clockIn);
    const outMins = newPunch.clockOut ? timeToMinutes(newPunch.clockOut) : inMins;
    const diffMins = Math.max(0, outMins - inMins);
    const hours = minutesToHours(diffMins);
    const overtimeHours = Math.max(0, hours - REGULAR_HOURS);
    setPunches(prev => [...prev, {
      id: `p${Date.now()}`,
      staffId: newPunch.staffId,
      storeId: selectedStore,
      date: punchDate,
      clockIn: newPunch.clockIn,
      clockOut: newPunch.clockOut,
      hours,
      isOvertime: overtimeHours > 0,
      overtimeHours,
      note: newPunch.note,
    }]);
    setAddModal(false);
    setNewPunch({ staffId: "", clockIn: "09:00", clockOut: "", note: "" });
  };

  const addCommission = () => {
    if (!newComm.staffId) return;
    setCommissions(prev => [...prev, {
      id: `c${Date.now()}`,
      staffId: newComm.staffId,
      date: punchDate,
      sessions: newComm.sessions,
      amount: newComm.amount,
    }]);
    setCommModal(false);
    setNewComm({ staffId: "", sessions: 1, amount: 500 });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">打卡與薪資</h1>
          <p className="text-sm text-[#8a7a6e] mt-0.5">記錄出勤、計算薪資與抽成</p>
        </div>
      </div>

      {/* Store selector */}
      <div className="flex gap-2 mb-5">
        {ADMIN_STORES.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStore(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              selectedStore === s.id
                ? "bg-[#8b6748] text-white border-[#8b6748]"
                : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f0e8] rounded-xl p-1 mb-5">
        {(["打卡", "月結薪資"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white text-[#8b6748] shadow-sm" : "text-[#8a7a6e]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* === 打卡 Tab === */}
      {tab === "打卡" && (
        <div>
          {/* Date selector */}
          <div className="flex items-center justify-between mb-4">
            <input
              type="date"
              value={punchDate}
              onChange={e => setPunchDate(e.target.value)}
              className="px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCommModal(true)}
                className="px-3 py-2 border border-[#e8ddd2] bg-white text-[#8b6748] rounded-xl text-sm font-medium"
              >
                + 抽成
              </button>
              <button
                onClick={() => setAddModal(true)}
                className="px-3 py-2 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
              >
                + 打卡
              </button>
            </div>
          </div>

          {/* Punch list */}
          <div className="space-y-3">
            {storeStaff.map(staff => {
              const punch = todayPunches.find(p => p.staffId === staff.id);
              const dayComm = commissions.find(c => c.staffId === staff.id && c.date === punchDate);
              return (
                <div key={staff.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold text-[#1c1c1c]">{staff.name}</span>
                      <span className="ml-2 text-xs text-[#8a7a6e]">{staff.internalLevel}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      staff.employmentType === "僱傭制"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{staff.employmentType}</span>
                  </div>

                  {punch ? (
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                        <span>▶</span>
                        <span>上班 {punch.clockIn}</span>
                      </div>
                      {punch.clockOut ? (
                        <div className="flex items-center gap-1.5 text-[#8b6748] bg-[#faf7f2] px-3 py-1 rounded-lg">
                          <span>■</span>
                          <span>下班 {punch.clockOut}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#8a7a6e] flex items-center">尚未下班</div>
                      )}
                      <div className="text-xs text-[#8a7a6e] flex items-center">
                        {punch.hours}h
                        {punch.isOvertime && (
                          <span className="ml-1 text-orange-600 font-medium">（加班 {punch.overtimeHours}h）</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">今日尚未打卡</p>
                  )}

                  {dayComm && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#8a7a6e]">
                      <span className="px-2 py-0.5 bg-[#faf7f2] border border-[#e8ddd2] rounded-full">
                        抽成 {dayComm.sessions} 場 · ${dayComm.amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {storeStaff.length === 0 && (
              <p className="text-center text-sm text-[#8a7a6e] py-8">此門市尚無員工</p>
            )}
          </div>
        </div>
      )}

      {/* === 月結薪資 Tab === */}
      {tab === "月結薪資" && (
        <div>
          {/* Month selector */}
          <div className="flex items-center justify-between mb-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
            />
            <div className="text-right">
              <p className="text-xs text-[#8a7a6e]">本月薪資總計</p>
              <p className="text-lg font-bold text-[#8b6748]">${totalPayroll.toLocaleString()}</p>
            </div>
          </div>

          {/* Payroll cards */}
          <div className="space-y-3">
            {monthlyPayroll.map(({ staff, totalHours, overtimeHours, sessions, commissionTotal, basePay, overtimePay, totalPay, workDays }) => (
              <div key={staff.id} className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8ddd2] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#1c1c1c]">{staff.name}</span>
                    <span className="ml-2 text-xs text-[#8a7a6e]">{staff.internalLevel} · {staff.employmentType}</span>
                  </div>
                  <span className="text-lg font-bold text-[#8b6748]">${totalPay.toLocaleString()}</span>
                </div>
                <div className="px-5 py-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">出勤天數</span>
                    <span className="font-medium">{workDays} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">總工時</span>
                    <span className="font-medium">{totalHours} 小時</span>
                  </div>
                  {overtimeHours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#8a7a6e]">加班時數</span>
                      <span className="font-medium text-orange-600">{overtimeHours} 小時</span>
                    </div>
                  )}
                  {sessions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#8a7a6e]">服務場次</span>
                      <span className="font-medium">{sessions} 場</span>
                    </div>
                  )}
                  {staff.employmentType === "僱傭制" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#8a7a6e]">底薪+加給</span>
                        <span className="font-medium">${basePay.toLocaleString()}</span>
                      </div>
                      {overtimePay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#8a7a6e]">加班費</span>
                          <span className="font-medium text-orange-600">${overtimePay.toLocaleString()}</span>
                        </div>
                      )}
                      {commissionTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#8a7a6e]">抽成</span>
                          <span className="font-medium text-green-700">${commissionTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  {staff.employmentType === "承攬制" && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#8a7a6e]">抽成總計</span>
                      <span className="font-medium text-green-700">${commissionTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Accountant export note */}
          {isAdmin && totalPayroll > 0 && (
            <div className="mt-4 bg-[#faf7f2] border border-[#e8ddd2] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#8b6748] mb-1">會計匯款摘要</p>
              <div className="space-y-1">
                {monthlyPayroll.filter(r => r.totalPay > 0).map(r => (
                  <div key={r.staff.id} className="flex justify-between text-xs text-[#1c1c1c]">
                    <span>{r.staff.name}</span>
                    <span className="font-semibold">${r.totalPay.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-[#e8ddd2] pt-1 flex justify-between text-sm font-bold text-[#8b6748]">
                  <span>合計匯款</span>
                  <span>${totalPayroll.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Punch Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-[#1c1c1c] mb-4">新增打卡記錄</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">員工</label>
                <select
                  value={newPunch.staffId}
                  onChange={e => setNewPunch(p => ({ ...p, staffId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  <option value="">選擇員工</option>
                  {storeStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">上班時間</label>
                  <input
                    type="time"
                    value={newPunch.clockIn}
                    onChange={e => setNewPunch(p => ({ ...p, clockIn: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">下班時間</label>
                  <input
                    type="time"
                    value={newPunch.clockOut}
                    onChange={e => setNewPunch(p => ({ ...p, clockOut: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">備註</label>
                <input
                  value={newPunch.note}
                  onChange={e => setNewPunch(p => ({ ...p, note: e.target.value }))}
                  placeholder="例：遲到原因…"
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={addPunch} disabled={!newPunch.staffId} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">確認</button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {commModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-[#1c1c1c] mb-4">新增抽成記錄</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">員工</label>
                <select
                  value={newComm.staffId}
                  onChange={e => setNewComm(p => ({ ...p, staffId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  <option value="">選擇員工</option>
                  {storeStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">服務場次</label>
                  <input
                    type="number"
                    min="1"
                    value={newComm.sessions}
                    onChange={e => setNewComm(p => ({ ...p, sessions: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">抽成金額</label>
                  <input
                    type="number"
                    min="0"
                    value={newComm.amount}
                    onChange={e => setNewComm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCommModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={addCommission} disabled={!newComm.staffId} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
