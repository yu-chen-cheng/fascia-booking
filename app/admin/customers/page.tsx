"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import {
  ADMIN_CUSTOMERS,
  ADMIN_BOOKINGS,
  AdminCustomer,
  STORED_VALUE_RECORDS,
  STORED_VALUE_TIERS,
} from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    "白金會員": "bg-purple-50 text-purple-700 border-purple-200",
    "黃金會員": "bg-amber-50 text-amber-700 border-amber-200",
    "一般會員": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[tier] || ""}`}>{tier}</span>;
}

function parseVoucherAmount(voucher: string): number {
  const match = voucher.match(/\$([0-9,]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(",", ""), 10);
}

export default function CustomersPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>(ADMIN_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showStoredValueModal, setShowStoredValueModal] = useState(false);
  const [selectedTierAmount, setSelectedTierAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  if (!user) return null;
  if (user.role === "員工") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.phone.includes(search)
  );

  const getCompletedCount = (customerId: string) =>
    ADMIN_BOOKINGS.filter(b => b.customerId === customerId && b.status === "已完成").length;

  const getRecentBookings = (customerId: string) =>
    ADMIN_BOOKINGS
      .filter(b => b.customerId === customerId)
      .sort((a, b) => (a.date + a.time) > (b.date + b.time) ? -1 : 1)
      .slice(0, 3);

  const getStoredValueRecords = (customerId: string) =>
    STORED_VALUE_RECORDS.filter(r => r.customerId === customerId);

  const openProfile = (c: AdminCustomer) => {
    setSelectedCustomer(c);
    setEditingNotes(false);
    setNotesText(c.bodyNotes);
  };

  const saveNotes = () => {
    if (!selectedCustomer) return;
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, bodyNotes: notesText } : c));
    setSelectedCustomer(prev => prev ? { ...prev, bodyNotes: notesText } : prev);
    setEditingNotes(false);
  };

  const confirmStoredValue = () => {
    if (!selectedCustomer) return;
    const amount = selectedTierAmount ?? (customAmount ? Number(customAmount) : 0);
    if (!amount || amount <= 0) return;
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, storedValue: c.storedValue + amount } : c));
    setSelectedCustomer(prev => prev ? { ...prev, storedValue: prev.storedValue + amount } : prev);
    setShowStoredValueModal(false);
    setSelectedTierAmount(null);
    setCustomAmount("");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">會員管理</h1>
        <p className="text-sm text-[#8a7a6e] mt-1">共 {customers.length} 位會員</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋姓名或電話…"
          className="w-full px-4 py-3 border border-[#e8ddd2] rounded-xl text-sm bg-white focus:outline-none focus:border-[#8b6748]"
        />
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        {filtered.map(c => {
          const completedCount = getCompletedCount(c.id);
          return (
            <button
              key={c.id}
              onClick={() => openProfile(c)}
              className="w-full bg-white rounded-2xl border border-[#e8ddd2] p-4 text-left hover:border-[#b8956a] transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1c1c1c]">{c.name}</span>
                  {c.hasLine && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-[#06c755] text-white leading-none">LINE</span>
                  )}
                  {c.bodyNotes && c.bodyNotes.trim() && (
                    <span className="text-red-500 text-xs ml-1" title={c.bodyNotes}>❗</span>
                  )}
                  <TierBadge tier={c.memberTier} />
                </div>
                <span className="text-xs text-[#8a7a6e]">調理 {completedCount} 次</span>
              </div>
              <div className="text-xs text-[#8a7a6e] mb-1">{c.phone}</div>
              {c.bodyNotes && (
                <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-lg text-xs text-amber-700 line-clamp-1">
                  ⚠ {c.bodyNotes}
                </div>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#8a7a6e]">無符合搜尋結果</div>
        )}
      </div>

      {/* Profile bottom sheet */}
      {selectedCustomer && !showStoredValueModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setSelectedCustomer(null)}>
          <div
            className="bg-[#faf7f2] w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white rounded-t-3xl border-b border-[#e8ddd2]">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#1c1c1c]">{selectedCustomer.name}</span>
                <TierBadge tier={selectedCustomer.memberTier} />
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-[#8a7a6e] text-xl leading-none">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "累計消費", value: `$${selectedCustomer.totalSpent.toLocaleString()}` },
                  { label: "儲值餘額", value: `$${selectedCustomer.storedValue.toLocaleString()}` },
                  { label: "調理次數", value: `${getCompletedCount(selectedCustomer.id)} 次` },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-3 text-center border border-[#e8ddd2]">
                    <div className="text-sm font-semibold text-[#8b6748]">{stat.value}</div>
                    <div className="text-xs text-[#8a7a6e] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Body notes */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-700">身體狀況備註</span>
                  {!editingNotes && (
                    <button onClick={() => { setEditingNotes(true); setNotesText(selectedCustomer.bodyNotes); }} className="text-amber-600 text-xs flex items-center gap-1">
                      ✏ 編輯
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <>
                    <textarea
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingNotes(false)} className="flex-1 py-1.5 border border-[#e8ddd2] rounded-lg text-xs text-[#8a7a6e]">取消</button>
                      <button onClick={saveNotes} className="flex-1 py-1.5 bg-[#8b6748] text-white rounded-lg text-xs">儲存</button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {selectedCustomer.bodyNotes || <span className="text-amber-400 italic">無備註</span>}
                  </p>
                )}
              </div>

              {/* Preferred staff */}
              <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                <span className="text-xs font-medium text-[#8a7a6e]">慣用技師</span>
                <p className="text-sm text-[#1c1c1c] mt-1">{selectedCustomer.preferredStaffName ?? "無指定"}</p>
              </div>

              {/* Recent bookings */}
              <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                <h4 className="text-xs font-medium text-[#8a7a6e] mb-3">近期調理</h4>
                {getRecentBookings(selectedCustomer.id).length === 0 ? (
                  <p className="text-sm text-[#8a7a6e]">尚無紀錄</p>
                ) : (
                  <div className="space-y-2">
                    {getRecentBookings(selectedCustomer.id).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-[#f5f0e8] last:border-0">
                        <div>
                          <div className="text-xs text-[#1c1c1c]">{b.date} {b.time}</div>
                          <div className="text-xs text-[#8a7a6e]">{b.serviceName} · {b.staffName}</div>
                        </div>
                        <span className={`text-xs ${b.status === "已完成" ? "text-green-600" : b.status === "已取消" ? "text-gray-400" : "text-amber-600"}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stored value records */}
              <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                <h4 className="text-xs font-medium text-[#8a7a6e] mb-3">儲值紀錄</h4>
                {getStoredValueRecords(selectedCustomer.id).length === 0 ? (
                  <p className="text-sm text-[#8a7a6e]">尚無儲值紀錄</p>
                ) : (
                  <div className="space-y-2">
                    {getStoredValueRecords(selectedCustomer.id).map(r => (
                      <div key={r.id} className="py-2 border-b border-[#f5f0e8] last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-[#1c1c1c]">${r.amount.toLocaleString()}</div>
                            <div className="text-xs text-[#8a7a6e]">{r.date} · {r.tier}</div>
                            <div className="text-xs text-[#8a7a6e]">贈品：{r.gift}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${r.giftExpired ? "bg-gray-100 text-gray-500 border-gray-200" : r.giftClaimed ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {r.giftExpired ? "已過期" : r.giftClaimed ? "已使用" : "未使用"}
                          </span>
                        </div>
                        <div className="text-xs text-[#8a7a6e] mt-1">效期至 {r.giftExpiry}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3 px-5 pb-6 pt-2">
              <button
                onClick={() => { setShowStoredValueModal(true); setSelectedTierAmount(null); setCustomAmount(""); }}
                className="flex-1 py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
              >
                儲值
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-3 border border-[#e8ddd2] text-[#8a7a6e] rounded-xl text-sm"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stored value modal */}
      {showStoredValueModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowStoredValueModal(false)}>
          <div
            className="bg-[#faf7f2] w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 bg-white rounded-t-3xl border-b border-[#e8ddd2]">
              <h3 className="text-base font-semibold text-[#1c1c1c]">為 {selectedCustomer.name} 儲值</h3>
              <p className="text-xs text-[#8a7a6e] mt-0.5">現有餘額 ${selectedCustomer.storedValue.toLocaleString()}</p>
            </div>

            <div className="px-5 py-4 space-y-3">
              {STORED_VALUE_TIERS.map(tier => (
                <button
                  key={tier.amount}
                  onClick={() => { setSelectedTierAmount(tier.amount); setCustomAmount(""); }}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${selectedTierAmount === tier.amount ? "border-[#8b6748] bg-[#8b6748]/5" : "border-[#e8ddd2] bg-white"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${selectedTierAmount === tier.amount ? "text-[#8b6748]" : "text-[#1c1c1c]"}`}>{tier.label}</span>
                    <span className="text-sm font-semibold text-[#8b6748]">${tier.amount.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-[#8a7a6e]">贈品：{tier.gift}</div>
                  <div className="text-xs text-[#8a7a6e]">{tier.desc}</div>
                </button>
              ))}

              <div>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setSelectedTierAmount(null); }}
                  placeholder="自訂金額"
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm bg-white focus:outline-none focus:border-[#8b6748]"
                />
                <p className="text-xs text-[#8a7a6e] mt-1 px-1">自訂金額不包含贈品</p>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-6 pt-2">
              <button onClick={() => setShowStoredValueModal(false)} className="flex-1 py-3 border border-[#e8ddd2] text-[#8a7a6e] rounded-xl text-sm">取消</button>
              <button
                onClick={confirmStoredValue}
                disabled={!selectedTierAmount && (!customAmount || Number(customAmount) <= 0)}
                className="flex-1 py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                確認儲值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
