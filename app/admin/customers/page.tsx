"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => n.toLocaleString();

const LEVEL_MAP: Record<string, string> = {
  general: "一般會員", bronze: "法夏會員", gold: "黃金會員", platinum: "白金會員",
};
const LEVEL_COLOR: Record<string, string> = {
  general: "bg-gray-100 text-gray-600 border-gray-200",
  bronze: "bg-[#faf7f2] text-[#8b6748] border-[#e8ddd2]",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  platinum: "bg-purple-50 text-purple-700 border-purple-200",
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  membership_level: string;
  stored_value: number;
  total_spent: number;
  notes: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const { user } = useAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [savingTopup, setSavingTopup] = useState(false);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase.from("customers")
      .select("*").order("created_at", { ascending: false });
    setCustomers(data ?? []);
    setLoading(false);
  }

  async function loadCustomerDetail(customer: Customer) {
    setSelected(customer);
    setEditNotes(customer.notes ?? "");
    setLoadingBookings(true);
    const { data } = await supabase.from("bookings")
      .select("*").eq("customer_id", customer.id)
      .order("date", { ascending: false }).limit(20);
    setBookings(data ?? []);
    setLoadingBookings(false);
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    await supabase.from("customers").update({ notes: editNotes }).eq("id", selected.id);
    setCustomers(cs => cs.map(c => c.id === selected.id ? { ...c, notes: editNotes } : c));
    setSelected(s => s ? { ...s, notes: editNotes } : s);
    setSavingNotes(false);
  }

  async function handleTopup() {
    if (!selected || !topupAmount) return;
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount <= 0) return;
    setSavingTopup(true);
    const newVal = selected.stored_value + amount;
    await supabase.from("customers").update({ stored_value: newVal }).eq("id", selected.id);

    // Record in topup_records
    await supabase.from("topup_records").insert({
      customer_id: selected.id,
      amount, status: "confirmed",
    });

    setCustomers(cs => cs.map(c => c.id === selected.id ? { ...c, stored_value: newVal } : c));
    setSelected(s => s ? { ...s, stored_value: newVal } : s);
    setTopupAmount("");
    setSavingTopup(false);
  }

  async function updateLevel(level: string) {
    if (!selected) return;
    await supabase.from("customers").update({ membership_level: level }).eq("id", selected.id);
    setCustomers(cs => cs.map(c => c.id === selected.id ? { ...c, membership_level: level } : c));
    setSelected(s => s ? { ...s, membership_level: level } : s);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#1c1c1c]">會員管理</h1>
        <div className="text-xs text-[#8a7a6e]">{customers.length} 位會員</div>
      </div>

      <input
        type="search" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜尋姓名、手機、Email…"
        className="w-full border border-[#e8ddd2] rounded-xl px-4 py-2.5 text-sm mb-4" />

      {loading ? <div className="py-10 text-center text-sm text-[#8a7a6e]">載入中…</div> : (
        <div className="space-y-2">
          {filtered.length === 0 && <div className="py-10 text-center text-sm text-[#8a7a6e]">找不到會員</div>}
          {filtered.map(c => (
            <button key={c.id} onClick={() => loadCustomerDetail(c)}
              className="w-full bg-white rounded-xl p-4 border border-[#e8ddd2] text-left hover:border-[#8b6748] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#faf7f2] rounded-full flex items-center justify-center text-sm font-medium text-[#8b6748]">
                    {c.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-medium text-[#1c1c1c]">{c.name}</div>
                    <div className="text-xs text-[#8a7a6e]">{c.phone ?? "未留電話"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLOR[c.membership_level] ?? LEVEL_COLOR.general}`}>
                    {LEVEL_MAP[c.membership_level] ?? c.membership_level}
                  </span>
                  {c.stored_value > 0 && (
                    <div className="text-xs text-[#8b6748] mt-1">儲值 ${fmt(c.stored_value)}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div>
                <div className="font-semibold text-[#1c1c1c]">{selected.name}</div>
                <div className="text-xs text-[#8a7a6e]">{selected.phone ?? ""} {selected.email ? `· ${selected.email}` : ""}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#8a7a6e]">✕</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#faf7f2] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#8a7a6e]">儲值餘額</div>
                  <div className="font-bold text-[#8b6748]">${fmt(selected.stored_value)}</div>
                </div>
                <div className="bg-[#faf7f2] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#8a7a6e]">累積消費</div>
                  <div className="font-bold text-[#1c1c1c]">${fmt(selected.total_spent)}</div>
                </div>
                <div className="bg-[#faf7f2] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#8a7a6e]">預約次數</div>
                  <div className="font-bold text-[#1c1c1c]">{bookings.length}</div>
                </div>
              </div>

              {/* Level */}
              <div>
                <div className="text-xs text-[#8a7a6e] mb-2">會員等級</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(LEVEL_MAP).map(([key, label]) => (
                    <button key={key} onClick={() => updateLevel(key)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selected.membership_level === key ? LEVEL_COLOR[key] : "border-[#e8ddd2] text-[#8a7a6e]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stored value topup */}
              <div>
                <div className="text-xs text-[#8a7a6e] mb-2">儲值加值</div>
                <div className="flex gap-2">
                  <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                    placeholder="輸入儲值金額" className="flex-1 border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
                  <button onClick={handleTopup} disabled={savingTopup || !topupAmount}
                    className="px-4 py-2 bg-[#8b6748] text-white text-sm rounded-xl disabled:opacity-40">
                    {savingTopup ? "…" : "加值"}
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[5000, 10000, 15000, 30000].map(amt => (
                    <button key={amt} onClick={() => setTopupAmount(String(amt))}
                      className="flex-1 py-1.5 border border-[#e8ddd2] text-xs rounded-lg text-[#8a7a6e] hover:bg-[#faf7f2]">
                      ${fmt(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-[#8a7a6e] mb-2">後台備註</div>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  rows={3} placeholder="身體狀況、偏好、特殊注意事項…"
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm resize-none" />
                <button onClick={saveNotes} disabled={savingNotes}
                  className="mt-1 text-xs px-3 py-1.5 bg-[#8b6748] text-white rounded-lg disabled:opacity-40">
                  {savingNotes ? "儲存中…" : "儲存備註"}
                </button>
              </div>

              {/* Booking history */}
              <div>
                <div className="text-xs text-[#8a7a6e] mb-2">預約記錄</div>
                {loadingBookings ? (
                  <div className="text-xs text-center text-[#8a7a6e] py-4">載入中…</div>
                ) : bookings.length === 0 ? (
                  <div className="text-xs text-center text-[#8a7a6e] py-4">尚無預約記錄</div>
                ) : (
                  <div className="space-y-1.5">
                    {bookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#f0e8df] last:border-0 text-sm">
                        <div>
                          <span className="text-[#1c1c1c]">{b.date} {b.time_slot}</span>
                          <span className="text-xs text-[#8a7a6e] ml-2">{b.service_id}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          b.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                          b.status === "cancelled" ? "bg-gray-100 text-gray-500 border-gray-200" :
                          b.status === "no_show" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {b.status === "completed" ? "完成" : b.status === "cancelled" ? "取消" : b.status === "no_show" ? "爽約" : "確認"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected.birthday && (
                <div className="text-xs text-[#8a7a6e]">生日：{selected.birthday}</div>
              )}
              <div className="text-xs text-[#8a7a6e]">
                加入時間：{new Date(selected.created_at).toLocaleDateString("zh-TW")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
