"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_CUSTOMERS, ADMIN_BOOKINGS, AdminCustomer } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    "白金會員": "bg-purple-50 text-purple-700 border-purple-200",
    "黃金會員": "bg-amber-50 text-amber-700 border-amber-200",
    "一般會員": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[tier] || ""}`}>{tier}</span>;
}

export default function CustomersPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [customers, setCustomers] = useState<AdminCustomer[]>(ADMIN_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showAddValue, setShowAddValue] = useState(false);
  const [addAmount, setAddAmount] = useState("");

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

  const markAsExisting = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, isExisting: true } : c));
  };

  const addStoredValue = (id: string, amount: number) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, storedValue: c.storedValue + amount } : c));
    setShowAddValue(false);
    setAddAmount("");
  };

  const customerBookings = selectedCustomer
    ? ADMIN_BOOKINGS.filter(b => b.customerId === selectedCustomer.id)
    : [];

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
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1c1c1c]">{c.name}</span>
                  <TierBadge tier={c.memberTier} />
                  {c.isExisting && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2]">舊客</span>
                  )}
                </div>
                <div className="text-xs text-[#8a7a6e]">{c.phone}</div>
                <div className="text-xs text-[#8a7a6e]">{c.email}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#8b6748]">${c.storedValue.toLocaleString()}</div>
                <div className="text-xs text-[#8a7a6e]">儲值餘額</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8a7a6e] mb-3">
              <span>加入：{c.joinDate}</span>
              <span>·</span>
              <span className={c.consentSigned ? "text-green-600" : "text-red-500"}>
                同意書：{c.consentSigned ? "已簽" : "未簽"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedCustomer(c); setShowAddValue(true); }}
                className="px-3 py-1.5 bg-[#8b6748] text-white rounded-lg text-xs font-medium"
              >
                儲值
              </button>
              {!c.isExisting && (
                <button
                  onClick={() => markAsExisting(c.id)}
                  className="px-3 py-1.5 bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2] rounded-lg text-xs"
                >
                  標記為舊客
                </button>
              )}
              <button
                onClick={() => setSelectedCustomer(c)}
                className="px-3 py-1.5 bg-white border border-[#e8ddd2] text-[#8a7a6e] rounded-lg text-xs"
              >
                查看預約紀錄
              </button>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs border ${c.consentSigned ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
              >
                同意書{c.consentSigned ? "✓" : "未簽"}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#8a7a6e]">無符合搜尋結果</div>
        )}
      </div>

      {/* Stored value modal */}
      {showAddValue && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-1">儲值</h3>
            <p className="text-sm text-[#8a7a6e] mb-4">{selectedCustomer.name} · 現有餘額 ${selectedCustomer.storedValue.toLocaleString()}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[5000, 10000, 15000, 20000, 30000, 50000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(String(amt))}
                  className={`py-2 text-sm rounded-xl border transition-colors ${
                    addAmount === String(amt)
                      ? "bg-[#8b6748] text-white border-[#8b6748]"
                      : "bg-[#faf7f2] text-[#1c1c1c] border-[#e8ddd2]"
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
              placeholder="或輸入其他金額"
              className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm mb-4 focus:outline-none focus:border-[#8b6748]"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowAddValue(false); setSelectedCustomer(null); }} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button
                onClick={() => addStoredValue(selectedCustomer.id, Number(addAmount))}
                disabled={!addAmount || Number(addAmount) <= 0}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50"
              >
                確認儲值
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking history modal */}
      {selectedCustomer && !showAddValue && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-1">{selectedCustomer.name} 預約紀錄</h3>
            <p className="text-xs text-[#8a7a6e] mb-4">共 {customerBookings.length} 筆</p>
            {customerBookings.length === 0 ? (
              <p className="text-sm text-[#8a7a6e]">尚無預約紀錄</p>
            ) : (
              <div className="space-y-3">
                {customerBookings.map(b => (
                  <div key={b.id} className="py-2 border-b border-[#e8ddd2] last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-[#1c1c1c]">{b.date} {b.time}</div>
                        <div className="text-xs text-[#8a7a6e]">{b.serviceName} · {b.staffName}</div>
                        <div className="text-xs text-[#8a7a6e]">{b.storeName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[#8b6748]">${b.price.toLocaleString()}</div>
                        <span className={`text-xs ${b.status === "已完成" ? "text-green-600" : b.status === "已取消" ? "text-gray-400" : "text-amber-600"}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full mt-4 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
