"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

export default function SuccessPage() {
  const router = useRouter();
  const { state, resetBooking, getTotalPrice } = useBooking();

  const { selectedStore, selectedTeacher, selectedService, selectedDate, selectedTime, hasAddon, user } = state;

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${DAYS_CN[selectedDate.getDay()]}）`
    : "—";

  const bookingNo = `FB${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2520] to-[#1a1a1a] flex flex-col items-center justify-center px-6 py-12">
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#b8956a] to-[#d4b896] flex items-center justify-center shadow-xl shadow-[#b8956a]/40">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 20L16 28L32 12"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-[#b8956a]/20 animate-ping" />
      </div>

      <h1 className="text-2xl font-light text-white tracking-wide mb-2">預約成功！</h1>
      <p className="text-[#b8956a] text-sm mb-8">LINE 確認通知已發送</p>

      {/* Booking card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-5 pb-4 border-b border-gray-100">
          <p className="text-xs tracking-[0.2em] text-[#b8956a] uppercase font-medium mb-1">
            FASCIA 法夏
          </p>
          <p className="text-lg font-semibold text-[#1a1a1a]">預約確認單</p>
          <p className="text-xs text-gray-400 mt-1">預約編號：{bookingNo}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <path d="M7 1C4.791 1 3 2.791 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.209-1.791-4-4-4z" />
                <circle cx="7" cy="5" r="1.25" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">門市</p>
              <p className="font-medium text-[#1a1a1a]">{selectedStore?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <circle cx="7" cy="5" r="2.5" />
                <path d="M2 12c0-2.761 2.239-5 5-5s5 2.239 5 5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">技師</p>
              <p className="font-medium text-[#1a1a1a]">{selectedTeacher?.name} {selectedTeacher?.level}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <rect x="2" y="3" width="10" height="9" rx="1.5" />
                <path d="M2 6h10M5 2v2M9 2v2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">日期時間</p>
              <p className="font-medium text-[#1a1a1a]">{dateStr}</p>
              <p className="text-[#b8956a] font-semibold">{selectedTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <path d="M7 1.5L8.545 5.29l3.955.575-2.864 2.789.676 3.938L7 10.665l-3.312 1.927.676-3.938L1.5 5.865l3.955-.575L7 1.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">服務</p>
              <p className="font-medium text-[#1a1a1a]">{selectedService?.name}{hasAddon ? " + 加購20分" : ""}</p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">費用</span>
          <span className="text-xl font-bold text-[#b8956a]">${getTotalPrice().toLocaleString()}</span>
        </div>

        {/* LINE notification note */}
        <div className="mt-4 bg-[#f0faf4] border border-[#06C755]/20 rounded-xl p-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#06C755">
            <path d="M13.333 6.853C13.333 3.947 10.667 1.333 8 1.333S2.667 3.947 2.667 6.853c0 3.36 2.773 6.18 6.653 6.787.266.053.64.173.733.4.08.213.053.52.027.72l-.12.693c-.04.213-.173.84.72.453.893-.386 4.72-2.787 6.44-4.773A6.37 6.37 0 0013.333 6.853z" />
          </svg>
          <p className="text-xs text-[#1a7a45]">LINE 確認通知已發送至您的帳號</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm mt-6 space-y-3">
        <button
          onClick={() => {
            resetBooking();
            router.push("/booking/store");
          }}
          className="w-full py-4 bg-[#b8956a] text-white text-base font-medium rounded-2xl shadow-lg shadow-[#b8956a]/30 hover:bg-[#a07d58] transition-all duration-200 active:scale-[0.97]"
        >
          再次預約
        </button>
        <button
          onClick={() => {
            resetBooking();
            router.push("/dashboard");
          }}
          className="w-full py-4 border border-white/20 text-white text-base font-medium rounded-2xl hover:bg-white/10 transition-all duration-200 active:scale-[0.97]"
        >
          前往會員中心
        </button>
        <button
          onClick={() => {
            resetBooking();
            router.push("/");
          }}
          className="w-full py-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          返回首頁
        </button>
      </div>
    </div>
  );
}
