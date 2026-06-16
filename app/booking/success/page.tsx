"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";

const LIFF_URL = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;

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

        {/* Post-care reminder */}
        <div className="mt-3 bg-[#f5f0e8] border border-[#d4b896]/30 rounded-xl p-4">
          <p className="text-xs font-medium text-[#b8956a] mb-1">調理後照護提醒</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            調理結束後 24–72 小時內，請多補充水分、充分休息，讓身體筋膜充分修復，效果更好。
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ※ 若 7 天內尚未預約下次調理，系統將透過 LINE 提醒您。
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {/* Share / bookmark LIFF URL */}
      <div className="w-full max-w-sm mt-4 bg-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#06C755" className="flex-shrink-0">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs text-white/70 mb-0.5">下次預約直接開啟</p>
          <a
            href={LIFF_URL}
            className="text-xs text-[#06C755] underline break-all"
            target="_blank"
            rel="noreferrer"
          >
            {LIFF_URL}
          </a>
        </div>
      </div>

      <div className="w-full max-w-sm mt-3 space-y-3">
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
