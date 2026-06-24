"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { mockUser } from "@/lib/mockData";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS_CN[d.getDay()]}）`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { state } = useBooking();

  // Use context user history if logged in, fallback to mock rich data
  const user = state.user;
  const history =
    user?.bookingHistory && user.bookingHistory.length > 0
      ? user.bookingHistory
      : mockUser.bookingHistory;

  const totalSpent = history.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <BookingHeader
        title="調理紀錄"
        subtitle={`共 ${history.length} 次調理`}
        onBack={() => router.back()}
        step={0}
      />

      <div className="flex-1 px-5 py-5 space-y-4">
        {/* Summary */}
        <div className="bg-gradient-to-br from-[#b8956a] to-[#a07d58] rounded-2xl p-5 text-white shadow-lg shadow-[#b8956a]/25">
          <p className="text-white/70 text-xs tracking-[0.12em] uppercase mb-1">累積調理</p>
          <p className="text-3xl font-light mb-3">{history.length} <span className="text-lg">次</span></p>
          <div className="flex gap-5 text-sm">
            <div>
              <p className="text-white/60 text-xs mb-0.5">累計消費</p>
              <p className="font-semibold">${totalSpent.toLocaleString()}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-white/60 text-xs mb-0.5">最近一次</p>
              <p className="font-semibold">{history[0] ? new Date(history[0].date).getMonth() + 1 + "月" + new Date(history[0].date).getDate() + "日" : "—"}</p>
            </div>
          </div>
        </div>

        {/* History list */}
        <div>
          <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">歷次紀錄</h2>
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center ring-1 ring-gray-100">
                <p className="text-sm text-gray-400">尚無調理紀錄</p>
                <button
                  onClick={() => router.push("/booking/store")}
                  className="mt-3 text-sm text-[#b8956a] font-medium"
                >
                  立即預約第一次 →
                </button>
              </div>
            ) : (
              history.map((record, idx) => (
                <div key={record.id} className="bg-white rounded-2xl px-5 py-4 ring-1 ring-gray-100 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">{formatDate(record.date)}</span>
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f5f0e8] text-[#b8956a] font-medium">最近</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">{record.service}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>{record.store}</span>
                        <span>·</span>
                        <span>{record.teacher} 技師</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-[#b8956a]">${record.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">第 {history.length - idx} 次</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Re-book CTA */}
        {history.length > 0 && (
          <div className="bg-[#f5f0e8] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">再次預約相同療程？</p>
              <p className="text-xs text-gray-500 mt-0.5">快速選擇上次的服務</p>
            </div>
            <button
              onClick={() => router.push("/booking/store")}
              className="px-4 py-2 bg-[#b8956a] text-white text-sm rounded-xl font-medium hover:bg-[#a07d58] transition-colors"
            >
              預約
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
