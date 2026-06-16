"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_BOOKINGS, ADMIN_STAFF, ADMIN_STORES, BookingStatus, AdminBooking, PaymentMethod } from "@/lib/adminMockData";

const PAYMENT_METHODS: PaymentMethod[] = ["現金", "電子支付", "轉帳", "信用卡", "儲值金"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "待確認": "bg-amber-50 text-amber-700 border-amber-200",
    "已確認": "bg-blue-50 text-blue-700 border-blue-200",
    "已完成": "bg-green-50 text-green-700 border-green-200",
    "已取消": "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[status] || ""}`}>{status}</span>
  );
}

export default function BookingsPage() {
  const { user } = useAdmin();
  const [bookings, setBookings] = useState<AdminBooking[]>(ADMIN_BOOKINGS);
  const [filterDate, setFilterDate] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "">("");
  const [editBooking, setEditBooking] = useState<AdminBooking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [checkoutBooking, setCheckoutBooking] = useState<AdminBooking | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>("現金");

  if (!user) return null;

  const isStaff = user.role === "員工";
  const myStaff = ADMIN_STAFF.find(s => s.username === user.username);

  let filtered = bookings;
  if (isStaff && myStaff) {
    filtered = filtered.filter(b => b.staffId === myStaff.id);
  }
  if (filterDate) filtered = filtered.filter(b => b.date === filterDate);
  if (filterStore) filtered = filtered.filter(b => b.storeId === filterStore);
  if (filterStaff) filtered = filtered.filter(b => b.staffId === filterStaff);
  if (filterStatus) filtered = filtered.filter(b => b.status === filterStatus);

  filtered = [...filtered].sort((a, b) => (a.date + a.time) > (b.date + b.time) ? -1 : 1);

  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const completeWithPayment = () => {
    if (!checkoutBooking) return;
    setBookings(prev => prev.map(b =>
      b.id === checkoutBooking.id ? { ...b, status: "已完成", paymentMethod: checkoutPayment } : b
    ));
    setCheckoutBooking(null);
  };

  const updateNote = (id: string, notes: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, notes } : b));
    setEditBooking(null);
  };

  const updateBuffer = (id: string, buf: number) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, bufferMinutes: buf } : b));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">預約管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm"
        >
          + 臨時預約
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
          />
          {!isStaff && (
            <>
              <select
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
                className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
              >
                <option value="">所有門市</option>
                {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={filterStaff}
                onChange={e => setFilterStaff(e.target.value)}
                className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
              >
                <option value="">所有員工</option>
                {ADMIN_STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as BookingStatus | "")}
            className="px-3 py-2 border border-[#e8ddd2] rounded-lg text-sm focus:outline-none focus:border-[#8b6748]"
          >
            <option value="">所有狀態</option>
            {["待確認", "已確認", "已完成", "已取消"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {(filterDate || filterStore || filterStaff || filterStatus) && (
          <button
            onClick={() => { setFilterDate(""); setFilterStore(""); setFilterStaff(""); setFilterStatus(""); }}
            className="mt-2 text-xs text-[#8a7a6e] hover:text-[#8b6748]"
          >
            清除篩選
          </button>
        )}
      </div>

      {/* Count */}
      <div className="text-xs text-[#8a7a6e] mb-3">共 {filtered.length} 筆預約</div>

      {/* Booking list */}
      <div className="space-y-3">
        {filtered.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1c1c1c]">{b.customerName}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-[#8a7a6e]">{b.customerPhone}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#8b6748]">${b.price.toLocaleString()}</div>
                <div className="text-xs text-[#8a7a6e] mt-0.5">{b.date}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#8a7a6e] mb-3">
              <div>🕐 {b.time} ({b.duration}分鐘)</div>
              <div>💆 {b.serviceName}</div>
              <div>👤 {b.staffName}</div>
              <div>📍 {b.storeName}</div>
              {b.notes && <div className="col-span-2">📝 {b.notes}</div>}
              {b.status === "已完成" && <div className="col-span-2">💳 付款方式：<span className="text-[#8b6748] font-medium">{b.paymentMethod}</span></div>}
            </div>

            {/* Buffer adjustment */}
            {(user.role === "員工" || user.role === "管理者" || user.role === "店長") && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-[#8a7a6e]">緩衝時間：</span>
                <select
                  value={b.bufferMinutes}
                  onChange={e => updateBuffer(b.id, Number(e.target.value))}
                  className="px-2 py-1 border border-[#e8ddd2] rounded-lg text-xs focus:outline-none"
                >
                  {[0, 5, 10, 15, 20, 25, 30].map(v => (
                    <option key={v} value={v}>{v} 分鐘</option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {b.status === "待確認" && (
                <button
                  onClick={() => updateStatus(b.id, "已確認")}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium"
                >
                  確認
                </button>
              )}
              {(b.status === "待確認" || b.status === "已確認") && (
                <>
                  <button
                    onClick={() => { setCheckoutBooking(b); setCheckoutPayment(b.paymentMethod); }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium"
                  >
                    完成結帳
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "已取消")}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium"
                  >
                    取消
                  </button>
                </>
              )}
              <button
                onClick={() => { setEditBooking(b); setNoteText(b.notes); }}
                className="px-3 py-1.5 bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2] rounded-lg text-xs font-medium"
              >
                備註
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#8a7a6e]">
            無符合條件的預約記錄
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {checkoutBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-1">結帳確認</h3>
            <p className="text-sm text-[#8a7a6e] mb-4">
              {checkoutBooking.customerName} · {checkoutBooking.serviceName}
              <span className="ml-2 text-[#8b6748] font-medium">${checkoutBooking.price.toLocaleString()}</span>
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium text-[#1c1c1c] mb-3 block">付款方式</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
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
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutBooking(null)}
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
        </div>
      )}

      {/* Note modal */}
      {editBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">編輯備註 - {editBooking.customerName}</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={4}
              placeholder="輸入備註內容…"
              className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditBooking(null)}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
              >
                取消
              </button>
              <button
                onClick={() => updateNote(editBooking.id, noteText)}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add booking modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增臨時預約</h3>
            <p className="text-sm text-[#8a7a6e] mb-4">此功能可手動建立預約記錄（示意介面）</p>
            <div className="space-y-3">
              <input placeholder="客戶姓名" className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              <input placeholder="客戶電話" className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              <input type="date" className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              <input type="time" className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
