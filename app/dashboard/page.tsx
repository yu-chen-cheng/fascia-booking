"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockUser, membershipTiers } from "@/lib/mockData";
import { BookingProvider } from "@/lib/bookingContext";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-[#1a1a1a]"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const user = mockUser;
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const currentTier = membershipTiers.filter((t) => user.storedValue >= t.amount).pop();
  const nextTier = membershipTiers.find((t) => user.storedValue < t.amount);
  const progressToNext = nextTier
    ? Math.min((user.storedValue / nextTier.amount) * 100, 100)
    : 100;

  return (
    <BookingProvider>
      <div className="min-h-screen bg-[#fafaf8]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2520] px-6 pt-12 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#b8956a]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-400 text-sm mb-6 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 13L5 8l5-5" />
              </svg>
              返回首頁
            </button>

            <p className="text-xs tracking-[0.2em] text-[#b8956a] uppercase font-medium mb-1">FASCIA 法夏</p>
            <h1 className="text-2xl font-light text-white mb-1">會員中心</h1>
            <p className="text-gray-400 text-sm">歡迎，{user.name}</p>
          </div>
        </div>

        <div className="px-5 -mt-4 pb-24">
          {/* Member card */}
          <div className="bg-gradient-to-br from-[#b8956a] to-[#a07d58] rounded-2xl p-5 shadow-lg shadow-[#b8956a]/30 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/70 text-xs mb-0.5">會員等級</p>
                <p className="text-white font-semibold text-lg">{currentTier?.label || "一般會員"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-light">法</span>
              </div>
            </div>

            {/* Balance */}
            <div className="flex gap-4 mb-4">
              <div>
                <p className="text-white/70 text-xs mb-0.5">儲值餘額</p>
                <p className="text-white text-xl font-bold">${user.storedValue.toLocaleString()}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white/70 text-xs mb-0.5">累計消費</p>
                <p className="text-white text-xl font-bold">${user.totalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>距離 {nextTier.label}</span>
                  <span>${(nextTier.amount - user.storedValue).toLocaleString()} 可升級</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            )}
            {!nextTier && (
              <div className="text-white/80 text-xs">
                ✓ 已達最高等級
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label="同意書狀態"
              value={user.consentSigned ? "已簽署" : "未簽署"}
              color={user.consentSigned ? "text-[#7a9e8e]" : "text-red-500"}
            />
            <StatCard
              label="可用券數"
              value={`${user.vouchers.length}`}
              sub={user.vouchers.length > 0 ? user.vouchers.join("、") : "暫無可用券"}
              color="text-[#b8956a]"
            />
          </div>

          {/* Vouchers */}
          {user.vouchers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">優惠券</h2>
              <div className="space-y-2">
                {user.vouchers.map((v, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 ring-1 ring-[#b8956a]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#b8956a" strokeWidth="1.5">
                          <path d="M1.5 9h1M15.5 9h1M9 1.5v1M9 15.5v1M3.696 3.696l.707.707M13.597 13.597l.707.707M13.597 3.696l-.707.707M3.696 13.597l.707.707" strokeLinecap="round" />
                          <circle cx="9" cy="9" r="3.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">{v}</p>
                        <p className="text-xs text-gray-400">有效期至 2025/12/31</p>
                      </div>
                    </div>
                    <span className="text-xs bg-[#f5f0e8] text-[#b8956a] px-2 py-1 rounded-full">使用</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membership benefits */}
          <div className="mb-6">
            <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">儲值方案</h2>
            <div className="space-y-2">
              {membershipTiers.map((tier) => {
                const owned = user.storedValue >= tier.amount;
                return (
                  <div
                    key={tier.amount}
                    className={`rounded-xl p-4 transition-all ${owned ? "bg-white ring-1 ring-[#b8956a]/30" : "bg-gray-50 ring-1 ring-gray-100 opacity-60"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {owned && (
                          <div className="w-5 h-5 rounded-full bg-[#b8956a] flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                        <p className="text-sm font-semibold text-[#1a1a1a]">{tier.label}</p>
                      </div>
                      <p className="text-sm font-bold text-[#b8956a]">儲值 ${tier.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.benefits.map((b) => (
                        <span key={b} className="text-xs bg-[#f5f0e8] text-[#b8956a] px-2 py-0.5 rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking history */}
          <div>
            <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">預約紀錄</h2>
            <div className="space-y-3">
              {user.bookingHistory.map((bk) => (
                <div key={bk.id} className="bg-white rounded-xl p-4 ring-1 ring-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{bk.service}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{bk.store} · {bk.teacher}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{bk.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#b8956a]">${bk.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed bottom action */}
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-6 py-4 bg-[#fafaf8]/95 backdrop-blur-sm border-t border-gray-100">
          <button
            onClick={() => router.push("/booking/login")}
            className="w-full py-4 bg-gradient-to-r from-[#b8956a] to-[#a07d58] text-white text-base font-medium rounded-2xl shadow-lg shadow-[#b8956a]/30 hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
          >
            立即預約療程
          </button>
        </div>
      </div>
    </BookingProvider>
  );
}
