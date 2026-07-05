"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { generateTimeSlots, teachers, Teacher } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import { supabase } from "@/lib/supabase";


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
  const { state, setSelectedDate, setSelectedTime, setSelectedTeacher } = useBooking();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(state.selectedDate);
  const [selectedTime, setSelectedTimeLocal] = useState<string | null>(state.selectedTime);
  const [blockedPeriods, setBlockedPeriods] = useState<{ start: string; end: string }[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[] | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

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

  // Fetch blocked periods from schedules when day or teacher changes
  useEffect(() => {
    if (!selectedDay || !state.selectedTeacher) {
      setBlockedPeriods([]);
      return;
    }

    const fetchBlocked = async () => {
      const ymd = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

      // Find staff_id by teacher name
      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("id")
        .eq("name", state.selectedTeacher!.name)
        .maybeSingle();

      if (!staffData?.id) {
        setBlockedPeriods([]);
        return;
      }

      // Get schedules for that staff on the selected date where blocks_booking = true
      const { data: schedules } = await supabase
        .from("schedules")
        .select("start_time, end_time")
        .eq("staff_id", staffData.id)
        .eq("date", ymd)
        .eq("blocks_booking", true);

      if (!schedules || schedules.length === 0) {
        setBlockedPeriods([]);
        return;
      }

      setBlockedPeriods(
        schedules.map((s: { start_time: string; end_time: string }) => ({
          start: s.start_time,
          end: s.end_time,
        }))
      );
    };

    fetchBlocked();
  }, [selectedDay, state.selectedTeacher]);

  const slots = selectedDay ? generateTimeSlots(selectedDay, duration, blockedPeriods) : [];

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

  const formatDate = (d: Date) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS_CN[d.getDay()]}）`;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <BookingHeader
        title="選擇日期與時間"
        onBack={() => router.push("/booking/service")}
      />

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Calendar */}
        <div className="bg-white border border-[#e8ddd2] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-[#1c1c1c]">
              {viewYear}年 {MONTHS_CN[viewMonth]}
            </p>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 12L10 8 6 4" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS_CN.map((d, i) => (
              <div key={d} className={`text-center text-xs py-1 ${i === 0 ? "text-red-400" : "text-[#8a7a6e]"}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const past = isPast(day);
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
                  disabled={past}
                  className={`relative h-9 w-full rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-[#8b6748] text-white"
                      : past
                      ? "text-[#e8ddd2] cursor-not-allowed"
                      : isToday
                      ? "text-[#8b6748] font-semibold"
                      : "text-[#1c1c1c] hover:bg-[#f0e8df]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDay && (
          <div className="bg-white border border-[#e8ddd2] rounded-xl p-4">
            <p className="text-xs text-[#8a7a6e] mb-3">{formatDate(selectedDay)}</p>

            {slots.length === 0 ? (
              <p className="text-sm text-[#8a7a6e] text-center py-4">此日期無可用時段</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={async () => {
                      if (!slot.available || !selectedDay) return;
                      setSelectedTimeLocal(slot.time);
                      setSelectedDate(selectedDay);
                      setSelectedTime(slot.time);

                      // If teacher already specified → go straight to confirm
                      if (state.selectedTeacher !== null) {
                        setTimeout(() => router.replace("/booking/confirm"), 150);
                        return;
                      }

                      // 不指定：查詢哪些技師在此時段有空
                      setLoadingTeachers(true);
                      setAvailableTeachers(null);
                      const ymd = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth()+1).padStart(2,"0")}-${String(selectedDay.getDate()).padStart(2,"0")}`;
                      const storeId = state.selectedStore?.id ?? "";
                      const legacyMap: Record<string,string> = { xiaoJudan:"ST01", daan:"ST02", banqiao:"ST03" };
                      const branchId = legacyMap[storeId] ?? storeId;

                      // Get all active staff for this branch
                      const { data: staffData } = await supabase
                        .from("staff_profiles")
                        .select("id,name")
                        .or(`branch_id.eq.${branchId},branch_id.is.null`)
                        .eq("is_active", true)
                        .neq("role","會計");

                      const staffIds = (staffData ?? []).map((s: {id:string;name:string}) => s.id);
                      if (staffIds.length === 0) { setLoadingTeachers(false); setTimeout(() => router.replace("/booking/confirm"), 150); return; }

                      // Find busy staff (bookings overlapping this slot)
                      const slotStart = slot.time;
                      const { data: busyBookings } = await supabase
                        .from("bookings")
                        .select("staff_id")
                        .eq("date", ymd)
                        .in("staff_id", staffIds)
                        .neq("status","cancelled");

                      const { data: busyScheds } = await supabase
                        .from("schedules")
                        .select("staff_id,start_time,end_time")
                        .eq("date", ymd)
                        .in("staff_id", staffIds)
                        .eq("blocks_booking", true);

                      const slotMins = parseInt(slotStart.split(":")[0]) * 60 + parseInt(slotStart.split(":")[1]);
                      const slotEnd = slotMins + duration;

                      const busyIds = new Set<string>();
                      (busyBookings ?? []).forEach((b: {staff_id:string}) => { if (b.staff_id) busyIds.add(b.staff_id); });
                      (busyScheds ?? []).forEach((s: {staff_id:string;start_time:string;end_time:string}) => {
                        const [sh,sm] = s.start_time.split(":").map(Number);
                        const [eh,em] = s.end_time.split(":").map(Number);
                        const sStart = sh*60+sm, sEnd = eh*60+em;
                        if (slotMins < sEnd && slotEnd > sStart) busyIds.add(s.staff_id);
                      });

                      // Match to Teacher objects (available + qualified for service)
                      const serviceId = state.selectedService?.id ?? state.selectedServices?.[0]?.id ?? "";
                      const staffNameMap = Object.fromEntries((staffData ?? []).map((s: {id:string;name:string}) => [s.id, s.name]));
                      const avail = teachers.filter(t =>
                        !t.staffOnly &&
                        t.storeIds.includes(storeId) &&
                        (!serviceId || t.allowedServiceIds.includes(serviceId)) &&
                        (() => {
                          // find staff_id by name
                          const entry = (staffData ?? []).find((s: {id:string;name:string}) => t.name.startsWith(s.name) || s.name.startsWith(t.name.replace("老師","")));
                          return entry ? !busyIds.has(entry.id) : true;
                        })()
                      );

                      setAvailableTeachers(avail);
                      setLoadingTeachers(false);
                    }}
                    disabled={!slot.available}
                    className={`py-2.5 rounded-lg text-sm transition-colors ${
                      selectedTime === slot.time
                        ? "bg-[#8b6748] text-white"
                        : !slot.available
                        ? "text-[#e8ddd2] cursor-not-allowed"
                        : "bg-white border border-[#e8ddd2] text-[#1c1c1c] hover:border-[#8b6748]"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 推薦技師 (when 不指定 + time selected) */}
        {availableTeachers !== null && (
          <div className="bg-white border border-[#e8ddd2] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#1c1c1c] mb-1">為您推薦可預約的技師</p>
            <p className="text-xs text-[#8a7a6e] mb-3">以下技師在此時段皆有空，請選擇：</p>
            {loadingTeachers && <p className="text-sm text-[#8a7a6e] text-center py-4">查詢中…</p>}
            {!loadingTeachers && availableTeachers.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[#8a7a6e] text-center py-2">此時段所有技師皆已排滿，請選擇其他時段。</p>
              </div>
            )}
            {!loadingTeachers && availableTeachers.length > 0 && (
              <div className="space-y-2">
                {availableTeachers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeacher(t);
                      router.replace("/booking/confirm");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 border border-[#e8ddd2] rounded-xl hover:border-[#8b6748] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f0e8df] flex items-center justify-center text-[#8b6748] text-sm font-bold flex-shrink-0">
                      {t.avatarText.slice(0,2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1c1c1c]">{t.name}</div>
                      <div className="text-xs text-[#8a7a6e] mt-0.5">{t.level === "技術長" ? "技術長" : "技術職人"}</div>
                    </div>
                    <span className="ml-auto text-[#8b6748] text-lg">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
