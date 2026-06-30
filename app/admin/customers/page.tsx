"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/adminContext";
import { STORED_VALUE_TIERS } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";
import { getAdminCustomers, updateCustomer, getPendingTopups, approveTopup } from "@/lib/adminApi";
import { getCustomerBookings } from "@/lib/customerApi";

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    "白金會員": "bg-purple-50 text-purple-700 border-purple-200",
    "黃金會員": "bg-amber-50 text-amber-700 border-amber-200",
    "一般會員": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[tier] || ""}`}>{tier}</span>;
}

function memberTierLabel(level: string): string {
  const map: Record<string, string> = {
    general: "一般會員", member: "法夏會員", gold: "黃金會員", platinum: "白金會員",
  };
  return map[level] ?? level;
}

export default function CustomersPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [pendingTopups, setPendingTopups] = useState<any[]>([]);
  const [showStoredValueModal, setShowStoredValueModal] = useState(false);
  const [showPendingTopups, setShowPendingTopups] = useState(false);
  const [selectedTierAmount, setSelectedTierAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [productInquiries, setProductInquiries] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getAdminCustomers();
      setCustomers(data);
      const topups = await getPendingTopups();
      setPendingTopups(topups);
      setLoading(false);
    })();
  }, []);

  // Re-search when search changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      const data = await getAdminCustomers(search || undefined);
      setCustomers(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (!user) return null;
  if (user.role === "員工") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const openProfile = async (c: any) => {
    setSelectedCustomer(c);
    setEditingNotes(false);
    setNotesText(c.body_notes ?? "");
    const bookings = await getCustomerBookings(c.id);
    setCustomerBookings(bookings);
    // 載入產品詢問紀錄
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("product_inquiries")
      .select("*")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setProductInquiries(data ?? []);
  };

  const saveNotes = async () => {
    if (!selectedCustomer) return;
    await updateCustomer(selectedCustomer.id, { bodyNotes: notesText });
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, body_notes: notesText } : c));
    setSelectedCustomer((prev: any) => prev ? { ...prev, body_notes: notesText } : prev);
    setEditingNotes(false);
  };

  const confirmStoredValue = async () => {
    if (!selectedCustomer) return;
    const amount = selectedTierAmount ?? (customAmount ? Number(customAmount) : 0);
    if (!amount || amount <= 0) return;
    const newBalance = (selectedCustomer.stored_value ?? 0) + amount;
    await updateCustomer(selectedCustomer.id, { storedValue: newBalance });
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, stored_value: newBalance } : c));
    setSelectedCustomer((prev: any) => prev ? { ...prev, stored_value: newBalance } : prev);
    setShowStoredValueModal(false);
    setSelectedTierAmount(null);
    setCustomAmount("");
  };

  const handleApproveTopup = async (topup: any) => {
    await approveTopup(topup.id, topup.customer_id, topup.amount);
    setPendingTopups(prev => prev.filter(t => t.id !== topup.id));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">會員管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">共 {customers.length} 位會員</p>
        </div>
        {pendingTopups.length > 0 && (
          <button
            onClick={() => setShowPendingTopups(true)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700"
          >
            💰 待審儲值 <span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{pendingTopups.length}</span>
          </button>
        )}
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
      {loading ? (
        <div className="text-center py-12 text-sm text-[#8a7a6e]">載入中…</div>
      ) : (
      <div className="space-y-3">
        {customers.map((c: any) => (
            <button
              key={c.id}
              onClick={() => openProfile(c)}
              className="w-full bg-white rounded-2xl border border-[#e8ddd2] p-4 text-left hover:border-[#b8956a] transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1c1c1c]">{c.name}</span>
                  {c.line_user_id && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-[#06c755] text-white leading-none">LINE</span>
                  )}
                  {c.body_notes && c.body_notes.trim() && (
                    <span className="text-red-500 text-xs ml-1" title={c.body_notes}>❗</span>
                  )}
                  <TierBadge tier={memberTierLabel(c.membership_level)} />
                </div>
                <span className="text-xs text-[#8a7a6e]">累計 ${(c.total_spent ?? 0).toLocaleString()}</span>
              </div>
              <div className="text-xs text-[#8a7a6e] mb-1">{c.phone}</div>
              {c.body_notes && (
                <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-lg text-xs text-amber-700 line-clamp-1">
                  ⚠ {c.body_notes}
                </div>
              )}
            </button>
          ))}
        {customers.length === 0 && (
          <div className="text-center py-12 text-sm text-[#8a7a6e]">無符合搜尋結果</div>
        )}
      </div>
      )}

      {/* Pending topups modal */}
      {showPendingTopups && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowPendingTopups(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e8ddd2]">
              <h3 className="text-base font-semibold text-[#1c1c1c]">待審儲值申請</h3>
              <button onClick={() => setShowPendingTopups(false)} className="text-[#8a7a6e] text-xl">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {pendingTopups.length === 0 ? (
                <p className="text-sm text-center text-[#8a7a6e] py-6">目前無待審申請</p>
              ) : pendingTopups.map((t: any) => (
                <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-semibold text-[#1c1c1c]">{t.customers?.name} · {t.customers?.phone}</div>
                      <div className="text-xs text-[#8a7a6e] mt-0.5">
                        {t.payment_method === "transfer" ? "匯款" : "信用卡"} · 申請金額 ${t.amount.toLocaleString()}
                      </div>
                      {t.transfer_ref && <div className="text-xs text-[#8a7a6e]">匯款帳號末五碼：{t.transfer_ref}</div>}
                      <div className="text-xs text-[#8a7a6e]">{new Date(t.created_at).toLocaleString("zh-TW")}</div>
                    </div>
                    <span className="text-sm font-bold text-amber-700">${t.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveTopup(t)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium"
                    >
                      確認入帳
                    </button>
                    <button
                      onClick={() => setPendingTopups(prev => prev.filter(x => x.id !== t.id))}
                      className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs"
                    >
                      略過
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                <TierBadge tier={memberTierLabel(selectedCustomer.membership_level)} />
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-[#8a7a6e] text-xl leading-none">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "累計消費", value: `$${(selectedCustomer.total_spent ?? 0).toLocaleString()}` },
                  { label: "儲值餘額", value: `$${(selectedCustomer.stored_value ?? 0).toLocaleString()}` },
                  { label: "近期調理", value: `${customerBookings.filter((b: any) => b.status === "completed").length} 次` },
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
                    <button onClick={() => { setEditingNotes(true); setNotesText(selectedCustomer.body_notes ?? ""); }} className="text-amber-600 text-xs flex items-center gap-1">
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
                    {selectedCustomer.body_notes || <span className="text-amber-400 italic">無備註</span>}
                  </p>
                )}
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-xl p-4 border border-[#e8ddd2] space-y-1">
                <div className="text-xs font-medium text-[#8a7a6e] mb-2">聯絡資訊</div>
                <div className="text-sm text-[#1c1c1c]">📞 {selectedCustomer.phone}</div>
                {selectedCustomer.email && <div className="text-sm text-[#1c1c1c]">✉ {selectedCustomer.email}</div>}
                {selectedCustomer.birthday && <div className="text-sm text-[#1c1c1c]">🎂 {selectedCustomer.birthday}</div>}
              </div>

              {/* Product inquiries */}
              {productInquiries.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-xs font-medium text-amber-700 mb-3">🛍 客人有興趣的商品</h4>
                  <div className="flex flex-wrap gap-2">
                    {productInquiries.map((q: any) => (
                      <span key={q.id} className="text-xs px-2 py-1 bg-white border border-amber-200 rounded-full text-amber-800">
                        {q.product_name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 mt-2">調理時可主動介紹以上商品</p>
                </div>
              )}

              {/* Recent bookings */}
              <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                <h4 className="text-xs font-medium text-[#8a7a6e] mb-3">近期調理紀錄</h4>
                {customerBookings.length === 0 ? (
                  <p className="text-sm text-[#8a7a6e]">尚無紀錄</p>
                ) : (
                  <div className="space-y-2">
                    {customerBookings.slice(0, 5).map((b: any) => {
                      const statusMap: Record<string, string> = { confirmed: "已確認", completed: "已完成", cancelled: "已取消", no_show: "爽約", pending: "待確認" };
                      const statusColor: Record<string, string> = { completed: "text-green-600", cancelled: "text-gray-400", no_show: "text-red-500" };
                      return (
                        <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-[#f5f0e8] last:border-0">
                          <div>
                            <div className="text-xs text-[#1c1c1c]">{b.date} {b.time_slot}</div>
                            <div className="text-xs text-[#8a7a6e]">{b.service_id} · ${(b.total_price ?? 0).toLocaleString()}</div>
                          </div>
                          <span className={`text-xs ${statusColor[b.status] ?? "text-amber-600"}`}>{statusMap[b.status] ?? b.status}</span>
                        </div>
                      );
                    })}
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
