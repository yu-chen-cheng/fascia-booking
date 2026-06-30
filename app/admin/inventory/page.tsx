"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/adminContext";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
const fmt = (n: number) => n.toLocaleString();

const BRANCHES = [
  { id: "ST01", name: "小巨蛋店" },
  { id: "ST02", name: "大安店" },
  { id: "ST03", name: "板橋店" },
];

type Item = {
  id: string;
  product_id: string;
  product_name: string;
  branch_id: string;
  quantity: number;
  low_stock_threshold: number;
};

type Transfer = {
  id: string;
  product_name: string;
  from_branch_id: string;
  to_branch_id: string;
  quantity: number;
  status: "pending" | "confirmed" | "rejected";
  notes: string;
  created_at: string;
  requested_by_name?: string;
};

export default function InventoryPage() {
  const { user, activeBranchId, activeBranchName, canSwitchBranch } = useAdmin();
  const [tab, setTab] = useState<"庫存" | "調撥">("庫存");
  const [items, setItems] = useState<Item[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const [addForm, setAddForm] = useState({ product_name: "", quantity: 0, low_stock_threshold: 3 });
  const [adjustForm, setAdjustForm] = useState({ qty: 0, note: "進貨" });
  const [transferForm, setTransferForm] = useState({
    product_id: "", product_name: "", from_branch: activeBranchId, to_branch: "ST01", quantity: 1, notes: "",
  });

  const isManager = user?.role === "管理者" || user?.role === "會計" || user?.role === "店長";

  useEffect(() => { loadData(); }, [activeBranchId]);

  async function loadData() {
    setLoading(true);
    const branchFilter = canSwitchBranch ? {} : { branch_id: activeBranchId };

    const [{ data: inv }, { data: tr }] = await Promise.all([
      supabase.from("inventory").select("*")
        .eq("branch_id", activeBranchId)
        .order("product_name"),
      supabase.from("inventory_transfers").select("*, requested_by:staff_profiles!requested_by(name)")
        .or(`from_branch_id.eq.${activeBranchId},to_branch_id.eq.${activeBranchId}`)
        .order("created_at", { ascending: false }).limit(50),
    ]);
    setItems(inv ?? []);
    setTransfers((tr ?? []).map((t: any) => ({ ...t, requested_by_name: t.requested_by?.name })));
    setLoading(false);
  }

  async function handleAddProduct() {
    if (!addForm.product_name) return;
    setSaving(true);
    const productId = crypto.randomUUID();
    await supabase.from("inventory").upsert({
      product_id: productId,
      product_name: addForm.product_name,
      branch_id: activeBranchId,
      quantity: addForm.quantity,
      low_stock_threshold: addForm.low_stock_threshold,
    }, { onConflict: "product_id,branch_id" });
    setShowAdd(false);
    setAddForm({ product_name: "", quantity: 0, low_stock_threshold: 3 });
    loadData();
    setSaving(false);
  }

  async function handleAdjust() {
    if (!editItem) return;
    setSaving(true);
    await supabase.from("inventory").update({
      quantity: Math.max(0, editItem.quantity + adjustForm.qty),
      updated_at: new Date().toISOString(),
    }).eq("id", editItem.id);
    setEditItem(null);
    loadData();
    setSaving(false);
  }

  async function handleTransfer() {
    if (!transferForm.product_id || transferForm.quantity <= 0) return;
    setSaving(true);
    await supabase.from("inventory_transfers").insert({
      product_id: transferForm.product_id,
      product_name: transferForm.product_name,
      from_branch_id: transferForm.from_branch,
      to_branch_id: transferForm.to_branch,
      quantity: transferForm.quantity,
      requested_by: user?.id,
      notes: transferForm.notes,
    });
    setShowTransfer(false);
    setTransferForm({ product_id: "", product_name: "", from_branch: activeBranchId, to_branch: "ST01", quantity: 1, notes: "" });
    loadData();
    setSaving(false);
  }

  async function handleTransferAction(id: string, action: "confirmed" | "rejected") {
    const t = transfers.find(tr => tr.id === id);
    if (!t) return;
    await supabase.from("inventory_transfers").update({
      status: action,
      confirmed_by: user?.id,
      confirmed_at: new Date().toISOString(),
    }).eq("id", id);

    // If confirmed, move stock
    if (action === "confirmed") {
      const { data: fromItem } = await supabase.from("inventory").select("id,quantity")
        .eq("product_id", t.product_id ?? "").eq("branch_id", t.from_branch_id).maybeSingle();
      const { data: toItem } = await supabase.from("inventory").select("id,quantity")
        .eq("product_id", t.product_id ?? "").eq("branch_id", t.to_branch_id).maybeSingle();

      if (fromItem) {
        await supabase.from("inventory").update({ quantity: Math.max(0, fromItem.quantity - t.quantity) }).eq("id", fromItem.id);
      }
      if (toItem) {
        await supabase.from("inventory").update({ quantity: toItem.quantity + t.quantity }).eq("id", toItem.id);
      } else {
        await supabase.from("inventory").insert({
          product_id: t.product_id,
          product_name: t.product_name,
          branch_id: t.to_branch_id,
          quantity: t.quantity,
          low_stock_threshold: 3,
        });
      }
    }
    loadData();
  }

  const branchName = (id: string) => BRANCHES.find(b => b.id === id)?.name ?? id;
  const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-[#1c1c1c]">貨物管理</h1>
          <div className="text-xs text-[#8a7a6e]">{activeBranchName}</div>
        </div>
        {isManager && (
          <button onClick={() => setShowAdd(true)}
            className="bg-[#8b6748] text-white text-sm px-4 py-2 rounded-xl">
            + 新增商品
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <div className="text-sm font-medium text-red-700 mb-1">⚠ 庫存預警</div>
          {lowStockItems.map(i => (
            <div key={i.id} className="text-xs text-red-600">{i.product_name} — 剩 {i.quantity} 個（警戒線 {i.low_stock_threshold}）</div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-[#f5ede4] rounded-xl p-1 mb-4">
        {(["庫存", "調撥"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-[#8b6748] shadow-sm" : "text-[#8a7a6e]"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="py-10 text-center text-sm text-[#8a7a6e]">載入中…</div> : (
        <>
          {tab === "庫存" && (
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#8a7a6e]">尚無商品記錄</div>
              ) : items.map(item => (
                <div key={item.id} className={`bg-white rounded-xl p-4 border ${item.quantity <= item.low_stock_threshold ? "border-red-200" : "border-[#e8ddd2]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#1c1c1c]">{item.product_name}</div>
                      <div className="text-xs text-[#8a7a6e]">警戒線：{item.low_stock_threshold} 個</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${item.quantity <= item.low_stock_threshold ? "text-red-600" : "text-[#1c1c1c]"}`}>
                        {item.quantity}
                      </div>
                      {isManager && (
                        <button onClick={() => { setEditItem(item); setAdjustForm({ qty: 0, note: "進貨" }); }}
                          className="text-xs px-3 py-1.5 border border-[#e8ddd2] rounded-lg text-[#8a7a6e] hover:bg-[#faf7f2]">
                          調整
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isManager && (
                <button onClick={() => setShowTransfer(true)}
                  className="w-full py-3 border-2 border-dashed border-[#e8ddd2] text-[#8a7a6e] rounded-xl text-sm mt-2">
                  申請分店調撥
                </button>
              )}
            </div>
          )}

          {tab === "調撥" && (
            <div className="space-y-2">
              {transfers.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#8a7a6e]">尚無調撥記錄</div>
              ) : transfers.map(t => (
                <div key={t.id} className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-[#1c1c1c]">{t.product_name} × {t.quantity}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      t.status === "confirmed" ? "bg-green-50 text-green-700 border-green-200" :
                      t.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {t.status === "pending" ? "待審核" : t.status === "confirmed" ? "已完成" : "已拒絕"}
                    </span>
                  </div>
                  <div className="text-sm text-[#8a7a6e]">
                    {branchName(t.from_branch_id)} → {branchName(t.to_branch_id)}
                  </div>
                  {t.notes && <div className="text-xs text-[#8a7a6e] mt-1">{t.notes}</div>}
                  <div className="text-xs text-[#8a7a6e]">{new Date(t.created_at).toLocaleDateString("zh-TW")} · {t.requested_by_name}</div>
                  {t.status === "pending" && isManager && t.from_branch_id === activeBranchId && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleTransferAction(t.id, "confirmed")}
                        className="flex-1 py-1.5 bg-green-600 text-white text-xs rounded-lg">確認出貨</button>
                      <button onClick={() => handleTransferAction(t.id, "rejected")}
                        className="flex-1 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg">拒絕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add product modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div className="font-medium">新增商品</div>
              <button onClick={() => setShowAdd(false)} className="text-[#8a7a6e]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">商品名稱</label>
                <input value={addForm.product_name} onChange={e => setAddForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="商品名稱" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">初始數量</label>
                <input type="number" value={addForm.quantity}
                  onChange={e => setAddForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">庫存警戒線</label>
                <input type="number" value={addForm.low_stock_threshold}
                  onChange={e => setAddForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={handleAddProduct} disabled={saving || !addForm.product_name}
                className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? "儲存中…" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust stock modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div className="font-medium">調整庫存 — {editItem.product_name}</div>
              <button onClick={() => setEditItem(null)} className="text-[#8a7a6e]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-center text-3xl font-bold text-[#1c1c1c]">
                {editItem.quantity} → {Math.max(0, editItem.quantity + adjustForm.qty)}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setAdjustForm(f => ({ ...f, qty: f.qty - 1 }))}
                  className="w-10 h-10 bg-[#faf7f2] border border-[#e8ddd2] rounded-xl text-xl font-bold">−</button>
                <input type="number" value={adjustForm.qty}
                  onChange={e => setAdjustForm(f => ({ ...f, qty: parseInt(e.target.value) || 0 }))}
                  className="flex-1 border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm text-center text-lg font-bold" />
                <button onClick={() => setAdjustForm(f => ({ ...f, qty: f.qty + 1 }))}
                  className="w-10 h-10 bg-[#faf7f2] border border-[#e8ddd2] rounded-xl text-xl font-bold">+</button>
              </div>
              <div className="flex gap-2">
                {["進貨", "銷售", "損耗", "盤點"].map(note => (
                  <button key={note} onClick={() => setAdjustForm(f => ({ ...f, note }))}
                    className={`flex-1 py-1.5 text-xs rounded-lg border ${adjustForm.note === note ? "bg-[#8b6748] text-white border-[#8b6748]" : "border-[#e8ddd2] text-[#8a7a6e]"}`}>
                    {note}
                  </button>
                ))}
              </div>
              <button onClick={handleAdjust} disabled={saving || adjustForm.qty === 0}
                className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? "儲存中…" : "確認調整"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div className="font-medium">申請調撥</div>
              <button onClick={() => setShowTransfer(false)} className="text-[#8a7a6e]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">商品</label>
                <select value={transferForm.product_id}
                  onChange={e => {
                    const item = items.find(i => i.product_id === e.target.value);
                    setTransferForm(f => ({ ...f, product_id: e.target.value, product_name: item?.product_name ?? "" }));
                  }}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">選擇商品</option>
                  {items.map(i => <option key={i.product_id} value={i.product_id}>{i.product_name}（現有 {i.quantity} 個）</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">調出分店</label>
                <select value={transferForm.from_branch}
                  onChange={e => setTransferForm(f => ({ ...f, from_branch: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm bg-white">
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">調入分店</label>
                <select value={transferForm.to_branch}
                  onChange={e => setTransferForm(f => ({ ...f, to_branch: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm bg-white">
                  {BRANCHES.filter(b => b.id !== transferForm.from_branch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">數量</label>
                <input type="number" min={1} value={transferForm.quantity}
                  onChange={e => setTransferForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">備註</label>
                <input value={transferForm.notes} onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={handleTransfer} disabled={saving || !transferForm.product_id}
                className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? "送出中…" : "送出申請"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
