"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_STAFF, ADMIN_BOOKINGS, ADMIN_STORES, AdminStaff, AdminBooking } from "@/lib/adminMockData";

// Time axis: 07:00 – 24:00, 30-min increments
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 24 && m > 0) break;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// Slot grid constants
const ROW_HEIGHT = 48; // px per 30-min slot
const HEADER_HEIGHT = 64; // px for column header

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getWeekStart(base: Date, offset: number): Date {
  // Monday of the week containing base + offset*7 days
  const d = new Date(base);
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];

// Convert "HH:MM" to minutes from 07:00
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 7) * 60 + m;
}

// Compute top offset and height in px for a booking card
function bookingStyle(time: string, duration: number): { top: number; height: number } {
  const startMin = timeToMinutes(time);
  const top = HEADER_HEIGHT + (startMin / 30) * ROW_HEIGHT;
  const height = Math.max((duration / 30) * ROW_HEIGHT - 4, ROW_HEIGHT - 4);
  return { top, height };
}

// Service short codes
const SERVICE_CODES: Record<string, string> = {
  "SV01": "基礎",
  "SV02": "精緻",
  "SV03": "頂級",
  "SV04": "訓練",
  "SV05": "頻檢",
  "SV06": "+20",
};

export default function SchedulePage() {
  const { user } = useAdmin();
  const today = new Date("2026-06-18");

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ST01");
  const [weekOffset, setWeekOffset] = useState(0);
  const [openSlots, setOpenSlots] = useState<Record<string, boolean>>({});
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [openStaffPanel, setOpenStaffPanel] = useState<string | null>(null); // staffId with open panel
  const [bufferMap, setBufferMap] = useState<Record<string, number>>({});

  if (!user) return null;

  const isStaff = user.role === "員工";
  const myStaff = ADMIN_STAFF.find(s => s.username === user.username);

  const storeStaff: AdminStaff[] = isStaff
    ? (myStaff ? [myStaff] : [])
    : ADMIN_STAFF.filter(s => s.storeId === selectedStoreId);

  const weekStart = getWeekStart(today, weekOffset);
  const weekDays = getWeekDays(weekStart);

  const dateStr = formatDate(selectedDate);

  const todayDate = today.getDate();
  const show25Banner = todayDate >= 20 && todayDate <= 31;
  const isPast25 = todayDate >= 25;

  const getSlotKey = (staffId: string, time: string) => `${staffId}|${dateStr}|${time}`;

  const toggleSlot = (staffId: string, time: string) => {
    const key = getSlotKey(staffId, time);
    setOpenSlots(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const setAllSlots = (value: boolean) => {
    const updates: Record<string, boolean> = {};
    storeStaff.forEach(s => {
      TIME_SLOTS.forEach(time => {
        updates[getSlotKey(s.id, time)] = value;
      });
    });
    setOpenSlots(prev => ({ ...prev, ...updates }));
  };

  const handleCopySchedule = () => {
    setShowCopyModal(false);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const dayBookingsAll: AdminBooking[] = ADMIN_BOOKINGS.filter(b => b.date === dateStr);
  const dayBookingsForStore = isStaff
    ? dayBookingsAll.filter(b => b.staffId === myStaff?.id)
    : dayBookingsAll.filter(b => storeStaff.some(s => s.id === b.staffId));

  const staffBookingCount = (staffId: string) =>
    dayBookingsForStore.filter(b => b.staffId === staffId).length;

  const totalGridHeight = HEADER_HEIGHT + TIME_SLOTS.length * ROW_HEIGHT + 16;

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">排班管理</h1>
          {!isStaff && <p className="text-sm text-[#8a7a6e] mt-0.5">週視圖 · 員工為欄位</p>}
        </div>
        {!isStaff && (
          <div className="flex gap-2">
            <button
              onClick={() => setAllSlots(false)}
              className="px-3 py-1.5 rounded-xl text-sm border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              全關
            </button>
            <button
              onClick={() => setAllSlots(true)}
              className="px-3 py-1.5 rounded-xl text-sm border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            >
              全開
            </button>
            <button
              onClick={() => setShowCopyModal(true)}
              className="px-3 py-1.5 rounded-xl text-sm border border-[#e8ddd2] bg-white text-[#8b6748] hover:bg-[#faf7f2]"
            >
              複製班表
            </button>
          </div>
        )}
      </div>

      {/* 25th rule banner */}
      {show25Banner && !isStaff && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
          isPast25
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-yellow-50 border-yellow-300 text-yellow-800"
        }`}>
          {isPast25
            ? "今日已到25號，請確認後兩個月班表已開放"
            : "提醒：本月25日開放後兩個月班表，請提前設定好排班"}
        </div>
      )}

      {/* Copy success toast */}
      {copySuccess && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm border bg-green-50 border-green-300 text-green-800">
          已成功複製班表至下個月！
        </div>
      )}

      {/* Store tabs */}
      {!isStaff && (
        <div className="flex gap-2 mb-4">
          {ADMIN_STORES.map(store => (
            <button
              key={store.id}
              onClick={() => { setSelectedStoreId(store.id); setOpenStaffPanel(null); }}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                selectedStoreId === store.id
                  ? "bg-[#8b6748] text-white border-[#8b6748]"
                  : "bg-white text-[#1c1c1c] border-[#e8ddd2] hover:bg-[#faf7f2]"
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      )}

      {/* Week navigation + day selector */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 rounded-lg border border-[#e8ddd2] text-[#8a7a6e] text-sm disabled:opacity-30"
          >
            ‹ 上週
          </button>
          <span className="text-sm font-medium text-[#1c1c1c]">
            {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} – {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
          </span>
          <button
            onClick={() => setWeekOffset(o => Math.min(8, o + 1))}
            className="px-3 py-1.5 rounded-lg border border-[#e8ddd2] text-[#8a7a6e] text-sm"
          >
            下週 ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const dStr = formatDate(d);
            const isPast = d < today && dStr !== formatDate(today);
            const isSelected = dStr === dateStr;
            const cnt = ADMIN_BOOKINGS.filter(b => b.date === dStr && (isStaff ? b.staffId === myStaff?.id : storeStaff.some(s => s.id === b.staffId))).length;
            return (
              <button
                key={dStr}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs transition-colors ${
                  isSelected
                    ? "bg-[#8b6748] text-white"
                    : isPast
                    ? "opacity-40 hover:bg-[#faf7f2]"
                    : "hover:bg-[#faf7f2]"
                }`}
              >
                <span className="text-[10px] mb-0.5">{DAY_NAMES[i]}</span>
                <span className="font-medium">{d.getDate()}</span>
                {cnt > 0 && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? "text-white/70" : "text-[#8b6748]"}`}>
                    {cnt}件
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff panel toggle (排班管理) for selected staff */}
      {openStaffPanel && (
        <div className="bg-white rounded-2xl border border-[#8b6748]/30 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#1c1c1c]">
              {storeStaff.find(s => s.id === openStaffPanel)?.name} · 排班設定
            </h3>
            <button
              onClick={() => setOpenStaffPanel(null)}
              className="text-xs text-[#8a7a6e] hover:text-[#1c1c1c]"
            >
              關閉 ✕
            </button>
          </div>
          <p className="text-xs text-[#8a7a6e] mb-3">{dateStr} · 點擊時段切換開關</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {TIME_SLOTS.map(time => {
              const key = getSlotKey(openStaffPanel, time);
              const booked = dayBookingsForStore.some(b => b.staffId === openStaffPanel && b.time === time);
              const isOpen = openSlots[key] ?? true;
              return (
                <button
                  key={time}
                  onClick={() => !booked && toggleSlot(openStaffPanel, time)}
                  disabled={booked}
                  className={`py-1.5 px-1 rounded-lg text-[11px] text-center border transition-colors ${
                    booked
                      ? "bg-[#8b6748] text-white border-[#8b6748] cursor-default"
                      : isOpen
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {time}
                  <div className="text-[9px] mt-0.5">
                    {booked ? "已預約" : isOpen ? "開放" : "關閉"}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Buffer setting for staff role */}
          {isStaff && myStaff && (
            <div className="mt-4 pt-3 border-t border-[#e8ddd2] flex items-center gap-3">
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
          )}
        </div>
      )}

      {/* Calendar grid: time axis + staff columns */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="flex"
            style={{ minWidth: `${64 + storeStaff.length * 140}px` }}
          >
            {/* Time axis column */}
            <div className="flex-shrink-0 w-16 border-r border-[#e8ddd2]">
              {/* Header spacer */}
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-[#e8ddd2]" />
              {TIME_SLOTS.map(time => (
                <div
                  key={time}
                  style={{ height: ROW_HEIGHT }}
                  className="flex items-start px-2 pt-1 border-b border-[#f0ebe4]"
                >
                  <span className="text-[11px] text-[#8a7a6e] leading-none">{time}</span>
                </div>
              ))}
            </div>

            {/* Staff columns */}
            {storeStaff.map(staff => {
              const bookingCnt = staffBookingCount(staff.id);
              const staffBookings = dayBookingsForStore.filter(b => b.staffId === staff.id);

              return (
                <div
                  key={staff.id}
                  className="flex-shrink-0 border-r border-[#e8ddd2] last:border-r-0"
                  style={{ width: 140 }}
                >
                  {/* Staff column header */}
                  <button
                    onClick={() => setOpenStaffPanel(openStaffPanel === staff.id ? null : staff.id)}
                    style={{ height: HEADER_HEIGHT }}
                    className={`w-full flex flex-col items-center justify-center border-b border-[#e8ddd2] px-2 transition-colors hover:bg-[#faf7f2] ${
                      openStaffPanel === staff.id ? "bg-[#faf7f2]" : "bg-white"
                    }`}
                  >
                    <span className="text-sm font-medium text-[#1c1c1c] leading-tight">{staff.name}</span>
                    <span className="text-[10px] text-[#8a7a6e] leading-tight">{staff.displayLevel}</span>
                    <span className="text-[10px] text-[#8b6748] mt-0.5">
                      {bookingCnt} 件 ▾
                    </span>
                  </button>

                  {/* Column body: time slot grid + booking cards */}
                  <div className="relative" style={{ height: TIME_SLOTS.length * ROW_HEIGHT }}>
                    {/* Background time slot rows */}
                    {TIME_SLOTS.map(time => {
                      const key = getSlotKey(staff.id, time);
                      const isOpen = openSlots[key] ?? true;
                      return (
                        <div
                          key={time}
                          style={{ height: ROW_HEIGHT }}
                          className={`border-b border-[#f0ebe4] ${!isOpen ? "" : ""}`}
                        >
                          {!isOpen && (
                            <div
                              className="w-full h-full"
                              style={{
                                background: "repeating-linear-gradient(135deg, #e8e8f0 0px, #e8e8f0 2px, #f4f4f8 2px, #f4f4f8 8px)",
                                opacity: 0.6,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Booking cards positioned absolutely */}
                    {staffBookings.map(b => {
                      const style = bookingStyle(b.time, b.duration);
                      const serviceCode = SERVICE_CODES[b.serviceId] || b.serviceId;
                      const endMin = timeToMinutes(b.time) + b.duration;
                      const endH = Math.floor(endMin / 60) + 10;
                      const endM = endMin % 60;
                      const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                      return (
                        <div
                          key={b.id}
                          style={{
                            position: "absolute",
                            top: style.top - HEADER_HEIGHT,
                            height: style.height,
                            left: 4,
                            right: 4,
                          }}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 overflow-hidden shadow-sm"
                        >
                          <div className="text-[10px] text-rose-400 leading-none mb-0.5">
                            {b.time}–{endStr}
                          </div>
                          <div className="text-[11px] font-medium text-rose-800 leading-tight truncate">
                            {b.customerName}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-700 leading-none">
                              【{serviceCode}】
                            </span>
                            {b.status === "已確認" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 leading-none">確認</span>
                            )}
                            {b.status === "待確認" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 leading-none">待確認</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff role: buffer setting */}
      {isStaff && myStaff && !openStaffPanel && (
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mt-4">
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

      {/* Copy schedule modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-[#1c1c1c] mb-2">複製班表</h3>
            <p className="text-sm text-[#8a7a6e] mb-6">
              確定要將本月班表複製到下個月嗎？現有下月設定將被覆蓋。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-[#e8ddd2] text-[#8a7a6e] hover:bg-[#faf7f2]"
              >
                取消
              </button>
              <button
                onClick={handleCopySchedule}
                className="flex-1 py-2.5 rounded-xl text-sm bg-[#8b6748] text-white hover:bg-[#7a5a3e]"
              >
                確認複製
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
