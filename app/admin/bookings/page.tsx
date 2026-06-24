"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import {
  ADMIN_BOOKINGS,
  ADMIN_STAFF,
  ADMIN_STORES,
  ADMIN_CUSTOMERS,
  ADMIN_SERVICES,
  STAFF_EVENTS,
  BookingStatus,
  AdminBooking,
  PaymentMethod,
  StaffEvent,
} from "@/lib/adminMockData";

// ─── Grid constants ─────────────────────────────────────────────────────────
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 24 && m > 0) break;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 64;

const PAYMENT_METHODS: PaymentMethod[] = ["現金", "電子支付", "轉帳", "信用卡", "儲值金"];

const SERVICE_CODES: Record<string, string> = {
  SV01: "基礎",
  SV02: "精緻",
  SV03: "頂級",
  SV04: "訓練",
  SV05: "頻檢",
  SV06: "+20",
};

const DAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];

const PREV_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  已完成: "已確認",
  已取消: "已確認",
  爽約: "已確認",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekStart(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 7) * 60 + m;
}

function bookingStyle(time: string, duration: number): { top: number; height: number } {
  const startMin = timeToMinutes(time);
  const top = (startMin / 30) * ROW_HEIGHT;
  const height = Math.max((duration / 30) * ROW_HEIGHT - 4, ROW_HEIGHT - 4);
  return { top, height };
}

function getEndTime(time: string, duration: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function weekdayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const idx = d.getDay(); // 0=Sun
  return ["日", "一", "二", "三", "四", "五", "六"][idx];
}

// ─── Card color by status ────────────────────────────────────────────────────
function cardClasses(status: BookingStatus): string {
  switch (status) {
    case "待確認":
      return "bg-amber-50 border-amber-300";
    case "已確認":
      return "bg-rose-50 border-rose-200";
    case "已完成":
      return "bg-green-50 border-green-200";
    case "已取消":
      return "bg-gray-100 border-gray-200 opacity-50";
    case "爽約":
      return "bg-red-50 border-red-300";
    default:
      return "bg-rose-50 border-rose-200";
  }
}

// ─── Status chip ─────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    待確認: "bg-amber-100 text-amber-700",
    已確認: "bg-blue-100 text-blue-700",
    已完成: "bg-green-100 text-green-700",
    已取消: "bg-gray-200 text-gray-500",
    爽約: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full leading-none ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { user } = useAdmin();
  const today = new Date("2026-06-18");

  // ── State ──
  const [bookings, setBookings] = useState<AdminBooking[]>(ADMIN_BOOKINGS);
  const [selectedStoreId, setSelectedStoreId] = useState("ST01");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Filters
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "">("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  // Detail modal
  const [detailBooking, setDetailBooking] = useState<AdminBooking | null>(null);
  const [showNoteExpand, setShowNoteExpand] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Checkout sub-panel (inside detail modal)
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>("現金");
  const [showNegativeBalanceWarning, setShowNegativeBalanceWarning] = useState(false);

  // Edit service sub-modal
  const [showEditService, setShowEditService] = useState(false);
  const [editServiceName, setEditServiceName] = useState("");
  const [editDuration, setEditDuration] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editStaffId, setEditStaffId] = useState("");

  // More dropdown
  const [showMore, setShowMore] = useState(false);

  // Event management
  const [staffEvents, setStaffEvents] = useState<StaffEvent[]>(STAFF_EVENTS);
  const [showEventSection, setShowEventSection] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    staffId: "",
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    note: "",
  });

  // Add booking modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Copy booking
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copyMode, setCopyMode] = useState<"single" | "batch" | null>(null);
  // Single copy
  const [singleDate, setSingleDate] = useState("");
  const [singleTime, setSingleTime] = useState("");
  // Batch copy
  const [batchSelections, setBatchSelections] = useState<Array<{date: string; time: string}>>([]);
  const [batchCalYear, setBatchCalYear] = useState(2026);
  const [batchCalMonth, setBatchCalMonth] = useState(5); // 0-indexed, 5 = June

  // Customer search
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");

  if (!user) return null;

  const isStaff = user.role === "員工";
  const myStaff = ADMIN_STAFF.find((s) => s.username === user.username);

  // ── Week / day ──
  const weekStart = getWeekStart(today, weekOffset);
  const weekDays = getWeekDays(weekStart);
  const dateStr = formatDate(selectedDate);

  // ── Staff for selected store ──
  const storeStaff = isStaff
    ? myStaff
      ? [myStaff]
      : []
    : ADMIN_STAFF.filter((s) => s.storeId === selectedStoreId);

  const visibleStaff = filterStaff ? storeStaff.filter((s) => s.id === filterStaff) : storeStaff;

  // ── Day bookings ──
  const allDayBookings = bookings.filter((b) => b.date === dateStr);
  const storeBookings = isStaff
    ? allDayBookings.filter((b) => b.staffId === myStaff?.id)
    : allDayBookings.filter((b) => storeStaff.some((s) => s.id === b.staffId));

  const filterBooking = (b: AdminBooking) => {
    if (filterStatus && b.status !== filterStatus) return false;
    if (filterStaff && b.staffId !== filterStaff) return false;
    if (filterCustomer && b.customerName !== filterCustomer && b.customerPhone !== filterCustomer)
      return false;
    return true;
  };

  const staffBookingsFor = (staffId: string) =>
    storeBookings.filter((b) => b.staffId === staffId && filterBooking(b));

  const staffBookingCount = (staffId: string) =>
    storeBookings.filter((b) => b.staffId === staffId).length;

  // ── Customer search ──
  const matchedCustomers = customerQuery.trim()
    ? ADMIN_CUSTOMERS.filter(
        (c) =>
          c.name.includes(customerQuery.trim()) || c.phone.includes(customerQuery.trim())
      )
    : [];

  // ── Actions ──
  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    if (detailBooking?.id === id) setDetailBooking((prev) => prev ? { ...prev, status } : null);
  };

  const undoBooking = (b: AdminBooking) => {
    const prev = PREV_STATUS[b.status];
    if (!prev) return;
    setBookings((bks) =>
      bks.map((bk) =>
        bk.id === b.id
          ? { ...bk, status: prev, paymentMethod: prev === "已確認" ? "現金" : bk.paymentMethod }
          : bk
      )
    );
    setDetailBooking((d) =>
      d && d.id === b.id
        ? { ...d, status: prev, paymentMethod: prev === "已確認" ? "現金" : d.paymentMethod }
        : d
    );
  };

  const openCheckoutPanel = (b: AdminBooking) => {
    setCheckoutPayment(b.paymentMethod || "現金");
    setShowNegativeBalanceWarning(false);
    setShowCheckout(true);
    setShowMore(false);
  };

  const completeWithPayment = () => {
    if (!detailBooking) return;
    if (checkoutPayment === "儲值金" && !showNegativeBalanceWarning) {
      const customer = ADMIN_CUSTOMERS.find((c) => c.id === detailBooking.customerId);
      const balance = customer?.storedValue ?? 0;
      if (balance - detailBooking.price < 0) {
        setShowNegativeBalanceWarning(true);
        return;
      }
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === detailBooking.id
          ? { ...b, status: "已完成", paymentMethod: checkoutPayment }
          : b
      )
    );
    setDetailBooking((d) =>
      d ? { ...d, status: "已完成", paymentMethod: checkoutPayment } : null
    );
    setShowCheckout(false);
    setShowNegativeBalanceWarning(false);
  };

  const getCustomerBalance = (): number => {
    if (!detailBooking) return 0;
    return ADMIN_CUSTOMERS.find((c) => c.id === detailBooking.customerId)?.storedValue ?? 0;
  };

  const saveNote = () => {
    if (!detailBooking) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === detailBooking.id ? { ...b, notes: noteText } : b))
    );
    setDetailBooking((d) => (d ? { ...d, notes: noteText } : null));
  };

  const openDetail = (b: AdminBooking) => {
    setDetailBooking(b);
    setNoteText(b.notes);
    setShowNoteExpand(false);
    setShowCheckout(false);
    setShowMore(false);
    setShowEditService(false);
    setShowNegativeBalanceWarning(false);
  };

  const openEditServicePanel = (b: AdminBooking) => {
    setEditServiceName(b.serviceName);
    setEditDuration(b.duration);
    setEditPrice(b.price);
    setEditStaffId(b.staffId);
    setShowEditService(true);
    setShowMore(false);
  };

  const saveEditService = () => {
    if (!detailBooking) return;
    const newStaffMember = ADMIN_STAFF.find((s) => s.id === editStaffId);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === detailBooking.id
          ? {
              ...b,
              serviceName: editServiceName,
              duration: editDuration,
              price: editPrice,
              staffId: editStaffId,
              staffName: newStaffMember?.name || b.staffName,
            }
          : b
      )
    );
    setDetailBooking((d) =>
      d
        ? {
            ...d,
            serviceName: editServiceName,
            duration: editDuration,
            price: editPrice,
            staffId: editStaffId,
            staffName: newStaffMember?.name || d.staffName,
          }
        : null
    );
    setShowEditService(false);
  };

  const executeSingleCopy = () => {
    if (!detailBooking || !singleDate || !singleTime) return;
    const newId = `BK${Date.now()}`;
    const newBooking: AdminBooking = {
      ...detailBooking,
      id: newId,
      date: singleDate,
      time: singleTime,
      status: "已確認",
      paymentMethod: "現金",
      notes: detailBooking.notes,
    };
    setBookings(prev => [...prev, newBooking]);
    setCopyMode(null);
    setShowCopyMenu(false);
  };

  const executeBatchCopy = () => {
    if (!detailBooking || batchSelections.length === 0) return;
    const newBookings: AdminBooking[] = batchSelections.map((sel, i) => ({
      ...detailBooking,
      id: `BK${Date.now()}${i}`,
      date: sel.date,
      time: sel.time,
      status: "已確認" as BookingStatus,
      paymentMethod: "現金" as PaymentMethod,
      notes: detailBooking.notes,
    }));
    setBookings(prev => [...prev, ...newBookings]);
    setCopyMode(null);
    setShowCopyMenu(false);
    setBatchSelections([]);
  };

  const isActive = (b: AdminBooking) => b.status === "待確認" || b.status === "已確認";
  const canUndo = (b: AdminBooking) => !!PREV_STATUS[b.status];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* ── Page header ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[#1c1c1c]">預約管理</h1>
          <button
            onClick={() => { setShowCustomerSearch(true); setCustomerQuery(""); }}
            className="p-2 border border-[#e8ddd2] rounded-xl text-[#8a7a6e] text-sm hover:border-[#8b6748] transition-colors"
          >
            🔍 查詢會員
          </button>
        </div>
        <div className="flex gap-2">
          {!isStaff && (
            <button
              onClick={() => setShowEventSection((v) => !v)}
              className="px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-sm"
            >
              🗓 事件管理
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm"
          >
            ＋ 臨時預約
          </button>
        </div>
      </div>

      {/* ── Event management section ── */}
      {showEventSection && !isStaff && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-medium text-[#1c1c1c]">事件管理</h2>
              <p className="text-xs text-[#8a7a6e] mt-0.5">
                設定後，前台客人在該時段無法預約該職人
              </p>
            </div>
            <button
              onClick={() => {
                setNewEvent({
                  staffId: ADMIN_STAFF[0]?.id ?? "",
                  date: "",
                  startTime: "",
                  endTime: "",
                  title: "",
                  note: "",
                });
                setShowAddEventModal(true);
              }}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg"
            >
              + 新增事件
            </button>
          </div>
          {staffEvents.length === 0 ? (
            <p className="text-sm text-[#8a7a6e] text-center py-3">尚無事件記錄</p>
          ) : (
            <div className="space-y-2">
              {staffEvents.map((ev) => {
                const s = ADMIN_STAFF.find((st) => st.id === ev.staffId);
                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-xl border border-indigo-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-indigo-900">{ev.title}</div>
                        <div className="text-xs text-indigo-500">
                          {s?.name} · {ev.date} {ev.startTime}–{ev.endTime}
                        </div>
                        {ev.note && (
                          <div className="text-xs text-indigo-400">{ev.note}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setStaffEvents((prev) => prev.filter((e) => e.id !== ev.id))
                      }
                      className="text-indigo-300 hover:text-indigo-600 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Store tabs ── */}
      {!isStaff && (
        <div className="flex gap-2 mb-4">
          {ADMIN_STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
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

      {/* ── Week navigation + day selector ── */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 rounded-lg border border-[#e8ddd2] text-[#8a7a6e] text-sm disabled:opacity-30"
          >
            ‹ 上週
          </button>
          <span className="text-sm font-medium text-[#1c1c1c]">
            {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} –{" "}
            {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(8, o + 1))}
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
            const cnt = bookings.filter(
              (b) =>
                b.date === dStr &&
                (isStaff
                  ? b.staffId === myStaff?.id
                  : storeStaff.some((s) => s.id === b.staffId))
            ).length;
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
                  <span
                    className={`text-[9px] mt-0.5 ${
                      isSelected ? "text-white/70" : "text-[#8b6748]"
                    }`}
                  >
                    {cnt}件
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as BookingStatus | "")}
          className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
        >
          <option value="">所有狀態</option>
          {(["待確認", "已確認", "已完成", "已取消", "爽約"] as BookingStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {!isStaff && (
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
          >
            <option value="">所有員工</option>
            {storeStaff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {filterCustomer && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b6748] font-medium">篩選會員：{filterCustomer}</span>
            <button
              onClick={() => setFilterCustomer("")}
              className="text-xs text-[#8a7a6e] hover:text-[#8b6748] underline"
            >
              清除
            </button>
          </div>
        )}

        {(filterStatus || filterStaff || filterCustomer) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterStaff(""); setFilterCustomer(""); }}
            className="text-xs text-[#8a7a6e] hover:text-[#8b6748] ml-auto"
          >
            清除篩選
          </button>
        )}
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="flex"
            style={{ minWidth: `${64 + visibleStaff.length * 160}px` }}
          >
            {/* Time axis */}
            <div className="flex-shrink-0 w-16 border-r border-[#e8ddd2]">
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-[#e8ddd2]" />
              {TIME_SLOTS.map((time) => (
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
            {visibleStaff.map((staff) => {
              const cnt = staffBookingCount(staff.id);
              const staffBookings = staffBookingsFor(staff.id);
              return (
                <div
                  key={staff.id}
                  className="flex-shrink-0 border-r border-[#e8ddd2] last:border-r-0"
                  style={{ width: 160 }}
                >
                  {/* Column header */}
                  <button
                    onClick={() =>
                      setFilterStaff(filterStaff === staff.id ? "" : staff.id)
                    }
                    style={{ height: HEADER_HEIGHT }}
                    className={`w-full flex flex-col items-center justify-center border-b border-[#e8ddd2] px-2 transition-colors hover:bg-[#faf7f2] ${
                      filterStaff === staff.id ? "bg-[#faf7f2]" : "bg-white"
                    }`}
                  >
                    <span className="text-sm font-medium text-[#1c1c1c] leading-tight">
                      {staff.name}
                    </span>
                    <span className="text-[10px] text-[#8a7a6e] leading-tight">
                      {staff.displayLevel}
                    </span>
                    <span className="text-[10px] text-[#8b6748] mt-0.5">{cnt} 件 ▾</span>
                  </button>

                  {/* Column body */}
                  <div className="relative" style={{ height: TIME_SLOTS.length * ROW_HEIGHT }}>
                    {/* Background rows */}
                    {TIME_SLOTS.map((time) => (
                      <div
                        key={time}
                        style={{ height: ROW_HEIGHT }}
                        className="border-b border-[#f0ebe4]"
                      />
                    ))}

                    {/* Booking cards */}
                    {staffBookings.map((b) => {
                      const style = bookingStyle(b.time, b.duration);
                      const endStr = getEndTime(b.time, b.duration);
                      const serviceCode = SERVICE_CODES[b.serviceId] || b.serviceId;
                      return (
                        <button
                          key={b.id}
                          onClick={() => openDetail(b)}
                          style={{
                            position: "absolute",
                            top: style.top,
                            height: style.height,
                            left: 4,
                            right: 4,
                          }}
                          className={`rounded-lg border px-2 py-1 overflow-hidden shadow-sm text-left w-auto ${cardClasses(b.status)}`}
                        >
                          <div className="text-[10px] text-gray-400 leading-none mb-0.5">
                            {b.time}–{endStr}
                          </div>
                          <div className="text-[11px] font-medium text-gray-800 leading-tight truncate">
                            {b.customerName}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/60 text-gray-600 leading-none">
                              {serviceCode}
                            </span>
                            <StatusChip status={b.status} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Booking detail modal ── */}
      {detailBooking && (
        <>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e8ddd2] flex-shrink-0">
              <button
                onClick={() => { setDetailBooking(null); setShowEditService(false); setShowCheckout(false); }}
                className="text-[#8a7a6e] text-sm"
              >
                ✕
              </button>
              <div className="text-center">
                <span className="text-xs text-[#8a7a6e]">網路預約 · {detailBooking.date} {detailBooking.time}</span>
              </div>
              <span className="text-[10px] text-[#8a7a6e] font-mono">{detailBooking.id}</span>
            </div>

            {/* Edit service sub-panel */}
            {showEditService ? (
              <div className="px-5 py-4 flex-1">
                <h3 className="text-base font-medium text-[#1c1c1c] mb-1">更改預約項目</h3>
                <p className="text-sm text-[#8a7a6e] mb-4">
                  {detailBooking.customerName} · {detailBooking.date}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#8a7a6e] mb-1 block">服務項目</label>
                    <select
                      value={editServiceName}
                      onChange={(e) => {
                        setEditServiceName(e.target.value);
                        const svc = ADMIN_SERVICES.find((s) => s.name === e.target.value);
                        if (svc) { setEditDuration(svc.duration); setEditPrice(svc.priceRegular); }
                      }}
                      className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                    >
                      {ADMIN_SERVICES.map((s) => (
                        <option key={s.id} value={s.name}>{s.name} ({s.duration}分)</option>
                      ))}
                      <option value={editServiceName}>{editServiceName}（自訂）</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#8a7a6e] mb-1 block">技師</label>
                    <select
                      value={editStaffId}
                      onChange={(e) => setEditStaffId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                    >
                      {ADMIN_STAFF.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.internalLevel})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#8a7a6e] mb-1 block">時長（分鐘）</label>
                      <input
                        type="number" min={10} step={10} value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8a7a6e] mb-1 block">金額（元）</label>
                      <input
                        type="number" min={0} value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                      />
                    </div>
                  </div>
                  {editPrice !== detailBooking.price && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                      金額由 ${detailBooking.price.toLocaleString()} 改為 ${editPrice.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowEditService(false)}
                    className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveEditService}
                    className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
                  >
                    確認更改
                  </button>
                </div>
              </div>
            ) : showCheckout ? (
              /* Checkout sub-panel */
              <div className="px-5 py-4 flex-1">
                {showNegativeBalanceWarning ? (
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-3xl mb-2">⚠️</div>
                      <h3 className="text-base font-semibold text-red-700 mb-1">儲值金不足，將產生負數</h3>
                      <p className="text-sm text-[#8a7a6e]">
                        {detailBooking.customerName} 的儲值餘額為{" "}
                        <span className="font-semibold text-[#1c1c1c]">${getCustomerBalance().toLocaleString()}</span>，
                        扣除本次消費{" "}
                        <span className="font-semibold text-[#8b6748]">
                          ${detailBooking.price.toLocaleString()}
                        </span>{" "}
                        後，儲值金將為：
                      </p>
                      <div className="mt-3 py-3 bg-red-50 rounded-xl border border-red-200">
                        <span className="text-2xl font-bold text-red-600">
                          -$
                          {Math.abs(
                            getCustomerBalance() - detailBooking.price
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#8a7a6e] mt-3">確定要繼續結帳嗎？客人欠款需另行補繳。</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowNegativeBalanceWarning(false)}
                        className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
                      >
                        返回修改
                      </button>
                      <button
                        onClick={completeWithPayment}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold"
                      >
                        確定結帳（負數）
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-medium text-[#1c1c1c] mb-1">
                      {detailBooking.status === "已完成" ? "更改付款方式" : "結帳確認"}
                    </h3>
                    <p className="text-sm text-[#8a7a6e] mb-4">
                      {detailBooking.customerName} · {detailBooking.serviceName}
                      <span className="ml-2 text-[#8b6748] font-medium">
                        ${detailBooking.price.toLocaleString()}
                      </span>
                    </p>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-[#1c1c1c] mb-3 block">付款方式</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            onClick={() => setCheckoutPayment(m)}
                            className={`py-2.5 rounded-xl text-sm border transition-colors ${
                              checkoutPayment === m
                                ? "bg-[#8b6748] text-white border-[#8b6748]"
                                : "bg-[#faf7f2] text-[#1c1c1c] border-[#e8ddd2]"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      {checkoutPayment === "儲值金" && (() => {
                        const balance = getCustomerBalance();
                        const after = balance - detailBooking.price;
                        return (
                          <div
                            className={`mt-3 px-3 py-2 rounded-xl text-xs ${
                              after < 0
                                ? "bg-red-50 border border-red-200 text-red-700"
                                : "bg-[#faf7f2] text-[#8a7a6e]"
                            }`}
                          >
                            <div className="flex justify-between">
                              <span>目前儲值餘額</span>
                              <span className="font-medium">${balance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>扣除後餘額</span>
                              <span
                                className={`font-semibold ${
                                  after < 0 ? "text-red-600" : "text-green-700"
                                }`}
                              >
                                {after < 0
                                  ? `-$${Math.abs(after).toLocaleString()}`
                                  : `$${after.toLocaleString()}`}
                              </span>
                            </div>
                            {after < 0 && (
                              <p className="mt-1 text-red-600 font-medium">
                                ⚠ 儲值金不足，結帳後將為負數
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowCheckout(false); setShowNegativeBalanceWarning(false); }}
                        className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
                      >
                        取消
                      </button>
                      <button
                        onClick={completeWithPayment}
                        className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
                      >
                        確認完成
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Main detail content */
              <div className="px-5 py-4 flex-1 space-y-4">
                {/* Customer name + phone */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[#1c1c1c]">{detailBooking.customerName}</span>
                    {(() => {
                      const cust = ADMIN_CUSTOMERS.find(c => c.id === detailBooking.customerId);
                      return cust?.hasLine ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#06c755] text-white leading-none">LINE</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="text-sm text-[#8a7a6e]">{detailBooking.customerPhone}</div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (isActive(detailBooking)) return;
                      updateStatus(detailBooking.id, "已確認");
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                      isActive(detailBooking)
                        ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                        : "bg-[#faf7f2] border-[#e8ddd2] text-[#8a7a6e]"
                    }`}
                  >
                    尚未到來
                  </button>
                  <button
                    onClick={() => {
                      if (detailBooking.status !== "已完成") {
                        openCheckoutPanel(detailBooking);
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                      detailBooking.status === "已完成"
                        ? "bg-green-100 border-green-300 text-green-700 font-medium"
                        : "bg-[#faf7f2] border-[#e8ddd2] text-[#8a7a6e]"
                    }`}
                  >
                    已報到
                  </button>
                  <button
                    onClick={() => updateStatus(detailBooking.id, "爽約")}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                      detailBooking.status === "爽約"
                        ? "bg-gray-200 border-gray-400 text-gray-700 font-medium"
                        : "bg-[#faf7f2] border-[#e8ddd2] text-[#8a7a6e]"
                    }`}
                  >
                    爽約
                  </button>
                </div>

                <hr className="border-[#e8ddd2]" />

                {/* Booking info */}
                <div className="space-y-1.5 text-sm text-[#1c1c1c]">
                  <div className="text-xs text-[#8a7a6e]">門市：{detailBooking.storeName}</div>
                  <div className="text-xs text-[#8a7a6e]">
                    {detailBooking.date} 週{weekdayLabel(detailBooking.date)}{" "}
                    {detailBooking.time}–{getEndTime(detailBooking.time, detailBooking.duration)}
                  </div>
                  <div className="text-xs text-[#8a7a6e]">
                    總計 {detailBooking.duration} 分鐘 / NT${detailBooking.price.toLocaleString()}
                  </div>
                  {detailBooking.status === "已完成" && detailBooking.paymentMethod && (
                    <div className="text-xs text-[#8a7a6e]">
                      付款方式：
                      <span className="text-[#8b6748] font-medium">{detailBooking.paymentMethod}</span>
                    </div>
                  )}
                  <div className="text-xs text-[#1c1c1c] font-medium mt-1">
                    服務人員：{detailBooking.staffName}
                  </div>
                  <div className="text-xs text-[#8a7a6e]">服務：{detailBooking.serviceName}</div>
                </div>

                {/* Notes */}
                <div>
                  <button
                    onClick={() => setShowNoteExpand((v) => !v)}
                    className="flex items-center gap-1 text-xs text-[#8a7a6e] hover:text-[#8b6748]"
                  >
                    <span>備註（僅商家可見）</span>
                    <span>{showNoteExpand ? "▴" : "▾"}</span>
                    {detailBooking.notes && !showNoteExpand && (
                      <span className="ml-1 text-[#8b6748]">•</span>
                    )}
                  </button>
                  {showNoteExpand && (
                    <div className="mt-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                        placeholder="輸入備註內容…"
                        className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] resize-none"
                      />
                      <button
                        onClick={saveNote}
                        className="mt-1 px-3 py-1.5 bg-[#8b6748] text-white rounded-lg text-xs"
                      >
                        儲存備註
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Bottom action bar (only when main view) ── */}
            {!showEditService && !showCheckout && (
              <div className="flex-shrink-0 border-t border-[#e8ddd2] px-4 py-3 flex items-center gap-2">
                {/* LINE notification status indicator */}
                {(() => {
                  const cust = ADMIN_CUSTOMERS.find(c => c.id === detailBooking.customerId);
                  const hasLine = cust?.hasLine ?? false;
                  const notified = detailBooking.lineNotified ?? false;
                  const title = !hasLine
                    ? "客人未綁定 LINE，無法發送訊息"
                    : notified
                    ? "已於預約前24小時自動發送 LINE 通知"
                    : "尚未發送 LINE 通知（系統將於預約前24小時自動發送）";
                  return (
                    <div
                      className="flex flex-col items-center p-2 rounded-xl border border-[#e8ddd2] cursor-default select-none"
                      title={title}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={!hasLine ? "#d1d5db" : notified ? "#facc15" : "#d1d5db"}>
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                      <span className="text-[9px] leading-none mt-0.5 text-[#8a7a6e]">通知</span>
                    </div>
                  );
                })()}

                {/* Edit service */}
                <button
                  onClick={() => openEditServicePanel(detailBooking)}
                  className="p-2 rounded-xl border border-[#e8ddd2] text-[#8a7a6e] text-sm hover:bg-[#faf7f2]"
                  title="更改項目"
                >
                  ✏️
                </button>

                {/* Copy */}
                <div className="relative">
                  <button
                    onClick={() => { setShowCopyMenu(v => !v); setShowMore(false); }}
                    className="flex flex-col items-center p-2 rounded-xl border border-[#e8ddd2] text-[#8a7a6e] text-sm hover:bg-[#faf7f2]"
                    title="複製預約"
                  >
                    📋
                    <span className="text-[9px] leading-none mt-0.5">複製</span>
                  </button>
                  {showCopyMenu && (
                    <div className="absolute bottom-12 left-0 bg-white border border-[#e8ddd2] rounded-xl shadow-lg py-1 w-32 z-10">
                      <button
                        onClick={() => { setSingleDate(detailBooking.date); setSingleTime(detailBooking.time); setCopyMode("single"); setShowCopyMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#1c1c1c] hover:bg-[#faf7f2]"
                      >
                        單次複製
                      </button>
                      <button
                        onClick={() => { setBatchSelections([]); setCopyMode("batch"); setShowCopyMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#1c1c1c] hover:bg-[#faf7f2]"
                      >
                        批次複製
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1" />

                {/* Cancel (active only) */}
                {isActive(detailBooking) && (
                  <button
                    onClick={() => updateStatus(detailBooking.id, "已取消")}
                    className="px-3 py-2 rounded-xl text-sm border border-red-200 bg-red-50 text-red-600"
                  >
                    取消
                  </button>
                )}

                {/* Undo (completed/cancelled/爽約) */}
                {canUndo(detailBooking) && (
                  <button
                    onClick={() => undoBooking(detailBooking)}
                    className="px-3 py-2 rounded-xl text-sm border border-amber-200 bg-amber-50 text-amber-700"
                  >
                    ↩ 撤銷
                  </button>
                )}

                {/* Checkout (active) */}
                {isActive(detailBooking) && (
                  <button
                    onClick={() => openCheckoutPanel(detailBooking)}
                    className="px-3 py-2 rounded-xl text-sm bg-green-600 text-white font-medium"
                  >
                    完成結帳
                  </button>
                )}

                {/* More (three-dot) */}
                <div className="relative">
                  <button
                    onClick={() => setShowMore((v) => !v)}
                    className="p-2 rounded-xl border border-[#e8ddd2] text-[#8a7a6e] text-sm hover:bg-[#faf7f2]"
                  >
                    ···
                  </button>
                  {showMore && (
                    <div className="absolute bottom-10 right-0 bg-white border border-[#e8ddd2] rounded-xl shadow-lg py-1 w-40 z-10">
                      {detailBooking.status === "已完成" && (
                        <button
                          onClick={() => openCheckoutPanel(detailBooking)}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#1c1c1c] hover:bg-[#faf7f2]"
                        >
                          更改付款方式
                        </button>
                      )}
                      {isActive(detailBooking) && (
                        <button
                          onClick={() => { updateStatus(detailBooking.id, "爽約"); setShowMore(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          爽約
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single copy modal */}
        {copyMode === "single" && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center">
            <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCopyMode(null)} className="text-[#8a7a6e]">✕</button>
                <h3 className="text-base font-semibold text-[#1c1c1c]">單次複製</h3>
                <button onClick={executeSingleCopy} className="text-[#8b6748] font-medium text-sm">✓ 確認</button>
              </div>
              <p className="text-xs text-[#8a7a6e] mb-4">複製「{detailBooking!.customerName}」的預約至以下時段</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">日期</label>
                  <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">時間</label>
                  <input type="time" value={singleTime} onChange={e => setSingleTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
              </div>
              <p className="text-xs text-[#8a7a6e] mt-4">複製後狀態為「已確認」，可在預約管理中找到</p>
            </div>
          </div>
        )}

        {/* Batch copy modal */}
        {copyMode === "batch" && (() => {
          const year = batchCalYear;
          const month = batchCalMonth;
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const calCells: (number | null)[] = [];
          const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
          for (let i = 0; i < mondayOffset; i++) calCells.push(null);
          for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

          const toggleBatchDate = (day: number) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const existing = batchSelections.findIndex(s => s.date === dateStr);
            if (existing >= 0) {
              setBatchSelections(prev => prev.filter((_, i) => i !== existing));
            } else {
              setBatchSelections(prev => [...prev, { date: dateStr, time: detailBooking!.time }]);
            }
          };

          const isSelected = (day: number) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return batchSelections.some(s => s.date === dateStr);
          };

          return (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center">
              <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e8ddd2]">
                  <button onClick={() => { setCopyMode(null); setBatchSelections([]); }} className="text-[#8a7a6e]">✕</button>
                  <h3 className="text-base font-semibold text-[#1c1c1c]">批次複製</h3>
                  <button onClick={executeBatchCopy} disabled={batchSelections.length === 0}
                    className={`text-sm font-medium ${batchSelections.length > 0 ? "text-[#8b6748]" : "text-gray-300"}`}>
                    ✓ 確認
                  </button>
                </div>

                {/* Calendar */}
                <div className="px-4 py-3">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        if (month === 0) { setBatchCalYear(y => y - 1); setBatchCalMonth(11); }
                        else setBatchCalMonth(m => m - 1);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    >←</button>
                    <span className="text-sm font-semibold text-[#1c1c1c]">
                      {month + 1}月 {year}
                    </span>
                    <button
                      onClick={() => {
                        if (month === 11) { setBatchCalYear(y => y + 1); setBatchCalMonth(0); }
                        else setBatchCalMonth(m => m + 1);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    >→</button>
                  </div>
                  {/* Day headers Mon-Sun */}
                  <div className="grid grid-cols-7 mb-1">
                    {["一","二","三","四","五","六","日"].map(d => (
                      <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
                    ))}
                  </div>
                  {/* Days */}
                  <div className="grid grid-cols-7 gap-y-1">
                    {calCells.map((day, i) => {
                      if (!day) return <div key={`e${i}`} />;
                      const sel = isSelected(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleBatchDate(day)}
                          className={`h-9 w-full rounded-full text-sm font-medium transition-all ${
                            sel ? "bg-rose-500 text-white" : "hover:bg-gray-100 text-[#1c1c1c]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected list */}
                {batchSelections.length > 0 && (
                  <div className="px-4 pb-5">
                    <p className="text-xs text-[#8a7a6e] mb-2">複製此預約至</p>
                    <div className="space-y-2">
                      {[...batchSelections]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((sel) => (
                        <div key={sel.date} className="flex items-center justify-between py-2.5 border-b border-[#e8ddd2]">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setBatchSelections(prev => prev.filter(s => s.date !== sel.date))}
                              className="text-rose-400 hover:text-rose-600"
                            >
                              ⊖
                            </button>
                            <span className="text-sm text-[#1c1c1c]">{sel.date.replace(/-/g, "/")}</span>
                          </div>
                          <input
                            type="time"
                            value={sel.time}
                            onChange={e => setBatchSelections(prev =>
                              prev.map(s => s.date === sel.date ? { ...s, time: e.target.value } : s)
                            )}
                            className="text-sm text-rose-500 border-0 focus:outline-none bg-transparent font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        </>
      )}

      {/* ── Customer search modal ── */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">查詢會員</h3>
            <input
              autoFocus
              type="text"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="輸入姓名或電話搜尋…"
              className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] mb-3"
            />
            {customerQuery.trim() && (
              <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
                {matchedCustomers.length === 0 ? (
                  <p className="text-sm text-[#8a7a6e] text-center py-4">無符合結果</p>
                ) : (
                  matchedCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setFilterCustomer(c.name);
                        setShowCustomerSearch(false);
                        setCustomerQuery("");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#e8ddd2] hover:border-[#8b6748] text-left transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-[#1c1c1c]">{c.name}</span>
                        {c.bodyNotes && c.bodyNotes.trim() && (
                          <span className="text-red-500 text-xs" title={c.bodyNotes}>❗</span>
                        )}
                        <span
                          className={`ml-1 text-xs px-2 py-0.5 rounded-full border ${
                            c.memberTier === "白金會員"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : c.memberTier === "黃金會員"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {c.memberTier}
                        </span>
                      </div>
                      <span className="text-xs text-[#8a7a6e]">{c.phone}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            <button
              onClick={() => { setShowCustomerSearch(false); setCustomerQuery(""); }}
              className="w-full py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* ── Add event modal ── */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增事件</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">職人</label>
                <select
                  value={newEvent.staffId}
                  onChange={(e) => setNewEvent((p) => ({ ...p, staffId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  {ADMIN_STAFF.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">日期</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#8a7a6e] mb-1 block">開始時間</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#8a7a6e] mb-1 block">結束時間</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">事件類型</label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {["外出", "休假", "會議", "培訓", "私事"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setNewEvent((p) => ({ ...p, title: preset }))}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                        newEvent.title === preset
                          ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="或輸入自訂名稱"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">備註（選填）</label>
                <input
                  type="text"
                  placeholder="備註說明"
                  value={newEvent.note}
                  onChange={(e) => setNewEvent((p) => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newEvent.staffId || !newEvent.date || !newEvent.startTime || !newEvent.endTime || !newEvent.title) return;
                  const id = `EV${Date.now()}`;
                  setStaffEvents((prev) => [
                    ...prev,
                    {
                      id,
                      staffId: newEvent.staffId,
                      date: newEvent.date,
                      startTime: newEvent.startTime,
                      endTime: newEvent.endTime,
                      title: newEvent.title,
                      note: newEvent.note || undefined,
                    },
                  ]);
                  setShowAddEventModal(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add booking modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增臨時預約</h3>
            <p className="text-sm text-[#8a7a6e] mb-4">此功能可手動建立預約記錄（示意介面）</p>
            <div className="space-y-3">
              <input
                placeholder="客戶姓名"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
              <input
                placeholder="客戶電話"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
              <input
                type="time"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
              >
                取消
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
