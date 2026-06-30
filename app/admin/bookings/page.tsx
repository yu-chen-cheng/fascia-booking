"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const BOOKING_SERVICES = [
  { id: "basic-60",    name: "基礎筋膜放鬆",     duration: 60,  price: 2500 },
  { id: "refined-90",  name: "精緻筋膜調理",     duration: 90,  price: 3200 },
  { id: "premium-120", name: "頂級筋膜結構整合", duration: 120, price: 3800 },
  { id: "training-50", name: "一對一功能式訓練", duration: 50,  price: 2500 },
  { id: "frequency-40",name: "頻率檢測",         duration: 40,  price: 2500 },
];

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

const STATUS_LABEL: Record<BookingStatus, { text: string; color: string; bg: string }> = {
  pending:   { text: "待確認", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  confirmed: { text: "已確認", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  completed: { text: "已完成", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled: { text: "已取消", color: "text-gray-500",   bg: "bg-gray-50 border-gray-200 opacity-60" },
  no_show:   { text: "爽約",   color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

// Cell background colors for grid view
const STATUS_CELL_BG: Record<BookingStatus, string> = {
  pending:   "bg-amber-100 border-amber-300",
  confirmed: "bg-blue-100 border-blue-300",
  completed: "bg-green-100 border-green-300",
  cancelled: "bg-gray-100 border-gray-300 opacity-60",
  no_show:   "bg-red-100 border-red-300",
};

const DAY_CN = ["日","一","二","三","四","五","六"];

// Store ID legacy mapping
const LEGACY_ID_MAP: Record<string, string> = {
  ST01: "xiaoJudan",
  ST02: "daan",
  ST03: "banqiao",
};

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
  service_name?: string;
  customers?: { id: string; name: string; phone: string; line_user_id: string | null };
  staff?: { id: string; name: string } | null;
}

interface StaffProfile {
  id: string;
  name: string;
  branch_id: string;
}

// Generate time slots every 30 min from 10:00 to 21:00
const TIME_SLOTS: string[] = [];
for (let h = 10; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 21) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateCN(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_CN[d.getDay()]}）`;
}

function shiftDate(ymd: string, delta: number): string {
  const d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toYMD(d);
}

export default function BookingsPage() {
  const { user, activeBranchId } = useAdmin();
  const todayYMD = toYMD(new Date());

  const isStaff = user?.role === "員工";
  const canManageAll = user?.role === "管理者" || user?.role === "店長" || user?.role === "會計";

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: "", phone: "", staffId: "", timeSlot: "10:00",
    serviceName: "", totalPrice: 0, notes: "",
  });

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("staff_profiles")
      .select("id,name,branch_id,level")
      .eq("branch_id", activeBranchId)
      .eq("is_active", true)
      .order("name");
    setStaffList(data ?? []);
  }, [activeBranchId]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const legacyId = LEGACY_ID_MAP[activeBranchId];

    let q = supabase
      .from("bookings")
      .select("*, customers(id,name,phone,line_user_id)")
      .eq("date", selectedDate)
      .order("time_slot");

    if (legacyId) {
      q = q.or(`store_id.eq.${activeBranchId},store_id.eq.${legacyId}`);
    } else {
      q = q.eq("store_id", activeBranchId);
    }

    if (isStaff) {
      q = q.eq("staff_id", user?.id ?? "");
    }

    const { data } = await q;

    const enriched = (data ?? []).map((b: Booking) => ({
      ...b,
      staff: staffList.find(s => s.id === b.staff_id) ?? null,
    }));
    setBookings(enriched);
    setLoading(false);
  }, [selectedDate, activeBranchId, isStaff, user?.id, staffList]);

  useEffect(() => { fetchStaff(); }, [activeBranchId]);
  useEffect(() => { fetchBookings(); }, [selectedDate, staffList]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setSaving(true);
    await supabase.from("bookings").update({ status }).eq("id", id);
    await fetchBookings();
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : null);
    setSaving(false);
  };

  const saveNote = async () => {
    if (!detail) return;
    setSaving(true);
    await supabase.from("bookings").update({ notes: noteText }).eq("id", detail.id);
    await fetchBookings();
    setDetail(prev => prev ? { ...prev, notes: noteText } : null);
    setSaving(false);
  };

  const handleAddBooking = async () => {
    if (!newBooking.customerName || !newBooking.timeSlot) return;
    setSaving(true);

    let customerId: string | null = null;
    if (newBooking.phone) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", newBooking.phone)
        .maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("customers")
          .insert({ name: newBooking.customerName, phone: newBooking.phone })
          .select("id")
          .single();
        customerId = created?.id ?? null;
      }
    }

    await supabase.from("bookings").insert({
      customer_id: customerId,
      store_id: activeBranchId,
      staff_id: newBooking.staffId || null,
      date: selectedDate,
      time_slot: newBooking.timeSlot,
      status: "confirmed",
      total_price: newBooking.totalPrice,
      notes: newBooking.notes || null,
      symptoms: [],
    });

    await fetchBookings();
    setShowAddModal(false);
    setNewBooking({ customerName: "", phone: "", staffId: "", timeSlot: "10:00", serviceName: "", totalPrice: 0, notes: "" });
    setSaving(false);
  };

  const openDetail = (b: Booking) => {
    setDetail(b);
    setNoteText(b.notes ?? "");
  };

  const openAddModal = (staffId: string, timeSlot: string) => {
    setNewBooking(prev => ({ ...prev, staffId, timeSlot }));
    setShowAddModal(true);
  };

  // Build grid columns: staff columns + "未指定" column
  const gridColumns = [
    ...staffList,
    { id: "__unassigned__", name: "未指定", branch_id: activeBranchId },
  ];

  // Index bookings by time_slot + staff_id for O(1) lookup
  const bookingMap: Record<string, Booking[]> = {};
  for (const b of bookings) {
    const key = `${b.time_slot}__${b.staff_id ?? "__unassigned__"}`;
    if (!bookingMap[key]) bookingMap[key] = [];
    bookingMap[key].push(b);
  }

  const totalCount = bookings.filter(b => b.status !== "cancelled").length;

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">預約管理</h1>
          <p className="text-xs text-[#8a7a6e] mt-0.5">
            {formatDateCN(selectedDate)} · 共 {totalCount} 筆
          </p>
        </div>
        {canManageAll && (
          <button
            onClick={() => { setNewBooking(prev => ({ ...prev, staffId: "", timeSlot: "10:00" })); setShowAddModal(true); }}
            className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
          >
            + 新增預約
          </button>
        )}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSelectedDate(d => shiftDate(d, -1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ddd2] bg-white text-[#8b6748] text-lg hover:bg-[#faf7f2]"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold text-[#1c1c1c]">{formatDateCN(selectedDate)}</span>
          {selectedDate !== todayYMD && (
            <button
              onClick={() => setSelectedDate(todayYMD)}
              className="ml-2 text-xs text-[#8b6748] underline"
            >
              回今天
            </button>
          )}
        </div>
        <button
          onClick={() => setSelectedDate(d => shiftDate(d, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ddd2] bg-white text-[#8b6748] text-lg hover:bg-[#faf7f2]"
        >
          ›
        </button>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="text-center py-16 text-sm text-[#8a7a6e]">載入中…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e8ddd2] bg-white">
          <table className="min-w-max w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e8ddd2]">
                {/* Time column header */}
                <th className="sticky left-0 z-10 bg-[#faf7f2] px-3 py-2.5 text-left font-medium text-[#8a7a6e] w-16 border-r border-[#e8ddd2]">
                  時間
                </th>
                {gridColumns.map(col => (
                  <th
                    key={col.id}
                    className="px-3 py-2.5 text-center font-medium text-[#1c1c1c] min-w-[110px] border-r border-[#e8ddd2] last:border-r-0"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, rowIdx) => (
                <tr
                  key={slot}
                  className={`border-b border-[#e8ddd2] last:border-b-0 ${rowIdx % 2 === 0 ? "bg-white" : "bg-[#fdfcfb]"}`}
                >
                  {/* Time label */}
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-[#8a7a6e] font-mono border-r border-[#e8ddd2] whitespace-nowrap">
                    {slot}
                  </td>
                  {gridColumns.map(col => {
                    const key = `${slot}__${col.id}`;
                    const cellBookings = bookingMap[key] ?? [];
                    const isUnassigned = col.id === "__unassigned__";

                    return (
                      <td
                        key={col.id}
                        className="px-1.5 py-1 border-r border-[#e8ddd2] last:border-r-0 align-top"
                        style={{ minWidth: 110 }}
                      >
                        <div className="flex flex-col gap-0.5">
                          {cellBookings.map(b => {
                            const s = STATUS_LABEL[b.status];
                            return (
                              <button
                                key={b.id}
                                onClick={() => openDetail(b)}
                                className={`w-full text-left px-2 py-1 rounded-lg border text-xs leading-tight transition-opacity hover:opacity-80 ${STATUS_CELL_BG[b.status]}`}
                              >
                                <div className="font-medium text-[#1c1c1c] truncate">
                                  {b.customers?.name ?? "訪客"}
                                </div>
                                <div className={`text-[10px] ${s.color}`}>{s.text}</div>
                              </button>
                            );
                          })}
                          {/* Empty cell: click to add */}
                          {canManageAll && cellBookings.length === 0 && (
                            <button
                              onClick={() => openAddModal(isUnassigned ? "" : col.id, slot)}
                              className="w-full h-7 rounded-lg border border-dashed border-[#e8ddd2] text-[#c8b8a8] hover:border-[#8b6748] hover:text-[#8b6748] hover:bg-[#faf7f2] transition-colors text-[10px]"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1c1c1c]">{detail.customers?.name ?? "訪客"}</h3>
                <p className="text-sm text-[#8a7a6e]">{detail.time_slot} · ${(detail.total_price ?? 0).toLocaleString()}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_LABEL[detail.status].bg} ${STATUS_LABEL[detail.status].color}`}>
                {STATUS_LABEL[detail.status].text}
              </span>
            </div>

            <div className="bg-[#faf7f2] rounded-xl p-3 mb-4 space-y-1.5 text-sm">
              <Row label="日期" value={formatDateCN(detail.date)} />
              <Row label="技師" value={(detail.staff as { name?: string } | null)?.name ?? staffList.find(s => s.id === detail.staff_id)?.name ?? "未指定"} />
              {detail.customers?.phone && <Row label="電話" value={detail.customers.phone} />}
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#8a7a6e] mb-1 block">備註</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                placeholder="輸入備註…"
                className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] resize-none" />
              <button onClick={saveNote} disabled={saving}
                className="mt-1.5 text-xs text-[#8b6748] hover:underline disabled:opacity-50">
                儲存備註
              </button>
            </div>

            {canManageAll && (
              <div className="space-y-2 mb-4">
                {detail.status === "pending" && (
                  <button onClick={() => updateStatus(detail.id, "confirmed")} disabled={saving}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    確認預約
                  </button>
                )}
                {(detail.status === "confirmed" || detail.status === "pending") && (
                  <>
                    <button onClick={() => updateStatus(detail.id, "completed")} disabled={saving}
                      className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                      標記完成
                    </button>
                    <button onClick={() => {
                      if (confirm("確定標記為爽約？此時段將重新開放。")) updateStatus(detail.id, "no_show");
                    }} disabled={saving}
                      className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                      標記爽約（開放時段）
                    </button>
                    <button onClick={() => {
                      if (confirm("確定取消預約？")) updateStatus(detail.id, "cancelled");
                    }} disabled={saving}
                      className="w-full py-2.5 border border-gray-300 text-gray-500 rounded-xl text-sm disabled:opacity-50">
                      取消預約
                    </button>
                  </>
                )}
              </div>
            )}

            {isStaff && (detail.status === "confirmed" || detail.status === "pending") && (
              <button onClick={() => {
                if (confirm("確定標記為爽約？此時段將重新開放。")) updateStatus(detail.id, "no_show");
              }} disabled={saving}
                className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium mb-4 disabled:opacity-50">
                標記爽約（開放時段）
              </button>
            )}

            <button onClick={() => setDetail(null)}
              className="w-full py-2.5 border border-[#e8ddd2] text-[#8a7a6e] rounded-xl text-sm">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Add booking modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增預約</h3>
            <div className="space-y-3">
              <Field label="客戶姓名 *">
                <input placeholder="姓名" value={newBooking.customerName}
                  onChange={e => setNewBooking(p => ({ ...p, customerName: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="電話">
                <input placeholder="09xxxxxxxx" value={newBooking.phone}
                  onChange={e => setNewBooking(p => ({ ...p, phone: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="指定技師">
                <select value={newBooking.staffId}
                  onChange={e => setNewBooking(p => ({ ...p, staffId: e.target.value }))}
                  className={inputCls}>
                  <option value="">不指定（系統分配，不含技術長）</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.level === "技術長" ? "【技術長】" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="時間 *">
                <select value={newBooking.timeSlot}
                  onChange={e => setNewBooking(p => ({ ...p, timeSlot: e.target.value }))}
                  className={inputCls}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="服務項目">
                <select value={newBooking.serviceName}
                  onChange={e => {
                    const svc = BOOKING_SERVICES.find(s => s.name === e.target.value);
                    setNewBooking(p => ({ ...p, serviceName: e.target.value, totalPrice: svc?.price ?? p.totalPrice }));
                  }}
                  className={inputCls}>
                  <option value="">選擇服務</option>
                  {BOOKING_SERVICES.map(s => <option key={s.id} value={s.name}>{s.name}（{s.duration}分）</option>)}
                </select>
              </Field>
              <Field label="金額">
                <input type="number" value={newBooking.totalPrice}
                  onChange={e => setNewBooking(p => ({ ...p, totalPrice: Number(e.target.value) }))}
                  className={inputCls} />
              </Field>
              <Field label="備註">
                <textarea value={newBooking.notes} rows={2}
                  onChange={e => setNewBooking(p => ({ ...p, notes: e.target.value }))}
                  className={inputCls + " resize-none"} />
              </Field>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">
                取消
              </button>
              <button onClick={handleAddBooking} disabled={saving || !newBooking.customerName}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? "新增中…" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8a7a6e] text-xs">{label}</span>
      <span className="text-[#1c1c1c] text-xs font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[#8a7a6e] mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] bg-white";
