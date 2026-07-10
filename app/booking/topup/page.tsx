"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { getCustomerByLineId, createTopupRecord } from "@/lib/customerApi";

type PaymentMethod = "transfer" | "credit_card";

const TOPUP_PLANS = [
  {
    amount: 15000,
    label: "$15,000",
    tag: "推薦",
    gifts: ["會員調理優惠價，法夏全商品 9.5 折"],
    desc: "儲值即享專屬會員優惠",
  },
  {
    amount: 30000,
    label: "$30,000",
    tag: "超值",
    gifts: ["結構訓練券 $2,500（90天效期）"],
    desc: "會員優惠 + 贈結構訓練券",
  },
  {
    amount: 50000,
    label: "$50,000",
    tag: "最超值",
    gifts: ["結構訓練券 $2,500（90天效期）", "頻率檢測券（90天效期）"],
    desc: "會員優惠 + 雙券贈送",
  },
];

const TRANSFER_INFO = {
  bank: "永豐銀行",
  code: "807",
  account: "139-018-0004091-5",
};

export default function TopupPage() {
  const router = useRouter();
  const { state } = useBooking();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [transferRef, setTransferRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const user = state.user;
  const plan = selectedPlan !== null ? TOPUP_PLANS[selectedPlan] : null;

  const handleSubmit = async () => {
    if (!plan || !user) return;
    if (paymentMethod === "transfer" && transferRef.trim().length < 3) {
      setError("請輸入匯款帳號後 5 碼以供核對");
      return;
    }
    setError("");
    setSubmitting(true);

    const customer = await getCustomerByLineId(user.id);
    if (!customer) {
      setError("找不到會員資料，請重新登入");
      setSubmitting(false);
      return;
    }

    const record = await createTopupRecord({
      customerId: customer.id,
      amount: plan.amount,
      paymentMethod,
      transferRef: paymentMethod === "transfer" ? transferRef.trim() : undefined,
    });

    if (!record) {
      setError("送出失敗，請稍後再試");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  // ── 成功畫面 ────────────────────────────────────────────
  if (submitted && plan) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fafaf8]">
        <BookingHeader
          title="儲值申請送出"
          onBack={() => router.push("/booking/profile")}
          step={0}
        />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f5f0e8] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#b8956a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 14l7 7L23 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">申請已送出</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {paymentMethod === "transfer"
              ? "我們收到您的匯款申請，確認入帳後將自動更新您的儲值餘額，並發送 LINE 通知給您。"
              : "信用卡付款完成後，儲值將立即生效。"}
          </p>

          <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 w-full text-left mb-6">
            <p className="text-xs text-[#b8956a] tracking-wider uppercase font-medium mb-3">儲值明細</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">儲值金額</span>
                <span className="font-semibold">${plan.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">付款方式</span>
                <span>{paymentMethod === "transfer" ? "匯款" : "信用卡"}</span>
              </div>
              {plan.gifts.length > 0 && (
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs text-[#b8956a] mb-1.5">入帳後將發放</p>
                  {plan.gifts.map((g) => (
                    <div key={g} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="text-[#b8956a]">✦</span>
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push("/booking/profile")}
            className="w-full py-4 bg-[#b8956a] text-white rounded-2xl font-medium hover:bg-[#a07d58] transition-colors"
          >
            回到個人頁面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <BookingHeader
        title="儲值"
        subtitle="選擇方案，立即享有專屬好禮"
        onBack={() => router.push("/booking/profile")}
        step={0}
      />

      <div className="flex-1 px-5 py-5 space-y-5">
        {/* 方案選擇 */}
        <section>
          <p className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            選擇儲值方案
          </p>
          <div className="space-y-3">
            {TOPUP_PLANS.map((p, idx) => {
              const active = selectedPlan === idx;
              return (
                <button
                  key={p.amount}
                  onClick={() => setSelectedPlan(idx)}
                  className={`w-full rounded-2xl p-4 text-left border-2 transition-all ${
                    active
                      ? "border-[#b8956a] bg-[#fdf8f3] shadow-md shadow-[#b8956a]/10"
                      : "border-gray-100 bg-white hover:border-[#d4b896]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        active ? "border-[#b8956a] bg-[#b8956a]" : "border-gray-300"
                      }`}>
                        {active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#1a1a1a]">{p.label}</span>
                          {p.tag && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b8956a] text-white font-medium">
                              {p.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                  </div>
                  {p.gifts.length > 0 && (
                    <div className="mt-3 ml-8 space-y-1">
                      {p.gifts.map((g) => (
                        <div key={g} className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${active ? "text-[#b8956a]" : "text-gray-400"}`}>✦</span>
                          <span className={`text-xs ${active ? "text-[#8b6748]" : "text-gray-400"}`}>{g}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 付款方式 */}
        {selectedPlan !== null && (
          <section>
            <p className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
              付款方式
            </p>
            <div className="space-y-2">
              {[
                { id: "transfer" as PaymentMethod, label: "匯款", sub: `${TRANSFER_INFO.bank}（${TRANSFER_INFO.code}）${TRANSFER_INFO.account}` },
                { id: "credit_card" as PaymentMethod, label: "信用卡", sub: "綠界 ECPay（即將開放）", disabled: true },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => !m.disabled && setPaymentMethod(m.id)}
                  disabled={m.disabled}
                  className={`w-full rounded-2xl p-4 text-left border-2 transition-all ${
                    m.disabled
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : paymentMethod === m.id
                      ? "border-[#b8956a] bg-[#fdf8f3]"
                      : "border-gray-100 bg-white hover:border-[#d4b896]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === m.id && !m.disabled ? "border-[#b8956a] bg-[#b8956a]" : "border-gray-300"
                    }`}>
                      {paymentMethod === m.id && !m.disabled && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{m.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 匯款資訊 & 帳號後5碼 */}
            {paymentMethod === "transfer" && (
              <div className="mt-3 bg-[#f5f0e8] rounded-2xl p-4">
                <p className="text-xs text-[#8b6748] font-medium mb-2">匯款資訊</p>
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-semibold text-[#1a1a1a]">
                    {TRANSFER_INFO.bank}（{TRANSFER_INFO.code}）
                  </p>
                  <p className="text-sm font-mono font-bold text-[#b8956a] tracking-wider">
                    {TRANSFER_INFO.account}
                  </p>
                </div>
                <p className="text-xs text-[#8b6748] mb-1.5">
                  匯款後請填入帳號後 5 碼，方便我們核對
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="匯款帳號後 5 碼"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value.slice(0, 5))}
                  className="w-full px-4 py-3 rounded-xl border border-[#d4b896] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#b8956a]/30 placeholder-gray-300"
                />
              </div>
            )}
          </section>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* 送出按鈕 */}
        {selectedPlan !== null && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-[#b8956a] text-white rounded-2xl font-medium text-sm shadow-md shadow-[#b8956a]/20 hover:bg-[#a07d58] transition-colors disabled:opacity-60"
          >
            {submitting ? "送出中..." : `確認儲值 ${plan?.label}`}
          </button>
        )}

        <p className="text-xs text-center text-gray-400 pb-6">
          儲值後如有問題請透過 LINE 官方帳號聯繫我們
        </p>
      </div>
    </div>
  );
}
