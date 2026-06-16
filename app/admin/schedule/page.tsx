"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_STAFF, ADMIN_BOOKINGS } from "@/lib/adminMockData";

const HOURS: string[] = [];
for (let h = 10; h <= 22; h++) {
  for (let m = 0; m < 60; m += 10) {
    if (h === 22 && m > 0) break;
    HOURS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function getDaysInRange(startDate: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDateLabel(d: Date) {
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

export default function SchedulePage() {
  const { user } = useAdmin();
  const today = new Date("2026-06-13");
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [openSlots, setOpenSlots] = useState<Record<string, boolean>>({});
  const [bufferMap, setBufferMap] = useState<Record<string, number>>({});

  if (!user) return null;

  const isStaff = user.role === "員工";
  const myStaff = ADMIN_STAFF.find(s => s.username === user.username);
  const staffList = isStaff ? (myStaff ? [myStaff] : []) : ADMIN_STAFF;
  const displayStaff = isStaff ? myStaff : ADMIN_STAFF.find(s => s.id === selectedStaffId) || ADMIN_STAFF[0];

  const days = getDaysInRange(today, 60);
  const dateStr = formatDate(selectedDate);

  const dayBookings = ADMIN_BOOKINGS.filter(
    b => b.date === dateStr && (!isStaff ? true : b.staffId === myStaff?.id)
  );

  const getSlotKey = (staffId: string, time: string) => `${staffId}|${dateStr}|${time}`;

  const toggleSlot = (staffId: string, time: string) => {
    const key = getSlotKey(staffId, time);
    setOpenSlots(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isBooked = (staffId: string, time: string) => {
    return dayBookings.some(b => b.staffId === staffId && b.time === time);
  };

  // Calendar navigation - weeks
  const startOfWeek = new Date(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">排班管理</h1>
        {!isStaff && (
          <p className="text-sm text-[#8a7a6e] mt-1">管理所有員工排班時段</p>
        )}
      </div>

      {/* Staff selector */}
      {!isStaff && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {ADMIN_STAFF.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStaffId(s.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm border transition-colors ${
                (selectedStaffId === s.id || (!selectedStaffId && s.id === ADMIN_STAFF[0].id))
                  ? "bg-[#8b6748] text-white border-[#8b6748]"
                  : "bg-white text-[#1c1c1c] border-[#e8ddd2]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Week calendar */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg border border-[#e8ddd2] text-[#8a7a6e] disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm text-[#1c1c1c] font-medium">
            {weekStart.getMonth() + 1}月 第{weekOffset + 1}週
          </span>
          <button
            onClick={() => setWeekOffset(o => Math.min(8, o + 1))}
            className="p-2 rounded-lg border border-[#e8ddd2] text-[#8a7a6e]"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(d => {
            const dStr = formatDate(d);
            const isPast = d < today;
            const isSelected = dStr === dateStr;
            const dayBookingCount = ADMIN_BOOKINGS.filter(b => b.date === dStr && (isStaff ? b.staffId === myStaff?.id : true)).length;
            return (
              <button
                key={dStr}
                onClick={() => !isPast && setSelectedDate(d)}
                disabled={isPast && formatDate(d) !== dateStr}
                className={`flex flex-col items-center py-2 rounded-xl text-xs transition-colors ${
                  isSelected ? "bg-[#8b6748] text-white" : isPast ? "opacity-40" : "hover:bg-[#faf7f2]"
                }`}
              >
                <span className="text-[10px] mb-1">{["日","一","二","三","四","五","六"][d.getDay()]}</span>
                <span className="font-medium">{d.getDate()}</span>
                {dayBookingCount > 0 && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? "text-white/70" : "text-[#8b6748]"}`}>
                    {dayBookingCount}件
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#1c1c1c]">
            {formatDateLabel(selectedDate)} · {displayStaff?.name || "請選擇員工"}
          </h2>
          <span className="text-xs text-[#8a7a6e]">點擊時段開關</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {HOURS.map(time => {
            const staff = displayStaff || ADMIN_STAFF[0];
            const key = getSlotKey(staff.id, time);
            const booked = isBooked(staff.id, time);
            const isOpen = openSlots[key] ?? true; // default open

            return (
              <button
                key={time}
                onClick={() => !booked && toggleSlot(staff.id, time)}
                disabled={booked}
                className={`py-2 px-1 rounded-lg text-xs text-center border transition-colors ${
                  booked
                    ? "bg-[#8b6748] text-white border-[#8b6748] cursor-default"
                    : isOpen
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {time}
                {booked && <div className="text-[9px] opacity-70">已預約</div>}
                {!booked && <div className="text-[9px]">{isOpen ? "開放" : "關閉"}</div>}
              </button>
            );
          })}
        </div>

        {/* Buffer setting */}
        {isStaff && myStaff && (
          <div className="mt-6 pt-4 border-t border-[#e8ddd2]">
            <h3 className="text-sm font-medium text-[#1c1c1c] mb-3">預設緩衝時間設定</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#8a7a6e]">每次預約後緩衝</span>
              <select
                value={bufferMap[myStaff.id] ?? 5}
                onChange={e => setBufferMap(prev => ({ ...prev, [myStaff.id]: Number(e.target.value) }))}
                className="px-3 py-1.5 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
              >
                {[0, 5, 10, 15, 20, 25, 30].map(v => (
                  <option key={v} value={v}>{v} 分鐘</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Today's bookings for selected date */}
      {dayBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mt-4">
          <h2 className="text-sm font-medium text-[#1c1c1c] mb-3">當日預約 ({dayBookings.length})</h2>
          <div className="space-y-2">
            {dayBookings
              .filter(b => !isStaff || true)
              .filter(b => displayStaff ? b.staffId === displayStaff.id : true)
              .map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#e8ddd2] last:border-0">
                  <div>
                    <div className="text-sm text-[#1c1c1c]">{b.time} · {b.customerName}</div>
                    <div className="text-xs text-[#8a7a6e]">{b.serviceName} ({b.duration}分) · 緩衝{b.bufferMinutes}分</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    b.status === "已確認" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    b.status === "待確認" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>{b.status}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
