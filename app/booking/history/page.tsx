"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { getCustomerByLineId, getCustomerBookings, cancelBooking } from "@/lib/customerApi";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  confirmed: { text: "已確認", color: "text-blue-600" },
  pending:   { text: "待確認", color: "text-amber-600" },
  completed: { text: "已完成", color: "text-green-600" },
  cancelled: { text: "已取消", color: "text-gray-400" },
  no_show:   { text: "爽約",   color: "text-red-500" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${DAYS_CN[d.getDay()]}）`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { state } = useBooking();
  const { user } = state;

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<any | null>(null);

  useEffect(() => {
    if (!user) { router.push("/booking/login"); return; }
    (async () => {
      setLoading(true);
      const customer = await getCustomerByLineId(user.id);
      if (customer) {
        const data = await getCustomerBookings(customer.id);
        setBookings(data);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const canCancel = (booking: any) => {
    if (booking.status !== "confirmed" && booking.status !== "pending") return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time_slot}:00`);
    const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const handleCancel = async (booking: any) => {
    setCancelling(booking.id);
    await cancelBooking(booking.id);
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
    setCancelling(null);
    setConfirmCancel(null);
  };

  const upcoming = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const past = bookings.filter(b => b.status !== "confirmed" && b.status !== "pending");
  const totalSpent = bookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.total_price ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <BookingHeader
        title="我的預約"
        subtitle="查看及管理預約紀錄"
        showBack
        onBack={() => router.push("/booking/profile")}
      />

      <div className="flex-1 px-4 py-5 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">載入中…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 mb-4">尚無預約紀錄</p>
            <button
              onClick={() => router.push("/booking/store")}
              className="px-6 py-3 bg-[#8b6748] text-white rounded-2xl text-sm font-medium"
            >
              立即預約
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-gradient-to-br from-[#8b6748] to-[#b8956a] rounded-2xl p-5 text-white shadow-md">
              <p className="text-white/70 text-xs tracking-[0.12em] uppercase mb-1">調理紀錄</p>
              <p className="text-3xl font-light mb-3">{bookings.filter(b => b.status === "completed").length} <span className="text-lg">次</span></p>
              <div className="flex gap-5 text-sm">
                <div>
                  <p className="text-white/60 text-xs mb-0.5">累計消費</p>
                  <p className="font-semibold">${totalSpent.toLocaleString()}</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-white/60 text-xs mb-0.5">待到來</p>
                  <p className="font-semibold">{upcoming.length} 筆</p>
                </div>
              </div>
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3 px-1">即將到來</h2>
                <div className="space-y-3">
                  {upcoming.map(b => {
                    const s = STATUS_LABEL[b.status] ?? { text: b.status, color: "text-gray-500" };
                    const cancellable = canCancel(b);
                    return (
                      <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-base font-semibold text-[#1a1a1a]">{formatDate(b.date)}</p>
                            <p className="text-sm text-[#8b6748] font-medium mt-0.5">{b.time_slot} 起</p>
                          </div>
                          <span className={`text-xs font-medium ${s.color}`}>{s.text}</span>
                        </div>
                        <div className="space-y-1 mb-3 text-xs text-gray-500">
                          <p>費用：NT${(b.total_price ?? 0).toLocaleString()}</p>
                          {b.notes && <p>備註：{b.notes}</p>}
                        </div>
                        {cancellable ? (
                          <button
                            onClick={() => setConfirmCancel(b)}
                            className="w-full py-2 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition-colors"
                          >
                            取消預約
                          </button>
                        ) : (
                          <p className="text-xs text-center text-gray-400 py-1">
                            調理前 24 小時內無法線上取消，如需協助請聯繫我們
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3 px-1">歷史紀錄</h2>
                <div className="space-y-2">
                  {past.map(b => {
                    const s = STATUS_LABEL[b.status] ?? { text: b.status, color: "text-gray-500" };
                    return (
                      <div key={b.id} className="bg-white rounded-xl p-4 ring-1 ring-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#1a1a1a]">{formatDate(b.date)} {b.time_slot}</p>
                            <p className="text-xs text-gray-400 mt-0.5">NT${(b.total_price ?? 0).toLocaleString()}</p>
                          </div>
                          <span className={`text-xs ${s.color}`}>{s.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Re-book CTA */}
            <div className="bg-[#f5f0e8] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">再次預約？</p>
                <p className="text-xs text-gray-500 mt-0.5">選擇新的日期與時間</p>
              </div>
              <button
                onClick={() => router.push("/booking/store")}
                className="px-4 py-2 bg-[#8b6748] text-white text-sm rounded-xl font-medium"
              >
                立即預約
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <h3 className="text-base font-semibold text-[#1a1a1a] mb-2">確認取消預約？</h3>
            <p className="text-sm text-[#8b6748] font-medium mb-1">
              {formatDate(confirmCancel.date)} {confirmCancel.time_slot}
            </p>
            <p className="text-xs text-gray-400 mb-6">取消後無法復原，如需重新預約請再次操作。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm"
              >
                保留預約
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                disabled={!!cancelling}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-60"
              >
                {cancelling ? "取消中…" : "確認取消"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
