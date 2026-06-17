"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { generateTimeSlots } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS_CN = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function DateTimePage() {
  const router = useRouter();
  const { state, setSelectedDate, setSelectedTime } = useBooking();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(state.selectedDate);
  const [selectedTime, setSelectedTimeLocal] = useState<string | null>(state.selectedTime);

  const duration = state.selectedServices && state.selectedServices.length > 0
    ? state.selectedServices.reduce((sum, s) => sum + s.duration, 0) + (state.hasAddon ? 20 : 0)
    : state.selectedService
    ? state.selectedService.duration + (state.hasAddon ? 20 : 0)
    : 60;

  const calDays = generateCalendarDays(viewYear, viewMonth);

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const slots = selectedDay ? generateTimeSlots(selectedDay, duration) : [];

  const handleDaySelect = (day: number) => {
    if (isPast(day)) return;
    const d = new Date(viewYear, viewMonth, day);
    setSelectedDay(d);
    setSelectedTimeLocal(null);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleContinue = () => {
    if (!selectedDay || !selectedTime) return;
    setSelectedDate(selectedDay);
    setSelectedTime(selectedTime);
    router.push("/booking/notes");
  };

  const formatDate = (d: Date) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS_CN[d.getDay()]}）`;

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="選擇日期與時間"
        subtitle={`調理時長：${duration} 分鐘`}
        onBack={() => router.back()}
        step={7}
      />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Calendar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 mb-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
            <h3 className="text-base font-semibold text-[#1a1a1a]">
              {viewYear}年 {MONTHS_CN[viewMonth]}
            </h3>
            <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 12L10 8 6 4" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_CN.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-gray-400"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1">
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const past = isPast(day);
              const disabled = past;
              const isSelected =
                selectedDay &&
                selectedDay.getDate() === day &&
                selectedDay.getMonth() === viewMonth &&
                selectedDay.getFullYear() === viewYear;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === viewMonth &&
                today.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  onClick={() => handleDaySelect(day)}
                  disabled={disabled}
                  className={`relative h-10 w-full rounded-xl text-sm font-medium transition-all duration-150 ${
                    isSelected
                      ? "bg-[#b8956a] text-white shadow-md"
                      : disabled
                      ? "text-gray-200 cursor-not-allowed"
                      : "hover:bg-[#f5f0e8] text-[#1a1a1a] active:scale-95"
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b8956a]" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Time slots */}
        {selectedDay && (
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
              {formatDate(selectedDay)} 可用時段
            </h3>

            {slots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">此日期無可用時段</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTimeLocal(slot.time)}
                    disabled={!slot.available}
                    className={`py-2.5 px-1 rounded-xl text-sm font-medium transition-all duration-150 ${
                      selectedTime === slot.time
                        ? "bg-[#b8956a] text-white shadow-md"
                        : !slot.available
                        ? "bg-gray-50 text-gray-200 cursor-not-allowed"
                        : "bg-[#fafaf8] text-[#1a1a1a] hover:bg-[#f5f0e8] active:scale-95"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#fafaf8] border border-gray-200" />
                <span className="text-xs text-gray-400">可預約</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#b8956a]" />
                <span className="text-xs text-gray-400">已選擇</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                <span className="text-xs text-gray-300">已約滿</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-4 bg-[#fafaf8] border-t border-gray-100" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {selectedDay && selectedTime && (
          <div className="mb-3 p-3 bg-[#f5f0e8] rounded-xl">
            <p className="text-sm text-[#1a1a1a] font-medium">
              {formatDate(selectedDay)} {selectedTime}
            </p>
            <p className="text-xs text-gray-500">調理時長 {duration} 分鐘</p>
          </div>
        )}
        <Button
          fullWidth
          size="lg"
          onClick={handleContinue}
          disabled={!selectedDay || !selectedTime}
        >
          {selectedTime ? "確認時間" : "請選擇時間"}
        </Button>
      </div>
    </div>
  );
}
