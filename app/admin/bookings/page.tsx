"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

const STATUS_LABEL: Record<BookingStatus, { text: string; color: string; bg: string }> = {
  pending:   { text: "待確認", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  confirmed: { text: "已確認", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  completed: { text: "已完成", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled: { text: "已取消", color: "text-gray-500",   bg: "bg-gray-50 border-gray-200 opacity-60" },
  no_show:   { text: "爽約",   color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

const DAY_CN = ["日","一","二","三","四","五","六"];

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

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateCN(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}（${DAY_CN[d.getDay()]}）`;
}

export default function BookingsPage() {
  const { user, activeBranchId } = useAdmin();
  const today = new Date();
  const todayYMD = toYMD(today);

  const isStaff = user?.role === "員工";
  const canManageAll = user?.role === "管理者" || user?.role === "店長" || user?.role === "會計";

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [filterStaffId, setFilterStaffId] = useState(isStaff ? (user?.id ?? "") : "");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ customerName: "", phone: "", staffId: "", timeSlot: "10:00", serviceName: "", totalPrice: 0, notes: "" });
  const [weekOffset, setWeekOffset] = useState(0);

  // 一週日期
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i + weekOffset * 7);
    return d;
  });

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("staff_profiles")
      .select("id,name,branch_id")
      .eq("branch_id", activeBranchId)
      .eq("is_active", true)
      .order("name");
    setStaffList(data ?? []);
  }, [activeBranchId]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("bookings")
      .select("*, customers(id,name,phone,line_user_id)")
      .eq("date", selectedDate)
      .eq("store_id", activeBranchId)
      .order("time_slot");

    if (isStaff) {
      q = q.eq("staff_id", user?.id ?? "");
    } else if (filterStaffId) {
      q = q.eq("staff_id", filterStaffId);
    }

    const { data } = await q;

    // 補上技師名稱
    const enriched = (data ?? []).map((b: Booking) => ({
      ...b,
      staff: staffList.find(s => s.id === b.staff_id) ?? null,
    }));
    setBookings(enriched);
    setLoading(false);
  }, [selectedDate, activeBranchId, isStaff, filterStaffId, user?.id, staffList]);

  useEffect(() => { fetchStaff(); }, [activeBranchId]);
  useEffect(() => { fetchBookings(); }, [selectedDate, filterStaffId, staffList]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setSaving(true);
    await supabase.from("bookings").update({ status }).eq("id", id);
    // 爽約：不額外處理，前台預約系統會根據 status 判斷是否開放
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

    // 查或建立客戶
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

  // 今日統計
  const todayStats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed" || b.status === "pending").length,
    completed: bookings.filter(b => b.status === "completed").length,
    noShow: bookings.filter(b => b.status === "no_show").length,
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">預約管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-0.5">{formatDateCN(selectedDate)}</p>
        </div>
        {canManageAll && (
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm font-medium">
            + 新增預約
          </button>
        )}
      </div>

      {/* Week strip */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-3 mb-4">
        <div className="flex items-center gap-1 mb-2">
          <button onClick={() => setWeekOffset(o => o - 1)} className="text-[#8b6748] px-2 text-lg">‹</button>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDays.map(d => {
              const ymd = toYMD(d);
              const isSelected = ymd === selectedDate;
              const isToday = ymd === todayYMD;
              return (
                <button key={ymd} onClick={() => setSelectedDate(ymd)}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                    isSelected ? "bg-[#8b6748] text-white" : isToday ? "bg-[#faf7f2] text-[#8b6748]" : "hover:bg-[#faf7f2] text-[#8a7a6e]"
                  }`}>
                  <span className="text-[10px]">{DAY_CN[d.getDay()]}</span>
                  <span className="text-sm font-medium">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)} className="text-[#8b6748] px-2 text-lg">›</button>
        </div>
      </div>

      {/* Staff filter */}
      {canManageAll && staffList.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilterStaffId("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border ${!filterStaffId ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"}`}>
            全部
          </button>
          {staffList.map(s => (
            <button key={s.id} onClick={() => setFilterStaffId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border ${filterStaffId === s.id ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Day stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "預約總數", value: todayStats.total, color: "text-[#1c1c1c]" },
          { label: "待/已確認", value: todayStats.confirmed, color: "text-blue-600" },
          { label: "已完成", value: todayStats.completed, color: "text-green-600" },
          { label: "爽約", value: todayStats.noShow, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e8ddd2] p-3 text-center">
            <div className={`text-xl font-light ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-[#8a7a6e] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[#8a7a6e]">載入中…</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#8a7a6e]">本日無預約紀錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const s = STATUS_LABEL[b.status];
            const staffName = (b.staff as { name?: string } | null)?.name ?? staffList.find(st => st.id === b.staff_id)?.name ?? "未指定";
            return (
              <div key={b.id} onClick={() => openDetail(b)}
                className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-shadow ${s.bg}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-[#1c1c1c]">{b.time_slot}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.text}</span>
                    </div>
                    <div className="text-sm font-medium text-[#1c1c1c]">
                      {b.customers?.name ?? "訪客"}
                    </div>
                    <div className="text-xs text-[#8a7a6e] mt-0.5 flex gap-3">
                      <span>技師：{staffName}</span>
                      {b.customers?.phone && <span>{b.customers.phone}</span>}
                    </div>
                    {b.notes && (
                      <div className="text-xs text-[#8a7a6e] mt-1 truncate">備註：{b.notes}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-semibold text-[#8b6748]">
                      ${(b.total_price ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

            {/* Info */}
            <div className="bg-[#faf7f2] rounded-xl p-3 mb-4 space-y-1.5 text-sm">
              <Row label="日期" value={formatDateCN(detail.date)} />
              <Row label="技師" value={(detail.staff as { name?: string } | null)?.name ?? staffList.find(s => s.id === detail.staff_id)?.name ?? "未指定"} />
              {detail.customers?.phone && <Row label="電話" value={detail.customers.phone} />}
            </div>

            {/* Notes */}
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

            {/* Status actions */}
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

            {/* 員工也可以標記爽約 */}
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
                  <option value="">不指定</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="時間 *">
                <input type="time" value={newBooking.timeSlot}
                  onChange={e => setNewBooking(p => ({ ...p, timeSlot: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="服務項目">
                <input placeholder="例：90分鐘精緻筋膜調理" value={newBooking.serviceName}
                  onChange={e => setNewBooking(p => ({ ...p, serviceName: e.target.value }))}
                  className={inputCls} />
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
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
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
