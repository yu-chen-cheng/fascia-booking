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

    // 發送取消通知（LINE + Email）
    if (user) {
      const d = new Date(booking.date + "T00:00:00");
      const days = ["日", "一", "二", "三", "四", "五", "六"];
      const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;

      // 取得 oa_user_id（用來發送 LINE 推播）
      const customer = await getCustomerByLineId(user.id);
      const notifyUserId = customer?.oa_user_id || user.id;

      // LINE 取消通知
      await fetch("/api/line-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: notifyUserId,
          messages: [{
            type: "flex",
            altText: `預約取消通知 - ${dateStr} ${booking.time_slot}`,
            contents: {
              type: "bubble",
              header: {
                type: "box", layout: "vertical",
                backgroundColor: "#888888",
                paddingAll: "lg",
                contents: [
                  { type: "text", text: "FASCIA 法夏・筋膜結構美學", color: "#cccccc", size: "xs", weight: "bold", align: "center" },
                  { type: "text", text: "預約取消通知", color: "#ffffff", size: "lg", weight: "bold", align: "center", margin: "sm" },
                ],
              },
              body: {
                type: "box", layout: "vertical", spacing: "md", paddingAll: "lg",
                backgroundColor: "#faf7f2",
                contents: [
                  { type: "text", text: `${user.name} 您好，您的預約已取消。`, size: "sm", color: "#1c1c1c", weight: "bold" },
                  { type: "separator", margin: "md", color: "#e8ddd2" },
                  { type: "box", layout: "horizontal", spacing: "md", margin: "md", contents: [
                    { type: "text", text: "日期時間", size: "sm", color: "#8a7a6e", flex: 2 },
                    { type: "text", text: `${dateStr} ${booking.time_slot}`, size: "sm", color: "#1c1c1c", weight: "bold", flex: 4, wrap: true },
                  ]},
                  { type: "text", text: "如需重新預約，歡迎再次使用線上預約系統。", size: "xs", color: "#8a7a6e", wrap: true, margin: "md" },
                ],
              },
            },
          }],
        }),
      }).catch(err => console.error("LINE cancel notify error:", err));

      // Email 取消通知
      if (user.email) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            subject: `【FASCIA 法夏】預約取消確認 - ${dateStr} ${booking.time_slot}`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;padding:24px;border-radius:16px;">
                <div style="background:#888888;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px;">
                  <p style="color:#cccccc;font-size:12px;letter-spacing:2px;margin:0">FASCIA 法夏</p>
                  <h1 style="color:#fff;font-size:20px;margin:8px 0 0">預約取消通知</h1>
                </div>
                <p style="color:#1c1c1c;font-size:14px;">親愛的 ${user.name} 您好，您的預約已取消。</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;border-bottom:1px solid #e8ddd2">取消日期時間</td><td style="padding:10px 0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #e8ddd2">${dateStr}　${booking.time_slot}</td></tr>
                </table>
                <p style="font-size:12px;color:#8a7a6e;line-height:1.6;">如需重新預約，歡迎再次使用線上預約系統。<br>感謝您選擇 FASCIA 法夏・筋膜結構美學。</p>
              </div>
            `,
          }),
        }).catch(() => {});
      }
    }

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
        onBack={() => router.replace("/booking/profile")}
      />

      <div className="flex-1 px-4 py-5 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">載入中…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 mb-4">尚無預約紀錄</p>
            <button
              onClick={() => router.replace("/booking/store")}
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
                onClick={() => router.replace("/booking/store")}
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
