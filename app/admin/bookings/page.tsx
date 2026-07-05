"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";
import { services as ALL_SERVICES, StaffLevel } from "@/lib/mockData";

// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR = 7;
const END_HOUR = 23;
const PX_PER_MIN = 1.5; // 90px per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;
const COL_WIDTH = 156;
const TIME_COL_W = 52;
const DAY_CN = ["日","一","二","三","四","五","六"];
const EVENT_TYPES = ["休假", "休息", "內訓", "共讀"];

const LEGACY_ID_MAP: Record<string, string> = {
  ST01: "xiaoJudan", ST02: "daan", ST03: "banqiao",
};

const BRANCH_NAMES: Record<string, string> = {
  ST01: "台北｜小巨蛋店", ST02: "台北｜大安店", ST03: "新北｜板橋店",
};

// Color palette cycling per staff
const PALETTE = [
  { bg: "#fce4ec", border: "#f48fb1", badge: "#e91e63", text: "#880e4f" }, // pink
  { bg: "#e3f2fd", border: "#90caf9", badge: "#1976d2", text: "#0d47a1" }, // blue
  { bg: "#e8f5e9", border: "#a5d6a7", badge: "#388e3c", text: "#1b5e20" }, // green
  { bg: "#fff3e0", border: "#ffcc80", badge: "#f57c00", text: "#e65100" }, // orange
  { bg: "#ede7f6", border: "#b39ddb", badge: "#7b1fa2", text: "#4a148c" }, // purple
  { bg: "#e0f7fa", border: "#80deea", badge: "#0097a7", text: "#006064" }, // teal
  { bg: "#fce4ec", border: "#ef9a9a", badge: "#c62828", text: "#b71c1c" }, // red
  { bg: "#f3e5f5", border: "#ce93d8", badge: "#8e24aa", text: "#4a148c" }, // violet
];

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

interface Booking {
  id: string;
  date: string;
  time_slot: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  store_id: string;
  staff_id: string | null;
  customer_id: string | null;
  duration?: number;
  customers?: { id: string; name: string; phone: string; line_user_id: string | null };
}

interface StaffProfile {
  id: string;
  name: string;
  level: string;
  branch_id: string | null;
}

interface Schedule {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  event_type: string | null;
  custom_label: string | null;
  blocks_booking: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function timeToMins(t: string): number {
  const parts = t.substring(0, 5).split(":").map(Number);
  return (parts[0] - START_HOUR) * 60 + (parts[1] || 0);
}

function minsToTop(m: number): number { return m * PX_PER_MIN; }

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function getCurrentTimeTop(): number {
  const now = new Date();
  const m = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  return minsToTop(m);
}

function getWeek(ymd: string): string[] {
  const d = new Date(ymd + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() - 3 + i);
    return toYMD(dd);
  });
}

// Duration in minutes from service name (fallback 60)
function guessDuration(serviceName?: string): number {
  if (!serviceName) return 60;
  const m = serviceName.match(/(\d+)\s*分/);
  if (m) return parseInt(m[1]);
  if (serviceName.includes("120")) return 120;
  if (serviceName.includes("90"))  return 90;
  if (serviceName.includes("60"))  return 60;
  if (serviceName.includes("50"))  return 50;
  return 60;
}

// ─── Time slots every 30min ───────────────────────────────────────────────────
const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h <= END_HOUR; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,"0")}:00`);
  if (h < END_HOUR) TIME_SLOTS.push(`${String(h).padStart(2,"0")}:30`);
}

const HOUR_LABELS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8b6748] bg-white";

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { user, activeBranchId } = useAdmin();
  const todayYMD = toYMD(new Date());

  const isStaff = user?.role === "員工";
  // 所有人都能操作預約（結帳、改客人資訊）；新增事件限管理者/店長
  const canManage = true;
  const canAddEvent = true;

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]     = useState(true);

  // Modals / UI state
  const [detail, setDetail]           = useState<Booking | null>(null);
  const [noteText, setNoteText]       = useState("");
  const [contextMenu, setContextMenu] = useState<{ staffId: string; time: string; x: number; y: number } | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddEvt,  setShowAddEvt]  = useState(false);
  const [saving, setSaving]           = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutAmounts, setCheckoutAmounts] = useState<Record<string,number>>({
    cash: 0, e_payment: 0, credit_card: 0, stored_value: 0, bank_transfer: 0, voucher: 0,
  });

  type AddPanel = "main" | "contact" | "staff" | "service" | "datetime";
  const [addPanel, setAddPanel] = useState<AddPanel>("main");

  const [customerSearch, setCustomerSearch] = useState({ mode: "" as ""| "phone" | "name", query: "", results: [] as {id:string;name:string;phone:string}[], searching: false });

  const searchCustomers = async (mode: "phone"|"name", q: string) => {
    if (!q.trim()) { setCustomerSearch(p => ({...p, results: []})); return; }
    setCustomerSearch(p => ({...p, searching: true}));
    const col = mode === "phone" ? "phone" : "name";
    const { data } = await supabase.from("customers").select("id,name,phone").ilike(col, `%${q}%`).limit(20);
    setCustomerSearch(p => ({...p, results: (data ?? []) as {id:string;name:string;phone:string}[], searching: false}));
  };

  const [newBooking, setNewBooking] = useState({
    customerName: "",
    phone: "",
    gender: "其它" as "男" | "女" | "其它",
    staffId: "",
    isDesignated: true,
    selectedServiceIds: [] as string[],
    timeSlot: "",
    date: selectedDate,
    totalPrice: 0,
    totalDuration: 0,
    notes: "",
  });
  const [newEvent, setNewEvent] = useState({
    staffId: "", title: "", startTime: "10:00", endTime: "11:00",
  });

  const [nowTop, setNowTop] = useState(getCurrentTimeTop());
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNowTop(getCurrentTimeTop()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const legacyId = LEGACY_ID_MAP[activeBranchId];

    // Staff: branch_id matches directly, OR cross-branch staff assigned to this branch
    const { data: assignedData } = await supabase
      .from("staff_branch_assignments")
      .select("staff_id")
      .eq("branch_id", activeBranchId);
    const assignedIds = (assignedData ?? []).map((r: { staff_id: string }) => r.staff_id);

    const { data: staffData } = await supabase
      .from("staff_profiles")
      .select("id,name,level,branch_id")
      .or(`branch_id.eq.${activeBranchId}${assignedIds.length ? `,id.in.(${assignedIds.join(",")})` : ""}`)
      .eq("is_active", true)
      .neq("role", "會計")
      .order("name");
    const staff = (staffData ?? []) as StaffProfile[];
    setStaffList(staff);

    // Bookings
    let q = supabase
      .from("bookings")
      .select("*, customers(id,name,phone,line_user_id)")
      .eq("date", selectedDate)
      .order("time_slot");
    if (legacyId) q = q.or(`store_id.eq.${activeBranchId},store_id.eq.${legacyId}`);
    else q = q.eq("store_id", activeBranchId);
    if (isStaff) q = q.eq("staff_id", user?.id ?? "");
    const { data: bkData } = await q;
    setBookings((bkData ?? []) as Booking[]);

    // Schedules
    const ids = staff.map(s => s.id);
    if (ids.length > 0) {
      const { data: schData } = await supabase
        .from("schedules")
        .select("*")
        .eq("date", selectedDate)
        .in("staff_id", ids);
      setSchedules((schData ?? []) as Schedule[]);
    } else {
      setSchedules([]);
    }

    setLoading(false);
  }, [selectedDate, activeBranchId, isStaff, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const colorMap: Record<string, typeof PALETTE[0]> = {};
  staffList.forEach((s, i) => { colorMap[s.id] = PALETTE[i % PALETTE.length]; });

  const bookingsByStaff: Record<string, Booking[]> = { __unassigned__: [] };
  staffList.forEach(s => { bookingsByStaff[s.id] = []; });
  bookings.forEach(b => {
    const key = b.staff_id ?? "__unassigned__";
    (bookingsByStaff[key] ?? bookingsByStaff["__unassigned__"]).push(b);
  });

  const schedsByStaff: Record<string, Schedule[]> = {};
  schedules.forEach(s => {
    if (!schedsByStaff[s.staff_id]) schedsByStaff[s.staff_id] = [];
    schedsByStaff[s.staff_id].push(s);
  });

  const countByStaff: Record<string, number> = {};
  bookings.forEach(b => {
    if (b.status !== "cancelled" && b.staff_id) {
      countByStaff[b.staff_id] = (countByStaff[b.staff_id] ?? 0) + 1;
    }
  });

  // 所有人都看全部欄位，方便幫同仁新增預約
  const gridColumns: StaffProfile[] = staffList;

  const weekDays = getWeek(selectedDate);
  const isToday  = selectedDate === todayYMD;
  const showNow  = isToday && nowTop >= 0 && nowTop <= TOTAL_HEIGHT;

  // ── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: BookingStatus) => {
    if (status === "completed") {
      // Open checkout modal instead of directly updating
      const total = detail?.total_price ?? 0;
      setCheckoutAmounts({ cash: total, e_payment: 0, credit_card: 0, stored_value: 0, bank_transfer: 0, voucher: 0 });
      setShowCheckout(true);
      return;
    }
    setSaving(true);
    await supabase.from("bookings").update({ status }).eq("id", id);
    await fetchAll();
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : null);
    setSaving(false);
  };

  const handleCheckout = async () => {
    if (!detail) return;
    setSaving(true);
    const staffProfile = staffList.find(s => s.id === detail.staff_id);
    await supabase.from("service_checkouts").insert({
      booking_id: detail.id,
      staff_id: detail.staff_id,
      branch_id: activeBranchId,
      customer_id: detail.customer_id,
      customer_name: detail.customers?.name ?? "訪客",
      total_amount: detail.total_price ?? 0,
      cash:         checkoutAmounts.cash,
      e_payment:    checkoutAmounts.e_payment,
      credit_card:  checkoutAmounts.credit_card,
      stored_value: checkoutAmounts.stored_value,
      bank_transfer:checkoutAmounts.bank_transfer,
      voucher:      checkoutAmounts.voucher,
    });
    await supabase.from("bookings").update({ status: "completed" }).eq("id", detail.id);
    await fetchAll();
    setDetail(prev => prev ? { ...prev, status: "completed" } : null);
    setShowCheckout(false);
    setSaving(false);
  };

  const resetNewBooking = () => setNewBooking({
    customerName: "", phone: "", gender: "其它", staffId: "", isDesignated: true,
    selectedServiceIds: [], timeSlot: "", date: selectedDate, totalPrice: 0, totalDuration: 0, notes: "",
  });

  const computeBookingPrice = (serviceIds: string[], staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    const level = (staff?.level ?? "初階職人") as StaffLevel;
    let dur = 0, price = 0;
    serviceIds.forEach(id => {
      const svc = ALL_SERVICES.find(s => s.id === id);
      if (!svc) return;
      dur += svc.duration;
      price += svc.priceRegular[level] ?? svc.priceRegular["初階職人"] ?? 0;
    });
    return { dur, price };
  };

  const handleAddBooking = async () => {
    if (!newBooking.customerName || !newBooking.timeSlot) return;
    setSaving(true);
    let customerId: string | null = null;
    if (newBooking.phone) {
      const { data: ex } = await supabase.from("customers").select("id").eq("phone", newBooking.phone).maybeSingle();
      if (ex) { customerId = ex.id; }
      else {
        const { data: cr } = await supabase.from("customers").insert({
          name: newBooking.customerName || "訪客",
          phone: newBooking.phone,
        }).select("id").single();
        customerId = cr?.id ?? null;
      }
    } else if (newBooking.customerName && newBooking.customerName !== "匿名") {
      const { data: cr } = await supabase.from("customers").insert({
        name: newBooking.customerName,
        phone: null,
      }).select("id").single();
      customerId = cr?.id ?? null;
    }
    const primaryServiceId = newBooking.selectedServiceIds.find(id => !id.startsWith("addon")) ?? newBooking.selectedServiceIds[0] ?? null;
    const { price: computedPrice, dur: computedDur } = computeBookingPrice(newBooking.selectedServiceIds, newBooking.staffId);
    const { error: bkErr } = await supabase.from("bookings").insert({
      customer_id: customerId,
      store_id: activeBranchId,
      staff_id: newBooking.staffId || null,
      service_id: primaryServiceId,
      date: selectedDate,
      time_slot: newBooking.timeSlot,
      status: "confirmed",
      total_price: computedPrice,
      duration: computedDur || null,
      notes: newBooking.notes || null,
      symptoms: [],
    });
    if (bkErr) { console.error("booking insert error:", bkErr); alert("新增失敗：" + bkErr.message); setSaving(false); return; }
    await fetchAll();
    setShowAddBook(false);
    resetNewBooking();
    setSaving(false);
  };

  // Compute busy slot ranges for datetime picker
  const getBusyMinsForStaff = (staffId: string) => {
    const ranges: Array<{ start: number; end: number }> = [];
    bookings.filter(b => b.staff_id === staffId && b.status !== "cancelled").forEach(b => {
      const start = timeToMins(b.time_slot);
      const dur = b.duration ?? 60;
      ranges.push({ start, end: start + dur });
    });
    schedules.filter(s => s.staff_id === staffId).forEach(s => {
      ranges.push({ start: timeToMins(s.start_time), end: timeToMins(s.end_time) });
    });
    return ranges;
  };

  const isSlotBusy = (time: string, ranges: Array<{ start: number; end: number }>) => {
    const s = timeToMins(time);
    return ranges.some(r => s < r.end && s + 10 > r.start);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.staffId) return;
    setSaving(true);
    const { error: evtErr } = await supabase.from("schedules").insert({
      staff_id: newEvent.staffId,
      date: selectedDate,
      start_time: newEvent.startTime + ":00",
      end_time: newEvent.endTime + ":00",
      title: newEvent.title,         // added via ALTER TABLE
      event_type: "自訂",
      custom_label: newEvent.title,
      blocks_booking: true,
    });
    if (evtErr) { console.error("event insert error:", evtErr); alert("新增失敗：" + evtErr.message); setSaving(false); return; }
    await fetchAll();
    setShowAddEvt(false);
    setSaving(false);
  };

  const handleCellClick = (e: React.MouseEvent<HTMLDivElement>, staffId: string) => {
    e.stopPropagation();
    if (!canManage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const mins = Math.floor(offsetY / PX_PER_MIN / 30) * 30;
    const h = START_HOUR + Math.floor(mins / 60);
    const m = mins % 60;
    const time = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    setContextMenu({ staffId, time, x: e.clientX, y: e.clientY });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "calc(100vh - 0px)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">
          {BRANCH_NAMES[activeBranchId] ?? "預約管理"}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {bookings.filter(b => b.status !== "cancelled").length} 筆
          </span>
          <button
            onClick={() => setSelectedDate(todayYMD)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selectedDate === todayYMD
                ? "border-[#8b6748] text-[#8b6748] bg-[#faf7f2]"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            今天
          </button>
          <button onClick={fetchAll} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg text-base">
            ↻
          </button>
        </div>
      </div>

      {/* ── Week strip ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          <div style={{ width: TIME_COL_W }} className="flex-shrink-0" />
          <div className="flex flex-1">
            {weekDays.map(ymd => {
              const d = new Date(ymd + "T00:00:00");
              const isSel = ymd === selectedDate;
              const isT   = ymd === todayYMD;
              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDate(ymd)}
                  className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                    isSel ? "border-[#8b6748] bg-[#faf7f2]" : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className={`text-[9px] font-medium ${isT ? "text-red-500" : "text-gray-400"}`}>
                    週{DAY_CN[d.getDay()]}
                  </div>
                  <div className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${
                    isSel ? "bg-[#8b6748] text-white" : isT ? "text-red-500" : "text-gray-700"
                  }`}>
                    {d.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">載入中…</div>
      ) : (
        <div className="flex-1 overflow-auto" ref={gridRef}>
          <div className="flex" style={{ minWidth: TIME_COL_W + COL_WIDTH * gridColumns.length }}>

            {/* Time column */}
            <div
              className="flex-shrink-0 bg-gray-50 border-r border-gray-200 sticky left-0 z-20"
              style={{ width: TIME_COL_W }}
            >
              {/* Header spacer */}
              <div className="h-12 border-b border-gray-200" />
              {/* Hour labels */}
              <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                {HOUR_LABELS.map(h => (
                  <div
                    key={h}
                    className="absolute right-2 text-[10px] text-gray-400 font-mono select-none"
                    style={{ top: minsToTop((h - START_HOUR) * 60) - 7 }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff columns */}
            {gridColumns.map((col) => {
              const color   = colorMap[col.id] ?? PALETTE[7];
              const bkgs    = bookingsByStaff[col.id] ?? [];
              const scheds  = schedsByStaff[col.id] ?? [];
              const count   = countByStaff[col.id] ?? 0;
              const isUnassigned = col.id === "__unassigned__";
              const staff   = staffList.find(s => s.id === col.id);

              return (
                <div
                  key={col.id}
                  className="flex-shrink-0 border-r border-gray-200 last:border-r-0"
                  style={{ width: COL_WIDTH }}
                >
                  {/* Column header */}
                  <div className="h-12 border-b border-gray-200 bg-white px-2 flex flex-col justify-center">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800 truncate">{col.name}</span>
                      {staff?.level && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded text-white flex-shrink-0"
                          style={{ backgroundColor: color.badge }}
                        >
                          {staff.level === "技術長" ? "技術長" : "技術職人"}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{count} ▾</div>
                  </div>

                  {/* Column body */}
                  <div
                    className="relative select-none"
                    style={{ height: TOTAL_HEIGHT, background: "white", cursor: canManage ? "pointer" : "default" }}
                    onClick={(e) => handleCellClick(e, col.id)}
                  >
                    {/* Hour grid lines */}
                    {HOUR_LABELS.map(h => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top: minsToTop((h - START_HOUR) * 60), borderTop: "1px solid #f0f0f0" }}
                      />
                    ))}
                    {/* 30min dashed lines */}
                    {HOUR_LABELS.slice(0, -1).map(h => (
                      <div
                        key={`${h}h`}
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ top: minsToTop((h - START_HOUR) * 60 + 30), borderTop: "1px dashed #f5f5f5" }}
                      />
                    ))}

                    {/* Schedules / blocked time (diagonal stripes) */}
                    {scheds.map(sch => {
                      const top = minsToTop(timeToMins(sch.start_time));
                      const bot = minsToTop(timeToMins(sch.end_time));
                      const h   = Math.max(20, bot - top);
                      return (
                        <div
                          key={sch.id}
                          className={`absolute left-0 right-0 ${canManage ? "cursor-pointer hover:brightness-95" : "pointer-events-none"}`}
                          style={{
                            top,
                            height: h,
                            background: `repeating-linear-gradient(-45deg, #e5e7f0 0px, #e5e7f0 3px, #eceef8 3px, #eceef8 9px)`,
                          }}
                          onClick={canManage ? async (e) => {
                            e.stopPropagation();
                            if (confirm(`刪除「${(sch.custom_label || sch.title || sch.event_type || "事件")}」事件？`)) {
                              await supabase.from("schedules").delete().eq("id", sch.id);
                              await fetchAll();
                            }
                          } : undefined}
                        >
                          <span
                            className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: color.badge }}
                          >
                            {(sch.custom_label || sch.title || sch.event_type || "事件")}
                          </span>
                        </div>
                      );
                    })}

                    {/* Bookings */}
                    {bkgs.map(b => {
                      if (b.status === "cancelled") return null;
                      const top      = minsToTop(timeToMins(b.time_slot));
                      const duration = b.duration ?? guessDuration(undefined);
                      const height   = Math.max(38, duration * PX_PER_MIN - 2);
                      const endTime  = addMins(b.time_slot, duration);
                      const staffName = isUnassigned
                        ? (staffList.find(s => s.id === b.staff_id)?.name ?? "")
                        : col.name;
                      const staffLevel = staffList.find(s => s.id === b.staff_id)?.level ?? col.level;

                      // Card color by status
                      const cardStyle = b.status === "completed"
                        ? { bg: "#e0f2fe", border: "#7dd3fc", badge: "#0284c7", text: "#0369a1" }
                        : b.status === "no_show"
                        ? { bg: "#f3f4f6", border: "#d1d5db", badge: "#9ca3af", text: "#6b7280" }
                        : { bg: "#fce7f3", border: "#f9a8d4", badge: color.badge, text: "#be185d" };

                      return (
                        <div
                          key={b.id}
                          className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                          style={{
                            top: top + 1,
                            height,
                            backgroundColor: cardStyle.bg,
                            border: `1px solid ${cardStyle.border}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail(b);
                            setNoteText(b.notes ?? "");
                            setContextMenu(null);
                          }}
                        >
                          <div className="p-1.5 h-full flex flex-col">
                            <div className="text-[9px] text-gray-500 font-mono leading-none flex-shrink-0">
                              {b.time_slot} - {endTime}
                            </div>
                            {height > 50 && (
                              <div
                                className="mt-0.5 text-[9px] px-1 py-0.5 rounded text-white inline-block flex-shrink-0 self-start"
                                style={{ backgroundColor: cardStyle.badge }}
                              >
                                {staffName}{staffLevel ? `｜${staffLevel === "技術長" ? "技術長" : "技術職人"}` : ""}
                              </div>
                            )}
                            <div
                              className="text-[11px] font-semibold mt-0.5 truncate"
                              style={{ color: cardStyle.text }}
                            >
                              {b.customers?.name ?? "訪客"}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current time line */}
                    {showNow && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: nowTop }}
                      >
                        <div className="relative flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                          <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── + FAB ──────────────────────────────────────────────────────────── */}
      {canManage && (
        <button
          onClick={() => {
            resetNewBooking();
            setAddPanel("main");
            setShowAddBook(true);
          }}
          className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl text-white z-30"
          style={{ backgroundColor: "#e8606a" }}
        >
          +
        </button>
      )}

      {/* ── Context menu ───────────────────────────────────────────────────── */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl py-1 overflow-hidden"
            style={{
              left: Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 375) - 180),
              top:  Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 812) - 110),
              minWidth: 160,
            }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 text-left"
              onClick={() => {
                resetNewBooking();
                setNewBooking(p => ({ ...p, staffId: contextMenu.staffId === "__unassigned__" ? "" : contextMenu.staffId, timeSlot: contextMenu.time, date: selectedDate }));
                setAddPanel("main");
                setContextMenu(null);
                setShowAddBook(true);
              }}
            >
              <span style={{ color: "#e8606a" }}>📋</span>
              新增預約
            </button>
            {canAddEvent && (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 text-left"
                onClick={() => {
                  setNewEvent({ staffId: contextMenu.staffId === "__unassigned__" ? "" : contextMenu.staffId, title: "", startTime: contextMenu.time, endTime: addMins(contextMenu.time, 60) });
                  setContextMenu(null);
                  setShowAddEvt(true);
                }}
              >
                <span>📅</span>
                新增事件
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Detail bottom sheet ─────────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setDetail(null)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl overflow-y-auto"
            style={{ maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>網路預約</span>
                <span>·</span>
                <span>{detail.date} {detail.time_slot}</span>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 text-xl leading-none w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Confirmed badge */}
              {(detail.status === "confirmed" || detail.status === "pending") && (
                <div className="flex items-center gap-1.5 text-teal-600 text-xs font-medium">
                  <span className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-white text-[9px]">✓</span>
                  預約提醒已確認
                </div>
              )}

              {/* Customer */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-lg font-bold flex-shrink-0">
                  {(detail.customers?.name ?? "訪")[0]}
                </div>
                <div className="flex-1">
                  {detail.customers?.phone && (
                    <div className="text-sm font-semibold text-gray-800">
                      +886 {detail.customers.phone.replace(/^0/, "")}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-0.5">{detail.customers?.name ?? "訪客"}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LINE</span>
                  </div>
                </div>
              </div>

              {/* Status tabs */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {[
                  { key: "confirmed" as BookingStatus, label: "尚未到來",
                    active: detail.status === "confirmed" || detail.status === "pending",
                    activeClass: "bg-pink-50 text-pink-600 font-semibold" },
                  { key: "completed" as BookingStatus, label: "已報到",
                    active: detail.status === "completed",
                    activeClass: "bg-sky-50 text-sky-600 font-semibold" },
                  { key: "no_show" as BookingStatus, label: "爽約",
                    active: detail.status === "no_show",
                    activeClass: "bg-gray-100 text-gray-500 font-semibold" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    disabled={saving}
                    onClick={() => updateStatus(detail.id, tab.key)}
                    className={`flex-1 py-2.5 text-sm transition-colors ${
                      tab.active ? tab.activeClass : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Checkout row */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">$</span>
                  檢視結帳
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-800">
                    {(detail.total_price ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-[#8b6748] font-medium">明細</span>
                </div>
              </div>

              {/* Booking info */}
              <div>
                <div className="text-xs text-gray-400 mb-1">FASCIA法夏・筋膜結構美學 · {BRANCH_NAMES[activeBranchId] ?? ""}</div>
                <div className="text-base font-semibold text-gray-800">
                  {detail.date.replace(/-/g,"/")} 週{DAY_CN[new Date(detail.date + "T00:00:00").getDay()]} {detail.time_slot}
                  {detail.time_slot && ` - ${addMins(detail.time_slot, detail.duration ?? 60)}`}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  總計 {detail.duration ?? 60} 分鐘 / NT${(detail.total_price ?? 0).toLocaleString()}
                </div>
              </div>

              {/* Staff */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <span>👤</span> 服務人員
                </span>
                <span className="text-sm text-gray-700 font-medium">
                  {staffList.find(s => s.id === detail.staff_id)?.name ?? "未指定"}
                  {detail.staff_id && (() => {
                    const s = staffList.find(x => x.id === detail.staff_id);
                    return s?.level ? <span className="text-gray-400">｜{s.level === "技術長" ? "技術長" : "技術職人"}</span> : null;
                  })()}
                </span>
              </div>

              {/* Notes */}
              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs text-gray-400 mb-1.5 block">備註</label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="輸入備註…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#8b6748]"
                />
                <button
                  onClick={async () => {
                    setSaving(true);
                    await supabase.from("bookings").update({ notes: noteText }).eq("id", detail.id);
                    await fetchAll();
                    setDetail(prev => prev ? { ...prev, notes: noteText } : null);
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium border border-[#8b6748] text-[#8b6748] hover:bg-[#faf7f2] disabled:opacity-40 transition-colors"
                >
                  {saving ? "儲存中…" : "儲存備註"}
                </button>
              </div>

              {/* Cancel */}
              {canManage && (detail.status === "confirmed" || detail.status === "pending") && (
                <button
                  onClick={() => { if (confirm("確定取消預約？")) updateStatus(detail.id, "cancelled"); }}
                  disabled={saving}
                  className="w-full py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm"
                >
                  取消預約
                </button>
              )}
            </div>

            {/* Checkout shortcut */}
            {detail.status !== "completed" && (
              <div className="border-t border-gray-100 px-5 py-4 pb-8">
                <button
                  onClick={() => {
                    const total = detail.total_price ?? 0;
                    setCheckoutAmounts({ cash: total, e_payment: 0, credit_card: 0, stored_value: 0, bank_transfer: 0, voucher: 0 });
                    setShowCheckout(true);
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#e8606a" }}
                >
                  💳 前往結帳
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Modal ─────────────────────────────────────────────────── */}
      {showCheckout && detail && (() => {
        const total = detail.total_price ?? 0;
        const paid  = Object.values(checkoutAmounts).reduce((s, v) => s + (v || 0), 0);
        const remaining = total - paid;
        const METHODS = [
          { key: "cash",         label: "現金",   icon: "💵" },
          { key: "e_payment",    label: "電子支付", icon: "📱" },
          { key: "credit_card",  label: "信用卡",  icon: "💳" },
          { key: "stored_value", label: "儲值餘額", icon: "🎫" },
          { key: "bank_transfer",label: "銀行轉帳", icon: "🏦" },
          { key: "voucher",      label: "優惠券",  icon: "🎟" },
        ];
        return (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center" onClick={() => setShowCheckout(false)}>
            <div
              className="bg-white w-full max-w-lg rounded-t-3xl overflow-y-auto"
              style={{ maxHeight: "90vh" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">結帳</h2>
                <button onClick={() => setShowCheckout(false)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Summary */}
                <div className="bg-[#faf7f2] rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#8a7a6e]">{detail.customers?.name ?? "訪客"}</div>
                    <div className="text-sm font-medium text-[#1c1c1c]">{detail.date} {detail.time_slot}</div>
                  </div>
                  <div className="text-xl font-bold text-[#8b6748]">NT${total.toLocaleString()}</div>
                </div>

                {/* Payment methods */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-medium">付款方式（可拆分）</div>
                  {METHODS.map(m => (
                    <div key={m.key} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-lg w-6">{m.icon}</span>
                      <span className="text-sm text-gray-700 flex-1">{m.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">NT$</span>
                        <input
                          type="number"
                          min={0}
                          value={checkoutAmounts[m.key] || ""}
                          placeholder="0"
                          onChange={e => setCheckoutAmounts(prev => ({ ...prev, [m.key]: Number(e.target.value) || 0 }))}
                          className="w-24 text-right text-sm font-medium bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#8b6748]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Remaining */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${remaining === 0 ? "bg-green-50" : remaining > 0 ? "bg-yellow-50" : "bg-red-50"}`}>
                  <span className="text-sm">{remaining === 0 ? "✓ 金額吻合" : remaining > 0 ? "⚠ 未收金額" : "⚠ 超收金額"}</span>
                  <span className={`text-sm font-bold ${remaining === 0 ? "text-green-600" : "text-red-500"}`}>
                    {remaining === 0 ? "" : remaining > 0 ? `-NT$${remaining.toLocaleString()}` : `+NT${Math.abs(remaining).toLocaleString()}`}
                  </span>
                </div>

                {/* Confirm */}
                <button
                  onClick={handleCheckout}
                  disabled={saving || remaining !== 0}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: "#e8606a" }}
                >
                  {saving ? "處理中…" : "確認結帳完成"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Booking Modal (multi-panel) ────────────────────────────────── */}
      {showAddBook && (() => {
        const selStaff = staffList.find(s => s.id === newBooking.staffId);
        const staffLevel = (selStaff?.level ?? "初階職人") as StaffLevel;
        const allowedIds = selStaff
          ? ([] as string[]).concat(...[selStaff].map(() => {
              // Use allowedServiceIds from teachers array if available
              return ALL_SERVICES.map(s => s.id);
            }))
          : ALL_SERVICES.map(s => s.id);

        // Services to show (non-addon first, then addon)
        const mainServices = ALL_SERVICES.filter(s => !s.isAddon && s.onlineBookable);
        const addonServices = ALL_SERVICES.filter(s => s.isAddon && s.onlineBookable);

        const computeTotals = (ids: string[]) => {
          let dur = 0, price = 0;
          ids.forEach(id => {
            const svc = ALL_SERVICES.find(s => s.id === id);
            if (!svc) return;
            dur += svc.duration;
            price += svc.priceRegular[staffLevel] ?? svc.priceRegular["初階職人"] ?? 0;
          });
          return { dur, price };
        };
        const { dur: totalDur, price: totalPrice } = computeTotals(newBooking.selectedServiceIds);

        // Busy ranges for datetime
        const busyRanges = newBooking.staffId ? getBusyMinsForStaff(newBooking.staffId) : [];

        // 10-min time slots for datetime grid
        const dtSlots: string[] = [];
        for (let h = START_HOUR; h < END_HOUR; h++) {
          for (let m = 0; m < 60; m += 10) {
            dtSlots.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
          }
        }
        // group by hour
        const dtByHour: Record<number, string[]> = {};
        dtSlots.forEach(t => {
          const h = parseInt(t.split(":")[0]);
          if (!dtByHour[h]) dtByHour[h] = [];
          dtByHour[h].push(t);
        });

        const avatarColors = ["#e8606a","#f57c00","#388e3c","#1976d2","#7b1fa2","#0097a7","#c62828","#8e24aa"];
        const staffAvatar = (name: string, i: number) => (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColors[i % avatarColors.length] }}
          >
            {name.slice(0, 2)}
          </div>
        );

        const panelHeader = (title: string, onBack: () => void, onConfirm?: () => void) => (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={onBack} className="text-gray-400 text-xl w-8 leading-none">✕</button>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            {onConfirm
              ? <button onClick={onConfirm} className="text-[#e8606a] font-bold text-xl w-8 text-right">✓</button>
              : <div className="w-8" />}
          </div>
        );

        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center">
            <div className="bg-white w-full max-w-sm rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>

              {/* ── Main panel ─────────────────────────────── */}
              {addPanel === "main" && <>
                {panelHeader("新增預約", () => { setShowAddBook(false); resetNewBooking(); })}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                  {/* 聯絡人 */}
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50" onClick={() => setAddPanel("contact")}>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>👤</span> 聯絡人
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={newBooking.customerName ? "text-gray-800 font-medium" : "text-gray-400"}>
                        {newBooking.customerName || "匿名"}
                      </span>
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>

                  {/* 指定預約 toggle */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>🔀</span> 該筆預約為指定預約
                    </div>
                    <button
                      onClick={() => setNewBooking(p => ({ ...p, isDesignated: !p.isDesignated }))}
                      className={`w-11 h-6 rounded-full transition-colors relative ${newBooking.isDesignated ? "bg-[#e8606a]" : "bg-gray-200"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${newBooking.isDesignated ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {/* 服務人員 */}
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50" onClick={() => setAddPanel("staff")}>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>📋</span> 服務人員
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={newBooking.staffId ? "text-gray-800 font-medium" : "text-gray-400"}>
                        {selStaff ? `${selStaff.name}｜${selStaff.level}` : "請選擇"}
                      </span>
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>

                  {/* 服務 */}
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50" onClick={() => setAddPanel("service")}>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>📋</span> 服務
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {newBooking.selectedServiceIds.length > 0
                        ? <span className="text-gray-800 font-medium">{newBooking.selectedServiceIds.length} 項</span>
                        : <span className="text-[#e8606a]">請選擇</span>}
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>

                  {/* Totals */}
                  <div className="px-5 py-3 text-sm text-gray-400">
                    總計 {totalDur} 分鐘 / NT${totalPrice.toLocaleString()}
                  </div>

                  {/* 預約時間 */}
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50" onClick={() => setAddPanel("datetime")}>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>🕐</span> 預約時間
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {newBooking.timeSlot
                        ? <span className="text-gray-800 font-medium">{newBooking.date} {newBooking.timeSlot}</span>
                        : <span className="text-gray-400">{newBooking.date} 14:00</span>}
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>

                  {/* 備註 */}
                  <div className="px-5 py-4">
                    <textarea
                      value={newBooking.notes}
                      onChange={e => setNewBooking(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      placeholder="備註（選填）"
                      className="w-full text-sm text-gray-700 border-none outline-none resize-none placeholder-gray-300"
                    />
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-100 px-5 py-4 pb-8 flex items-center justify-end">
                  <button
                    onClick={async () => {
                      setNewBooking(p => ({ ...p, totalPrice: totalPrice, totalDuration: totalDur }));
                      await handleAddBooking();
                    }}
                    disabled={saving || !newBooking.customerName || !newBooking.timeSlot}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40"
                    style={{ backgroundColor: "#e8606a" }}
                  >
                    {saving ? "新增中…" : "新增預約"}
                  </button>
                </div>
              </>}

              {/* ── 聯絡人 panel ────────────────────────────── */}
              {addPanel === "contact" && <>
                {panelHeader("聯絡人", () => { setAddPanel("main"); setCustomerSearch({ mode: "", query: "", results: [], searching: false }); }, () => { setAddPanel("main"); setCustomerSearch({ mode: "", query: "", results: [], searching: false }); })}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Phone search */}
                  <div className="px-5 py-3 border-b border-gray-100">
                    <label className="text-xs text-gray-400 mb-1.5 block">電話搜尋</label>
                    <input
                      value={customerSearch.mode === "phone" ? customerSearch.query : ""}
                      onChange={e => {
                        const q = e.target.value;
                        setCustomerSearch(p => ({...p, mode: "phone", query: q}));
                        searchCustomers("phone", q);
                      }}
                      placeholder="輸入電話號碼…"
                      inputMode="tel"
                      className="w-full text-sm outline-none py-2 border-b border-gray-200"
                    />
                  </div>
                  {/* Name search */}
                  <div className="px-5 py-3 border-b border-gray-100">
                    <label className="text-xs text-gray-400 mb-1.5 block">姓名搜尋</label>
                    <input
                      value={customerSearch.mode === "name" ? customerSearch.query : ""}
                      onChange={e => {
                        const q = e.target.value;
                        setCustomerSearch(p => ({...p, mode: "name", query: q}));
                        searchCustomers("name", q);
                      }}
                      placeholder="輸入客戶姓名…"
                      className="w-full text-sm outline-none py-2 border-b border-gray-200"
                    />
                  </div>
                  {/* Results */}
                  <div className="overflow-y-auto flex-1">
                    {customerSearch.searching && <div className="text-center text-sm text-gray-400 py-8">搜尋中…</div>}
                    {!customerSearch.searching && customerSearch.query && customerSearch.results.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-8">找不到符合的會員</div>
                    )}
                    {customerSearch.results.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setNewBooking(p => ({ ...p, customerName: c.name, phone: c.phone }));
                          setAddPanel("main");
                          setCustomerSearch({ mode: "", query: "", results: [], searching: false });
                        }}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {c.name.slice(0,1)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Manual entry section */}
                  {!customerSearch.query && (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <label className="text-xs text-gray-400 mb-1.5 block">或直接輸入</label>
                      <input
                        value={newBooking.customerName}
                        onChange={e => setNewBooking(p => ({ ...p, customerName: e.target.value }))}
                        placeholder="客戶姓名"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none mb-2"
                      />
                      <input
                        value={newBooking.phone}
                        onChange={e => setNewBooking(p => ({ ...p, phone: e.target.value }))}
                        placeholder="電話號碼"
                        inputMode="tel"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                      />
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 mt-3">
                        {(["男","女","其它"] as const).map(g => (
                          <button
                            key={g}
                            onClick={() => setNewBooking(p => ({ ...p, gender: g }))}
                            className={`flex-1 py-2.5 text-sm transition-colors ${newBooking.gender === g ? "bg-[#e8606a] text-white font-medium" : "text-gray-500 hover:bg-gray-50"}`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>}

              {/* ── 服務人員 panel ───────────────────────────── */}
              {addPanel === "staff" && <>
                {panelHeader("服務人員", () => setAddPanel("main"))}
                <div className="overflow-y-auto flex-1">
                  {/* Toggle at top */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">該筆預約為指定預約</span>
                      <button
                        onClick={() => setNewBooking(p => ({ ...p, isDesignated: !p.isDesignated }))}
                        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${newBooking.isDesignated ? "bg-[#e8606a]" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${newBooking.isDesignated ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      關閉後，會員自行檢視預約時，將無法看見服務人員；該筆預約的狀態也會被歸屬為「不指定」
                    </p>
                  </div>
                  {/* Staff list */}
                  {staffList.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setNewBooking(p => ({ ...p, staffId: s.id })); setAddPanel("main"); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 border-b border-gray-50"
                    >
                      {staffAvatar(s.name, i)}
                      <span className="flex-1 text-left text-sm text-gray-800">
                        {s.name}｜{s.level}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        newBooking.staffId === s.id ? "border-[#e8606a] bg-[#e8606a]" : "border-gray-300"
                      }`}>
                        {newBooking.staffId === s.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>}

              {/* ── 選擇服務 panel ──────────────────────────── */}
              {addPanel === "service" && (() => {
                const toggleSvc = (id: string) => {
                  setNewBooking(p => ({
                    ...p,
                    selectedServiceIds: p.selectedServiceIds.includes(id)
                      ? p.selectedServiceIds.filter(x => x !== id)
                      : [...p.selectedServiceIds, id],
                  }));
                };
                return <>
                  {panelHeader("選擇服務", () => setAddPanel("main"), () => setAddPanel("main"))}
                  <div className="overflow-y-auto flex-1">
                    {/* Tab */}
                    <div className="px-5 pt-3 pb-0">
                      <div className="border-b border-gray-200 flex gap-4">
                        <span className="text-sm font-semibold text-gray-800 pb-2 border-b-2 border-gray-800">筋膜結構調理</span>
                      </div>
                    </div>
                    {/* Main services */}
                    {mainServices.map(svc => {
                      const price = svc.priceRegular[staffLevel] ?? svc.priceRegular["初階職人"] ?? 0;
                      const checked = newBooking.selectedServiceIds.includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          onClick={() => toggleSvc(svc.id)}
                          className="w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 text-left"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            checked ? "bg-[#e8606a] border-[#e8606a]" : "border-gray-300"
                          }`}>
                            {checked && <span className="text-white text-xs leading-none">✓</span>}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">【{svc.duration}分鐘】{svc.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{svc.duration} 分鐘 / NT${price.toLocaleString()}</div>
                          </div>
                        </button>
                      );
                    })}
                    {/* Addon services */}
                    {addonServices.map(svc => {
                      const price = svc.priceRegular[staffLevel] ?? svc.priceRegular["初階職人"] ?? 0;
                      const checked = newBooking.selectedServiceIds.includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          onClick={() => toggleSvc(svc.id)}
                          className="w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 text-left"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            checked ? "bg-[#e8606a] border-[#e8606a]" : "border-gray-300"
                          }`}>
                            {checked && <span className="text-white text-xs leading-none">✓</span>}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">{svc.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {svc.duration > 0 ? `${svc.duration} 分鐘 / ` : ""}NT${price.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Bottom bar */}
                  <div className="border-t border-gray-100 px-5 py-3 pb-6 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      已選擇 {newBooking.selectedServiceIds.length} 項 / 總計 {totalDur} 分鐘 / NT${totalPrice.toLocaleString()}
                    </span>
                    <button onClick={() => setNewBooking(p => ({ ...p, selectedServiceIds: [] }))} className="text-xs text-[#e8606a]">全部清除</button>
                  </div>
                </>;
              })()}

              {/* ── 預約時間 panel ──────────────────────────── */}
              {addPanel === "datetime" && (() => {
                const dtDate = newBooking.date;
                const weekFromDt = getWeek(dtDate);
                return <>
                  {panelHeader("預約時間", () => setAddPanel("main"))}
                  <div className="overflow-y-auto flex-1">
                    {/* Date strip */}
                    <div className="border-b border-gray-100 pb-2">
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {new Date(dtDate + "T00:00:00").toLocaleDateString("zh-TW", { month: "long", day: "numeric", year: "numeric" })} ▾
                        </span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setNewBooking(p => ({ ...p, date: todayYMD }))} className="text-xs text-[#e8606a] border border-[#e8606a] px-2 py-1 rounded-lg">今天</button>
                          <button onClick={() => {
                            const d = new Date(dtDate + "T00:00:00");
                            d.setDate(d.getDate() - 7);
                            setNewBooking(p => ({ ...p, date: toYMD(d) }));
                          }} className="text-gray-400 text-lg w-6 text-center">‹</button>
                          <button onClick={() => {
                            const d = new Date(dtDate + "T00:00:00");
                            d.setDate(d.getDate() + 7);
                            setNewBooking(p => ({ ...p, date: toYMD(d) }));
                          }} className="text-gray-400 text-lg w-6 text-center">›</button>
                        </div>
                      </div>
                      <div className="flex px-5 gap-1">
                        {weekFromDt.map(ymd => {
                          const d = new Date(ymd + "T00:00:00");
                          const isSel = ymd === dtDate;
                          const isT = ymd === todayYMD;
                          return (
                            <button
                              key={ymd}
                              onClick={() => setNewBooking(p => ({ ...p, date: ymd }))}
                              className={`flex-1 py-1.5 flex flex-col items-center rounded-lg transition-colors ${isSel ? "bg-[#e8606a]" : "hover:bg-gray-50"}`}
                            >
                              <span className={`text-[9px] ${isSel ? "text-white/80" : isT ? "text-[#e8606a]" : "text-gray-400"}`}>
                                {["日","一","二","三","四","五","六"][d.getDay()]}
                              </span>
                              <span className={`text-sm font-bold mt-0.5 ${isSel ? "text-white" : isT ? "text-[#e8606a]" : "text-gray-700"}`}>
                                {d.getDate()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time grid */}
                    <div className="px-4 py-3">
                      {HOUR_LABELS.slice(0, -1).map(h => (
                        <div key={h} className="flex items-start mb-1.5 gap-2">
                          <div className="w-6 text-[11px] text-gray-400 font-mono pt-1.5 flex-shrink-0 text-right">{h}</div>
                          <div className="flex-1 grid grid-cols-3 gap-1">
                            {[0, 10, 20, 30, 40, 50].map(m => {
                              const time = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
                              const busy = isSlotBusy(time, busyRanges);
                              const sel = newBooking.timeSlot === time && newBooking.date === dtDate;
                              const isHalfHour = m === 0 || m === 30;
                              return (
                                <button
                                  key={m}
                                  disabled={busy}
                                  onClick={() => { setNewBooking(p => ({ ...p, timeSlot: time })); setAddPanel("main"); }}
                                  className={`py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-0.5 ${
                                    busy ? "bg-gray-100 text-gray-300 cursor-not-allowed" :
                                    sel ? "bg-[#e8606a] text-white" :
                                    "bg-white border border-gray-200 text-gray-700 hover:border-[#e8606a] hover:text-[#e8606a]"
                                  }`}
                                >
                                  {isHalfHour && !sel && !busy && <span className="text-[8px] opacity-40">🕐</span>}
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-xs text-gray-300 pb-6">ⓘ 灰色時段已有預約或事件</div>
                  </div>
                </>;
              })()}

            </div>
          </div>
        );
      })()}

      {/* ── Add Event Modal ─────────────────────────────────────────────────── */}
      {showAddEvt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => setShowAddEvt(false)} className="text-gray-400 text-xl w-8">✕</button>
              <h3 className="font-semibold text-gray-800">新增事件</h3>
              <button onClick={handleAddEvent} disabled={saving || !newEvent.title || !newEvent.staffId} className="text-[#8b6748] font-medium text-sm disabled:opacity-30">✓</button>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Staff */}
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-600 flex items-center gap-2">📋 服務人員</span>
                <select value={newEvent.staffId} onChange={e => setNewEvent(p => ({...p, staffId: e.target.value}))} className="text-sm text-gray-800 border-none outline-none bg-transparent">
                  <option value="">請選擇</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}｜{s.level}</option>)}
                </select>
              </div>
              {/* Event type */}
              <div className="px-5 py-4">
                <div className="text-sm text-gray-600 flex items-center gap-2 mb-3">📅 事件</div>
                <input
                  value={newEvent.title}
                  onChange={e => setNewEvent(p => ({...p, title: e.target.value}))}
                  placeholder="請輸入事件"
                  className="w-full text-sm border-none outline-none text-gray-800 placeholder-gray-300 mb-4"
                />
                <div className="text-xs text-gray-400 mb-2">快速選取</div>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_TYPES.map(et => (
                    <button
                      key={et}
                      onClick={() => setNewEvent(p => ({...p, title: et}))}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                        newEvent.title === et ? "bg-[#8b6748] border-[#8b6748] text-white" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {et}
                    </button>
                  ))}
                </div>
              </div>
              {/* Time */}
              <div className="px-5 py-4">
                <div className="text-sm text-gray-600 flex items-center gap-2 mb-3">🕐 時間</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">開始</span>
                    <select value={newEvent.startTime} onChange={e => setNewEvent(p => ({...p, startTime: e.target.value}))} className="text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{selectedDate.replace(/-/g,"/")} {t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">結束</span>
                    <select value={newEvent.endTime} onChange={e => setNewEvent(p => ({...p, endTime: e.target.value}))} className="text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{selectedDate.replace(/-/g,"/")} {t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
