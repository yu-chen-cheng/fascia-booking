"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const EVENT_TYPES = ["早班", "晚班", "全班", "病假", "事假", "進修", "自訂"] as const;
type EventType = typeof EVENT_TYPES[number];

const EVENT_COLORS: Record<EventType, string> = {
  早班: "bg-blue-100 text-blue-800 border-blue-200",
  晚班: "bg-purple-100 text-purple-800 border-purple-200",
  全班: "bg-indigo-100 text-indigo-800 border-indigo-200",
  病假: "bg-red-100 text-red-700 border-red-200",
  事假: "bg-orange-100 text-orange-700 border-orange-200",
  進修: "bg-green-100 text-green-700 border-green-200",
  自訂: "bg-amber-100 text-amber-800 border-amber-200",
};

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

interface ScheduleEvent {
  id: string;
  staff_id: string;
  branch_id: string;
  date: string;
  event_type: EventType;
  start_time: string | null;
  end_time: string | null;
  custom_label: string | null;
  blocks_booking: boolean;
}

interface StaffProfile {
  id: string;
  name: string;
  branch_id: string;
  role: string;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SchedulePage() {
  const { user } = useAdmin();
  const today = new Date();
  const todayYMD = toYMD(today);

  const isStaff = user?.role === "員工";
  const isAdmin = user?.role === "管理者" || user?.role === "店長";

  // 排班可編輯的月份範圍：每月20號起員工可填寫下兩個月，25號起客人才看得到新班表
  const canEditNextMonths = today.getDate() >= 20;
  const editableMonths: string[] = [];
  // 本月永遠可以看（但不一定可以編輯）
  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let i = 1; i <= 2; i++) {
    const m = new Date(baseMonth);
    m.setMonth(m.getMonth() + i);
    editableMonths.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId ?? "ST01");

  // Modal state
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<{
    event_type: EventType;
    start_time: string;
    end_time: string;
    custom_label: string;
    blocks_booking: boolean;
  }>({ event_type: "早班", start_time: "10:00", end_time: "19:00", custom_label: "", blocks_booking: true });
  const [saving, setSaving] = useState(false);

  const BRANCHES = [
    { id: "ST01", name: "小巨蛋店" },
    { id: "ST02", name: "大安店" },
    { id: "ST03", name: "板橋店" },
  ];

  const fetchStaff = useCallback(async () => {
    const q = supabase.from("staff_profiles").select("id,name,branch_id,role").eq("is_active", true);
    if (!isAdmin) {
      // 員工只看自己
      q.eq("id", user?.id ?? "");
    } else {
      q.eq("branch_id", selectedBranch);
    }
    const { data } = await q.order("name");
    setStaffList(data ?? []);
    if (data && data.length > 0 && !selectedStaffId) {
      setSelectedStaffId(isStaff ? (user?.id ?? data[0].id) : data[0].id);
    }
  }, [isAdmin, isStaff, selectedBranch, user?.id, selectedStaffId]);

  const fetchEvents = useCallback(async () => {
    if (!selectedStaffId && isStaff) return;
    const yearStr = String(viewYear);
    const monthStr = String(viewMonth + 1).padStart(2, "0");
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = `${yearStr}-${monthStr}-31`;

    let q = supabase.from("schedules").select("*")
      .gte("date", startDate).lte("date", endDate);

    if (isStaff) {
      q = q.eq("staff_id", user?.id ?? "");
    } else if (selectedStaffId) {
      q = q.eq("staff_id", selectedStaffId);
    } else {
      // 全部分店人員
      const ids = staffList.map(s => s.id);
      if (ids.length > 0) q = q.in("staff_id", ids);
    }

    const { data } = await q;
    setEvents(data ?? []);
    setLoading(false);
  }, [selectedStaffId, isStaff, viewYear, viewMonth, user?.id, staffList]);

  useEffect(() => { fetchStaff(); }, [selectedBranch]);
  useEffect(() => { if (staffList.length > 0 || !isAdmin) fetchEvents(); }, [viewYear, viewMonth, selectedStaffId, staffList]);

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = days[0].getDay(); // 0=Sun

  const viewMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const isEditable = canEditNextMonths
    ? editableMonths.includes(viewMonthKey) || viewMonthKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
    : viewMonthKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const eventsOnDate = (date: string) =>
    events.filter(e => e.date === date && (isStaff ? e.staff_id === user?.id : selectedStaffId ? e.staff_id === selectedStaffId : true));

  const openAdd = (date: string) => {
    if (!isEditable) return;
    // 管理者模式下必須先選人員
    if (isAdmin && !isStaff && !selectedStaffId) {
      alert("請先選擇員工後再新增事件");
      return;
    }
    setModalDate(date);
    setModalEvent(null);
    setForm({ event_type: "早班", start_time: "10:00", end_time: "19:00", custom_label: "", blocks_booking: true });
  };

  const openEdit = (e: ScheduleEvent) => {
    if (!isEditable) return;
    setModalDate(e.date);
    setModalEvent(e);
    setForm({
      event_type: e.event_type,
      start_time: e.start_time ?? "10:00",
      end_time: e.end_time ?? "19:00",
      custom_label: e.custom_label ?? "",
      blocks_booking: e.blocks_booking,
    });
  };

  const handleSave = async () => {
    if (!modalDate) return;
    setSaving(true);
    const staffId = isStaff ? user?.id : selectedStaffId;
    if (!staffId) { setSaving(false); return; }

    const payload = {
      staff_id: staffId,
      branch_id: isStaff ? user?.branchId : selectedBranch,
      date: modalDate,
      event_type: form.event_type,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      custom_label: form.event_type === "自訂" ? form.custom_label : null,
      blocks_booking: form.blocks_booking,
    };

    if (modalEvent) {
      await supabase.from("schedules").update(payload).eq("id", modalEvent.id);
    } else {
      await supabase.from("schedules").insert(payload);
    }
    await fetchEvents();
    setModalDate(null);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!modalEvent) return;
    setSaving(true);
    await supabase.from("schedules").delete().eq("id", modalEvent.id);
    await fetchEvents();
    setModalDate(null);
    setSaving(false);
  };

  if (!user) return null;

  const currentStaffName = isStaff ? user.name : staffList.find(s => s.id === selectedStaffId)?.name ?? "";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">排班管理</h1>
        <p className="text-sm text-[#8a7a6e] mt-0.5">
          {isStaff ? "管理自己的出勤事件" : "查看與管理員工排班"}
        </p>
      </div>

      {/* 25th rule notice */}
      {!canEditNextMonths && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          每月 <strong>20 號</strong>起開放填寫未來兩個月班表。目前只能修改本月。
        </div>
      )}
      {canEditNextMonths && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
          可填寫 <strong>{editableMonths.map(m => m.replace("-", "年") + "月").join("、")}</strong> 的班表。（25號後客人才看得到新班表）
        </div>
      )}

      {/* Branch + Staff selector (admin/manager only) */}
      {isAdmin && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {BRANCHES.map(b => (
            <button key={b.id} onClick={() => { setSelectedBranch(b.id); setSelectedStaffId(""); }}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                selectedBranch === b.id ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
              }`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {isAdmin && staffList.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setSelectedStaffId("")}
            className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
              !selectedStaffId ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
            }`}>
            全部
          </button>
          {staffList.map(s => (
            <button key={s.id} onClick={() => setSelectedStaffId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                selectedStaffId === s.id ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
              }`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-2xl border border-[#e8ddd2] px-5 py-3">
        <button onClick={prevMonth} className="text-[#8b6748] text-lg px-2">‹</button>
        <div className="text-center">
          <div className="text-base font-semibold text-[#1c1c1c]">
            {viewYear} 年 {viewMonth + 1} 月
          </div>
          {currentStaffName && (
            <div className="text-xs text-[#8a7a6e] mt-0.5">{currentStaffName}</div>
          )}
        </div>
        <button onClick={nextMonth} className="text-[#8b6748] text-lg px-2">›</button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-[#f0e8df]">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-xs py-2 font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-[#8a7a6e]"
            }`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-[#f0e8df] bg-[#faf7f2]/50" />
          ))}

          {days.map((day, idx) => {
            const ymd = toYMD(day);
            const isToday = ymd === todayYMD;
            const isPast = ymd < todayYMD;
            const dayEvents = eventsOnDate(ymd);
            const colIdx = (firstDayOfWeek + idx) % 7;
            const isLastCol = colIdx === 6;
            const isLastRow = idx >= days.length - 7;
            const canClick = !isPast && isEditable;

            return (
              <div
                key={ymd}
                onClick={() => canClick && openAdd(ymd)}
                className={`min-h-[80px] p-1.5 border-b border-r border-[#f0e8df] transition-colors
                  ${isLastCol ? "border-r-0" : ""}
                  ${isLastRow ? "border-b-0" : ""}
                  ${isPast ? "bg-[#faf7f2]/30" : canClick ? "hover:bg-[#faf7f2] cursor-pointer" : ""}
                `}
              >
                {/* Date number */}
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-[#8b6748] text-white" :
                  colIdx === 0 ? "text-red-400" :
                  colIdx === 6 ? "text-blue-400" :
                  "text-[#1c1c1c]"
                }`}>
                  {day.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.map(e => (
                    <div
                      key={e.id}
                      onClick={ev => { ev.stopPropagation(); openEdit(e); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium cursor-pointer truncate ${EVENT_COLORS[e.event_type]}`}
                    >
                      {e.event_type === "自訂" && e.custom_label ? e.custom_label : e.event_type}
                      {e.start_time && <span className="opacity-70 ml-1">{e.start_time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {EVENT_TYPES.map(t => (
          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border ${EVENT_COLORS[t]}`}>{t}</span>
        ))}
      </div>
      {!isEditable && (
        <p className="text-xs text-[#8a7a6e] mt-2 text-center">此月份不在可編輯範圍內</p>
      )}

      {/* Add/Edit Modal */}
      {modalDate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-1">
              {modalEvent ? "編輯事件" : "新增事件"}
            </h3>
            <p className="text-sm text-[#8a7a6e] mb-4">{modalDate.replace(/-/g, "/")}</p>

            <div className="space-y-3">
              {/* Event type */}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1.5 block">事件類型</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EVENT_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, event_type: t }))}
                      className={`py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        form.event_type === t
                          ? "bg-[#8b6748] text-white border-[#8b6748]"
                          : "bg-white text-[#8a7a6e] border-[#e8ddd2] hover:border-[#8b6748]"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom label */}
              {form.event_type === "自訂" && (
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">自訂說明</label>
                  <input value={form.custom_label}
                    onChange={e => setForm(p => ({ ...p, custom_label: e.target.value }))}
                    placeholder="例：外部培訓、品牌活動…"
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
              )}

              {/* Time range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#8a7a6e] mb-1 block">開始時間</label>
                  <input type="time" value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#8a7a6e] mb-1 block">結束時間</label>
                  <input type="time" value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
              </div>

              {/* Blocks booking toggle */}
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <div className="text-sm text-[#1c1c1c] font-medium">封鎖客人預約</div>
                  <div className="text-xs text-[#8a7a6e]">開啟後此時段不開放線上預約</div>
                </div>
                <div onClick={() => setForm(p => ({ ...p, blocks_booking: !p.blocks_booking }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.blocks_booking ? "bg-[#8b6748]" : "bg-gray-200"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.blocks_booking ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalDate(null)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              {modalEvent && (
                <button onClick={handleDelete} disabled={saving} className="py-2.5 px-4 border border-red-200 text-red-500 rounded-xl text-sm">刪除</button>
              )}
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? "儲存中…" : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
