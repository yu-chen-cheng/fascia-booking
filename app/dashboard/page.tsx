"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { membershipTiers } from "@/lib/mockData";
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
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  // Load user state from localStorage (set during registration/consent flows)
  const [userName, setUserName] = useState("訪客");
  const [storedValue, setStoredValue] = useState(0);
  const [consentSigned, setConsentSigned] = useState(false);
  const [registrationDone, setRegistrationDone] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("fascia_user_name");
    const sv = localStorage.getItem("fascia_stored_value");
    const consent = localStorage.getItem("fascia_consent_signed");
    const registered = localStorage.getItem("fascia_registration_done");

    if (name) setUserName(name);
    if (sv) setStoredValue(parseInt(sv, 10));
    if (consent === "true") setConsentSigned(true);
    if (registered === "true") setRegistrationDone(true);
  }, []);

  // Determine SINGLE active tier — only the highest tier the user qualifies for
  const currentTier = membershipTiers.filter((t) => storedValue >= t.amount).pop() ?? null;
  const nextTier = membershipTiers.find((t) => storedValue < t.amount) ?? null;
  const progressToNext = nextTier
    ? Math.min((storedValue / nextTier.amount) * 100, 100)
    : 100;

  const vouchers = currentTier?.vouchers ?? [];

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
            <p className="text-gray-400 text-sm">歡迎，{registrationDone ? userName : "訪客"}</p>
          </div>
        </div>

        <div className="px-5 -mt-4 pb-24">
          {/* Member card */}
          <div className="bg-gradient-to-br from-[#b8956a] to-[#a07d58] rounded-2xl p-5 shadow-lg shadow-[#b8956a]/30 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/70 text-xs mb-0.5">會員等級</p>
                <p className="text-white font-semibold text-lg">{currentTier?.label || "尚未儲值"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-light">法</span>
              </div>
            </div>

            {/* Balance */}
            <div className="flex gap-4 mb-4">
              <div>
                <p className="text-white/70 text-xs mb-0.5">儲值餘額</p>
                <p className="text-white text-xl font-bold">${storedValue.toLocaleString()}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white/70 text-xs mb-0.5">累計消費</p>
                <p className="text-white text-xl font-bold">$0</p>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>距離 {nextTier.label}</span>
                  <span>${(nextTier.amount - storedValue).toLocaleString()} 可升級</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            )}
            {!nextTier && currentTier && (
              <div className="text-white/80 text-xs">
                ✓ 已達最高等級
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              label="同意書狀態"
              value={consentSigned ? "已簽署" : "未簽署"}
              color={consentSigned ? "text-[#7a9e8e]" : "text-red-500"}
            />
            <StatCard
              label="可用券數"
              value={`${vouchers.length}`}
              sub={vouchers.length > 0 ? vouchers.join("、") : "暫無可用券"}
              color="text-[#b8956a]"
            />
          </div>

          {/* Vouchers */}
          {vouchers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">優惠券</h2>
              <div className="space-y-2">
                {vouchers.map((v, i) => (
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

          {/* Membership benefits — only highlight the ONE active tier */}
          <div className="mb-6">
            <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">儲值方案</h2>
            <div className="space-y-2">
              {membershipTiers.map((tier) => {
                const isActive = currentTier?.amount === tier.amount;
                return (
                  <div
                    key={tier.amount}
                    className={`rounded-xl p-4 transition-all ${isActive ? "bg-white ring-1 ring-[#b8956a]/30" : "bg-gray-50 ring-1 ring-gray-100 opacity-60"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isActive && (
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

          {/* Booking history — empty for new users */}
          <div>
            <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">預約紀錄</h2>
            <div className="bg-white rounded-xl p-6 ring-1 ring-gray-100 text-center">
              <p className="text-sm text-gray-400">暫無預約紀錄</p>
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
