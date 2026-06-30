"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
const fmt = (n: number) => n.toLocaleString();

// expenses table doesn't exist in schema — we use daily_checkouts for expense tracking
// But we need a separate expenses table for fixed costs (rent, utilities, etc.)
// Let's create a simple in-Supabase approach using a custom table via upsert
// For now, we'll create the table definition and use localStorage as fallback

const CATEGORIES = ["房租", "水電", "薪水費", "耗材", "其他"] as const;
type Category = typeof CATEGORIES[number];

const CAT_COLOR: Record<Category, string> = {
  "房租": "bg-red-50 text-red-700 border-red-200",
  "水電": "bg-blue-50 text-blue-700 border-blue-200",
  "薪水費": "bg-orange-50 text-orange-700 border-orange-200",
  "耗材": "bg-green-50 text-green-700 border-green-200",
  "其他": "bg-gray-100 text-gray-600 border-gray-200",
};

type Expense = {
  id: string;
  branch_id: string;
  month: string;  // YYYY-MM
  category: Category;
  amount: number;
  description: string;
  created_at: string;
};

export default function ExpensesPage() {
  const { user, activeBranchId, activeBranchName } = useAdmin();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ category: Category; amount: number; description: string }>({
    category: "耗材", amount: 0, description: "",
  });

  useEffect(() => { loadExpenses(); }, [month, activeBranchId]);

  async function ensureTable() {
    // expenses_records table — will be created on first use via supabase
    // We handle 404/table not exist gracefully
  }

  async function loadExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("expense_records")
      .select("*")
      .eq("branch_id", activeBranchId)
      .eq("month", month)
      .order("created_at", { ascending: false });

    if (error?.code === "42P01") {
      // Table doesn't exist yet — show empty state
      setExpenses([]);
    } else {
      setExpenses(data ?? []);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.amount || form.amount <= 0) return;
    setSaving(true);

    if (editExp) {
      await supabase.from("expense_records").update({
        category: form.category, amount: form.amount, description: form.description,
      }).eq("id", editExp.id);
    } else {
      await supabase.from("expense_records").insert({
        branch_id: activeBranchId,
        month,
        category: form.category,
        amount: form.amount,
        description: form.description,
      });
    }

    setShowAdd(false);
    setEditExp(null);
    setForm({ category: "耗材", amount: 0, description: "" });
    loadExpenses();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定刪除此費用記錄？")) return;
    await supabase.from("expense_records").delete().eq("id", id);
    loadExpenses();
  }

  function openEdit(exp: Expense) {
    setEditExp(exp);
    setForm({ category: exp.category, amount: exp.amount, description: exp.description });
    setShowAdd(true);
  }

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      total += e.amount;
    });
    return { byCategory, total };
  }, [expenses]);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-[#1c1c1c]">費用管理</h1>
          <div className="text-xs text-[#8a7a6e]">{activeBranchName}</div>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="text-sm border border-[#e8ddd2] rounded-lg px-3 py-1.5" />
          <button onClick={() => { setEditExp(null); setForm({ category: "耗材", amount: 0, description: "" }); setShowAdd(true); }}
            className="bg-[#8b6748] text-white text-sm px-3 py-1.5 rounded-xl">
            + 新增
          </button>
        </div>
      </div>

      {/* Category summary */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {CATEGORIES.filter(c => totals.byCategory[c] > 0).map(c => (
            <div key={c} className={`rounded-xl p-3 border ${CAT_COLOR[c]} text-center`}>
              <div className="text-xs">{c}</div>
              <div className="font-bold text-sm">${fmt(totals.byCategory[c] || 0)}</div>
            </div>
          ))}
          <div className="rounded-xl p-3 border border-[#e8ddd2] bg-[#faf7f2] text-center">
            <div className="text-xs text-[#8a7a6e]">合計</div>
            <div className="font-bold text-[#8b6748]">${fmt(totals.total)}</div>
          </div>
        </div>
      )}

      {loading ? <div className="py-10 text-center text-sm text-[#8a7a6e]">載入中…</div> : (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#8a7a6e]">
              <div className="mb-2">本月尚無費用記錄</div>
              <div className="text-xs text-[#d0c4b8]">
                若首次使用，請先在 Supabase 建立 expense_records 表格<br/>
                （執行 supabase/expenses_schema.sql）
              </div>
            </div>
          ) : expenses.map(e => (
            <div key={e.id} className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${CAT_COLOR[e.category]}`}>{e.category}</span>
                  <div>
                    <div className="text-sm font-medium text-[#1c1c1c]">{e.description || e.category}</div>
                    <div className="text-xs text-[#8a7a6e]">{new Date(e.created_at).toLocaleDateString("zh-TW")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-[#1c1c1c]">${fmt(e.amount)}</div>
                  <button onClick={() => openEdit(e)} className="text-xs text-[#8a7a6e] hover:text-[#8b6748]">編輯</button>
                  <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div className="font-medium">{editExp ? "編輯費用" : "新增費用"}</div>
              <button onClick={() => { setShowAdd(false); setEditExp(null); }} className="text-[#8a7a6e]">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-2 block">類別</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.category === c ? CAT_COLOR[c] : "border-[#e8ddd2] text-[#8a7a6e]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">金額</label>
                <input type="number" value={form.amount || ""}
                  onChange={e => setForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="0" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">說明（選填）</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="費用說明" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <button onClick={handleSave} disabled={saving || form.amount <= 0}
                className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? "儲存中…" : editExp ? "更新" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
