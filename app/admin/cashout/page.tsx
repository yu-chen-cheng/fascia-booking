"use client";

import { useState, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { useRouter } from "next/navigation";

const STORES = [
  { id: "ST01", name: "小巨蛋店" },
  { id: "ST02", name: "大安店" },
];

// 紙鈔面額
const BILL_DENOMS = [
  { value: 2000, label: "2,000 元", color: "bg-purple-50 border-purple-200" },
  { value: 1000, label: "1,000 元", color: "bg-blue-50 border-blue-200" },
  { value: 500,  label: "500 元",   color: "bg-green-50 border-green-200" },
  { value: 100,  label: "100 元",   color: "bg-yellow-50 border-yellow-200" },
];

// 硬幣面額
const COIN_DENOMS = [
  { value: 50,  label: "50 元", color: "bg-orange-50 border-orange-200" },
  { value: 10,  label: "10 元", color: "bg-red-50 border-red-200" },
  { value: 5,   label: "5 元",  color: "bg-pink-50 border-pink-200" },
  { value: 1,   label: "1 元",  color: "bg-gray-50 border-gray-200" },
];

type DenomKey = string; // e.g. "d2000", "c50"

function denomKey(value: number, type: "bill" | "coin") {
  return type === "bill" ? `d${value}` : `c${value}`;
}

// Mock: today's booking revenue per store
const MOCK_BOOKING_REVENUE: Record<string, number> = {
  ST01: 12800,
  ST02: 9400,
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function CashoutPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [selectedStore, setSelectedStore] = useState("ST01");
  const [date, setDate] = useState(todayStr());
  const [counts, setCounts] = useState<Record<DenomKey, number>>({});
  const [systemRevenue] = useState(MOCK_BOOKING_REVENUE);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!user) return null;
  if (user.role !== "管理者" && user.role !== "店長") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const setCount = (key: DenomKey, val: number) => {
    setCounts(prev => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const billTotal = BILL_DENOMS.reduce((sum, d) => {
    const k = denomKey(d.value, "bill");
    return sum + (counts[k] || 0) * d.value;
  }, 0);

  const coinTotal = COIN_DENOMS.reduce((sum, d) => {
    const k = denomKey(d.value, "coin");
    return sum + (counts[k] || 0) * d.value;
  }, 0);

  const cashTotal = billTotal + coinTotal;
  const expected = systemRevenue[selectedStore] || 0;
  const diff = cashTotal - expected;

  const storeName = STORES.find(s => s.id === selectedStore)?.name || "";

  const handleSubmit = () => {
    // In production: save to Supabase
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14L11 20L23 8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1c1c1c] mb-1">結帳完成</h2>
        <p className="text-sm text-[#8a7a6e] mb-2">{storeName} · {date}</p>
        <p className="text-2xl font-bold text-[#8b6748] mb-1">${cashTotal.toLocaleString()}</p>
        {diff !== 0 && (
          <p className={`text-sm mb-4 ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
            {diff > 0 ? `多收 $${diff.toLocaleString()}` : `短收 $${Math.abs(diff).toLocaleString()}`}
          </p>
        )}
        <button
          onClick={() => { setSubmitted(false); setCounts({}); setNote(""); }}
          className="mt-4 px-6 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
        >
          重新結帳
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">每日結帳</h1>
        <p className="text-sm text-[#8a7a6e] mt-1">請清點現金後填入各面額數量</p>
      </div>

      {/* Store + Date */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4 mb-4 flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-[#8a7a6e] mb-1 block">門市</label>
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          >
            {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-[#8a7a6e] mb-1 block">日期</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          />
        </div>
      </div>

      {/* Expected revenue */}
      <div className="bg-[#faf7f2] border border-[#e8ddd2] rounded-2xl px-5 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8a7a6e]">系統預計現金收入（{storeName}）</p>
          <p className="text-lg font-semibold text-[#8b6748]">${expected.toLocaleString()}</p>
        </div>
        <div className="text-xs text-[#8a7a6e] text-right">
          <p>當日完成預約</p>
          <p>現金付款合計</p>
        </div>
      </div>

      {/* Denomination input */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden mb-4">
        <button
          onClick={() => setShowBreakdown(b => !b)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-sm font-semibold text-[#1c1c1c]">點鈔明細</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8b6748" strokeWidth="1.5"
            style={{ transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showBreakdown && (
          <div className="px-5 pb-5">
            {/* Bills */}
            <p className="text-xs font-medium text-[#8a7a6e] mb-3 tracking-wide uppercase">紙鈔</p>
            <div className="space-y-2 mb-5">
              {BILL_DENOMS.map(d => {
                const k = denomKey(d.value, "bill");
                const qty = counts[k] || 0;
                return (
                  <div key={k} className={`flex items-center gap-3 rounded-xl border p-3 ${d.color}`}>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[#1c1c1c]">{d.label}</span>
                      {qty > 0 && (
                        <span className="ml-2 text-xs text-[#8a7a6e]">= ${(qty * d.value).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCount(k, qty - 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-lg leading-none"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        value={qty === 0 ? "" : qty}
                        onChange={e => setCount(k, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-14 text-center py-1.5 border border-gray-200 rounded-lg text-sm font-semibold bg-white focus:outline-none focus:border-[#8b6748]"
                      />
                      <span className="text-xs text-[#8a7a6e] w-4">張</span>
                      <button
                        onClick={() => setCount(k, qty + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-lg leading-none"
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coins */}
            <p className="text-xs font-medium text-[#8a7a6e] mb-3 tracking-wide uppercase">硬幣</p>
            <div className="space-y-2">
              {COIN_DENOMS.map(d => {
                const k = denomKey(d.value, "coin");
                const qty = counts[k] || 0;
                return (
                  <div key={k} className={`flex items-center gap-3 rounded-xl border p-3 ${d.color}`}>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[#1c1c1c]">{d.label}</span>
                      {qty > 0 && (
                        <span className="ml-2 text-xs text-[#8a7a6e]">= ${(qty * d.value).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCount(k, qty - 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-lg leading-none"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        value={qty === 0 ? "" : qty}
                        onChange={e => setCount(k, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-14 text-center py-1.5 border border-gray-200 rounded-lg text-sm font-semibold bg-white focus:outline-none focus:border-[#8b6748]"
                      />
                      <span className="text-xs text-[#8a7a6e] w-4">個</span>
                      <button
                        onClick={() => setCount(k, qty + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-lg leading-none"
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mb-4">
        <h3 className="text-xs font-semibold text-[#8a7a6e] uppercase tracking-wide mb-3">結帳總計</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8a7a6e]">紙鈔合計</span>
            <span className="font-medium">${billTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8a7a6e]">硬幣合計</span>
            <span className="font-medium">${coinTotal.toLocaleString()}</span>
          </div>
          <div className="border-t border-[#e8ddd2] pt-2 flex justify-between items-center">
            <span className="text-base font-semibold text-[#1c1c1c]">現金總計</span>
            <span className="text-2xl font-bold text-[#8b6748]">${cashTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Diff */}
        {cashTotal > 0 && (
          <div className={`mt-3 rounded-xl px-4 py-3 flex items-center justify-between ${
            diff === 0 ? "bg-green-50 border border-green-200" :
            diff > 0 ? "bg-blue-50 border border-blue-200" :
            "bg-red-50 border border-red-200"
          }`}>
            <span className={`text-sm font-medium ${
              diff === 0 ? "text-green-700" : diff > 0 ? "text-blue-700" : "text-red-700"
            }`}>
              {diff === 0 ? "✓ 金額正確" : diff > 0 ? "多收" : "⚠ 短收"}
            </span>
            {diff !== 0 && (
              <span className={`text-base font-bold ${diff > 0 ? "text-blue-700" : "text-red-700"}`}>
                {diff > 0 ? "+" : ""}${diff.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 mb-6">
        <label className="text-xs font-semibold text-[#8a7a6e] uppercase tracking-wide mb-2 block">備註（選填）</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="例：10元找零用完、客人未付等說明…"
          rows={2}
          className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm resize-none focus:outline-none focus:border-[#8b6748]"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={cashTotal === 0}
        className="w-full py-4 bg-[#8b6748] text-white text-base font-medium rounded-2xl shadow-md disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        確認結帳 ${cashTotal.toLocaleString()}
      </button>
    </div>
  );
}
