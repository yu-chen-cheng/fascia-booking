"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";


const SERVICES = [
  { id: "basic-60",    name: "基礎筋膜放鬆",     duration: 60,  commKey: "60min",  price: 2500 },
  { id: "refined-90",  name: "精緻筋膜調理",     duration: 90,  commKey: "90min",  price: 3200 },
  { id: "premium-120", name: "頂級筋膜結構整合", duration: 120, commKey: "120min", price: 3800 },
  { id: "training-50", name: "一對一功能式訓練", duration: 50,  commKey: "50min",  price: 2500 },
  { id: "frequency-40",name: "頻率檢測",         duration: 40,  commKey: "40min",  price: 2500 },
];

const PAY_FIELDS = [
  { key: "cash",          label: "現金",     cls: "bg-green-50 border-green-200" },
  { key: "stored_value",  label: "儲值金",   cls: "bg-amber-50 border-amber-200" },
  { key: "e_payment",     label: "電子支付", cls: "bg-blue-50 border-blue-200" },
  { key: "credit_card",   label: "信用卡",   cls: "bg-purple-50 border-purple-200" },
  { key: "bank_transfer", label: "轉帳",     cls: "bg-cyan-50 border-cyan-200" },
  { key: "voucher",       label: "墨攻券",   cls: "bg-rose-50 border-rose-200" },
  { key: "partner",       label: "特約廠商", cls: "bg-orange-50 border-orange-200" },
  { key: "sponsored",     label: "贊助",     cls: "bg-gray-50 border-gray-200" },
];

const BILL_DENOMS = [2000, 1000, 500, 100];
const COIN_DENOMS = [50, 10, 5, 1];
const fmt = (n: number) => n.toLocaleString();

const EMPTY_FORM = {
  customer_name: "", customer_phone: "", staff_id: "", service_id: "basic-60",
  addon_plus15min: false, total_amount: 0,
  cash: 0, stored_value: 0, e_payment: 0, credit_card: 0,
  bank_transfer: 0, voucher: 0, partner: 0, sponsored: 0,
  addon_products: [] as { name: string; price: number }[],
};

export default function CashoutPage() {
  const { user, activeBranchId } = useAdmin();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<"結帳" | "日結">("結帳");
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [daily, setDaily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [denomCounts, setDenomCounts] = useState<Record<string, number>>({});
  const [dailyForm, setDailyForm] = useState({
    petty_cash: 3000, reserve_cash: 3000,
    laundry_fee: 0, laundry_date: "",
    miscellaneous: 0, miscellaneous_note: "", notes: "",
  });

  useEffect(() => { loadData(); }, [date, activeBranchId]);

  async function loadData() {
    setLoading(true);
    const [{ data: co }, { data: sp }, { data: cr }, { data: dc }, { data: inv }] = await Promise.all([
      supabase.from("service_checkouts")
        .select("*, staff_profiles(name)")
        .eq("branch_id", activeBranchId)
        .gte("created_at", date + "T00:00:00+08:00")
        .lte("created_at", date + "T23:59:59+08:00")
        .order("created_at", { ascending: false }),
      supabase.from("staff_profiles").select("id,name,level,employment_type,session_threshold")
        .eq("branch_id", activeBranchId).eq("is_active", true),
      supabase.from("commission_rates").select("*"),
      supabase.from("daily_checkouts").select("*")
        .eq("branch_id", activeBranchId).eq("date", date).maybeSingle(),
      supabase.from("inventory").select("id,product_name,quantity")
        .eq("branch_id", activeBranchId).gt("quantity", 0).order("product_name"),
    ]);
    setCheckouts(co ?? []);
    setStaffList(sp ?? []);
    setInventoryList(inv ?? []);
    setRates(cr ?? []);
    if (dc) {
      setDaily(dc);
      setDailyForm({
        petty_cash: dc.petty_cash, reserve_cash: dc.reserve_cash,
        laundry_fee: dc.laundry_fee, laundry_date: dc.laundry_date ?? "",
        miscellaneous: dc.miscellaneous, miscellaneous_note: dc.miscellaneous_note ?? "",
        notes: dc.notes ?? "",
      });
    }
    setLoading(false);
  }

  function calcCommission(staffId: string, serviceId: string, addon: boolean) {
    const staff = staffList.find(s => s.id === staffId);
    const svc = SERVICES.find(s => s.id === serviceId);
    if (!staff || !svc) return 0;
    const r = rates.find(r => r.employment_type === staff.employment_type && r.level === staff.level && r.service_key === svc.commKey);
    let c = r?.amount ?? 0;
    if (addon) {
      const ar = rates.find(r => r.employment_type === staff.employment_type && r.level === staff.level && r.service_key === "plus15min");
      c += ar?.amount ?? 0;
    }
    return c;
  }

  const paySum = useMemo(() =>
    PAY_FIELDS.reduce((s, p) => s + ((form as any)[p.key] || 0), 0), [form]);

  const totals = useMemo(() => checkouts.reduce((acc, c) => ({
    total: acc.total + c.total_amount,
    cash: acc.cash + c.cash,
    stored_value: acc.stored_value + c.stored_value,
    e_payment: acc.e_payment + c.e_payment,
    credit_card: acc.credit_card + c.credit_card,
    bank_transfer: acc.bank_transfer + c.bank_transfer,
    voucher: acc.voucher + c.voucher,
    partner: acc.partner + c.partner,
    sponsored: acc.sponsored + c.sponsored,
    commission: acc.commission + c.staff_commission,
  }), { total: 0, cash: 0, stored_value: 0, e_payment: 0, credit_card: 0, bank_transfer: 0, voucher: 0, partner: 0, sponsored: 0, commission: 0 }),
  [checkouts]);

  const countedCash = useMemo(() => {
    let t = 0;
    BILL_DENOMS.forEach(d => t += (denomCounts[`b${d}`] ?? 0) * d);
    COIN_DENOMS.forEach(d => t += (denomCounts[`c${d}`] ?? 0) * d);
    return t;
  }, [denomCounts]);

  async function handleAdd() {
    if (!form.customer_name || !form.staff_id) return;
    if (paySum !== form.total_amount) { alert(`付款合計 $${fmt(paySum)} 與應收 $${fmt(form.total_amount)} 不符`); return; }
    setSaving(true);
    const svc = SERVICES.find(s => s.id === form.service_id)!;
    const commission = calcCommission(form.staff_id, form.service_id, form.addon_plus15min);

    let customerId: string | null = null;
    if (form.customer_phone) {
      const { data: ex } = await supabase.from("customers").select("id,stored_value").eq("phone", form.customer_phone).maybeSingle();
      if (ex) {
        customerId = ex.id;
        if (form.stored_value > 0) {
          await supabase.from("customers").update({ stored_value: Math.max(0, ex.stored_value - form.stored_value) }).eq("id", ex.id);
        }
      } else {
        const { data: nc } = await supabase.from("customers").insert({ name: form.customer_name, phone: form.customer_phone }).select("id").single();
        customerId = nc?.id ?? null;
      }
    }

    await supabase.from("service_checkouts").insert({
      staff_id: form.staff_id, branch_id: activeBranchId,
      customer_id: customerId, customer_name: form.customer_name,
      service_key: form.service_id, service_name: svc.name,
      service_duration: svc.duration + (form.addon_plus15min ? 15 : 0),
      total_amount: form.total_amount,
      cash: form.cash, stored_value: form.stored_value, e_payment: form.e_payment,
      credit_card: form.credit_card, bank_transfer: form.bank_transfer,
      voucher: form.voucher, partner: form.partner, sponsored: form.sponsored,
      addon_plus15min: form.addon_plus15min,
      addon_products: form.addon_products,
      staff_commission: commission,
    });

    setShowAdd(false);
    setForm({ ...EMPTY_FORM, addon_products: [] });
    loadData();
    setSaving(false);
  }

  async function handleSubmitDaily() {
    setSaving(true);
    await supabase.from("daily_checkouts").upsert({
      branch_id: activeBranchId, date,
      submitted_by: user?.id,
      cash_amount: totals.cash,
      petty_cash: dailyForm.petty_cash, reserve_cash: dailyForm.reserve_cash,
      laundry_fee: dailyForm.laundry_fee, laundry_date: dailyForm.laundry_date || null,
      miscellaneous: dailyForm.miscellaneous, miscellaneous_note: dailyForm.miscellaneous_note,
      total_cash_received: totals.cash, total_stored_value: totals.stored_value,
      total_e_payment: totals.e_payment, total_credit_card: totals.credit_card,
      total_transfer: totals.bank_transfer, total_voucher: totals.voucher,
      total_partner: totals.partner, total_sponsored: totals.sponsored,
      notes: dailyForm.notes,
    }, { onConflict: "branch_id,date" });
    await loadData();
    setSaving(false);
    alert("日結已儲存 ✓");
  }

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#1c1c1c]">每日結帳</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="text-sm border border-[#e8ddd2] rounded-lg px-3 py-1.5" />
      </div>

      <div className="flex gap-1 bg-[#f5ede4] rounded-xl p-1 mb-4">
        {(["結帳", "日結"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-[#8b6748] shadow-sm" : "text-[#8a7a6e]"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "結帳" && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "筆數", val: checkouts.length, unit: "筆" },
              { label: "總收入", val: `$${fmt(totals.total)}`, unit: "" },
              { label: "總抽成", val: `$${fmt(totals.commission)}`, unit: "" },
            ].map(({ label, val, unit }) => (
              <div key={label} className="bg-white rounded-xl p-3 border border-[#e8ddd2] text-center">
                <div className="text-xs text-[#8a7a6e]">{label}</div>
                <div className="text-lg font-bold text-[#1c1c1c]">{val}{unit}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            {loading ? <div className="py-10 text-center text-sm text-[#8a7a6e]">載入中…</div>
              : checkouts.length === 0 ? <div className="py-10 text-center text-sm text-[#8a7a6e]">今日尚無結帳記錄</div>
              : checkouts.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-[#1c1c1c]">{c.customer_name}</div>
                      <div className="text-sm text-[#8a7a6e]">
                        {c.service_name}{c.addon_plus15min ? " +15分" : ""}
                        {c.staff_profiles?.name && ` · ${c.staff_profiles.name}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1c1c1c]">${fmt(c.total_amount)}</div>
                      <div className="text-xs text-green-700">抽 ${fmt(c.staff_commission)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {PAY_FIELDS.filter(p => c[p.key] > 0).map(p => (
                      <span key={p.key} className={`text-xs px-2 py-0.5 rounded-full border ${p.cls}`}>
                        {p.label} ${fmt(c[p.key])}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <button onClick={() => setShowAdd(true)}
            className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium">
            + 新增結帳
          </button>
        </>
      )}

      {tab === "日結" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
            <div className="text-sm font-medium text-[#1c1c1c] mb-3">今日收款彙總</div>
            {PAY_FIELDS.map(p => (
              <div key={p.key} className="flex justify-between text-sm py-1">
                <span className="text-[#8a7a6e]">{p.label}</span>
                <span className={totals[p.key as keyof typeof totals] > 0 ? "font-medium" : "text-[#d0c4b8]"}>
                  ${fmt(totals[p.key as keyof typeof totals] as number)}
                </span>
              </div>
            ))}
            <div className="border-t border-[#e8ddd2] mt-2 pt-2 flex justify-between font-bold text-sm">
              <span>合計</span><span className="text-[#8b6748]">${fmt(totals.total)}</span>
            </div>
          </div>

          {/* Cash counting */}
          <div className="bg-white rounded-xl p-4 border border-[#e8ddd2]">
            <div className="text-sm font-medium text-[#1c1c1c] mb-3">現金點算</div>
            <div className="grid grid-cols-2 gap-2">
              {[...BILL_DENOMS.map(d => ({ d, k: `b${d}` })), ...COIN_DENOMS.map(d => ({ d, k: `c${d}` }))].map(({ d, k }) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-xs text-[#8a7a6e] w-10 text-right">${d}</span>
                  <input type="number" min={0} value={denomCounts[k] ?? ""}
                    onChange={e => setDenomCounts(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))}
                    placeholder="0" className="w-14 border border-[#e8ddd2] rounded-lg px-2 py-1 text-sm text-center" />
                  <span className="text-xs text-[#8a7a6e]">= ${fmt((denomCounts[k] ?? 0) * d)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-[#e8ddd2] pt-2 flex justify-between text-sm font-medium">
              <span>點算合計</span>
              <span className={countedCash === totals.cash && totals.cash > 0 ? "text-green-700" : countedCash !== totals.cash && totals.cash > 0 ? "text-red-600" : ""}>
                ${fmt(countedCash)}
                {totals.cash > 0 && countedCash !== totals.cash && ` (差 $${fmt(countedCash - totals.cash)})`}
              </span>
            </div>
          </div>

          {/* Daily fields */}
          <div className="bg-white rounded-xl p-4 border border-[#e8ddd2] space-y-3">
            <div className="text-sm font-medium text-[#1c1c1c]">收支明細</div>
            {[
              { key: "petty_cash", label: "零用金" },
              { key: "reserve_cash", label: "備用金" },
              { key: "laundry_fee", label: "洗衣費" },
              { key: "miscellaneous", label: "雜支" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-sm text-[#8a7a6e] w-16 flex-shrink-0">{label}</label>
                <input type="number" value={(dailyForm as any)[key]}
                  onChange={e => setDailyForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  className="flex-1 border border-[#e8ddd2] rounded-lg px-3 py-1.5 text-sm" />
              </div>
            ))}
            {dailyForm.laundry_fee > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8a7a6e] w-16">洗衣日期</label>
                <input type="date" value={dailyForm.laundry_date}
                  onChange={e => setDailyForm(f => ({ ...f, laundry_date: e.target.value }))}
                  className="flex-1 border border-[#e8ddd2] rounded-lg px-3 py-1.5 text-sm" />
              </div>
            )}
            {dailyForm.miscellaneous > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8a7a6e] w-16">說明</label>
                <input type="text" value={dailyForm.miscellaneous_note}
                  onChange={e => setDailyForm(f => ({ ...f, miscellaneous_note: e.target.value }))}
                  placeholder="耗材、備品…"
                  className="flex-1 border border-[#e8ddd2] rounded-lg px-3 py-1.5 text-sm" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <label className="text-sm text-[#8a7a6e] w-16 pt-2">備註</label>
              <textarea value={dailyForm.notes}
                onChange={e => setDailyForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="flex-1 border border-[#e8ddd2] rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
          </div>

          <div className="bg-[#faf7f2] rounded-xl p-4 border border-[#e8ddd2]">
            <div className="text-sm font-medium text-[#1c1c1c] mb-2">日結試算</div>
            {[
              { label: "現金收入", val: totals.cash },
              { label: "- 洗衣費", val: -dailyForm.laundry_fee },
              { label: "- 雜支", val: -dailyForm.miscellaneous },
              { label: "- 備用金", val: -dailyForm.reserve_cash },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm py-0.5">
                <span className="text-[#8a7a6e]">{label}</span>
                <span>${fmt(Math.abs(val))}</span>
              </div>
            ))}
            <div className="border-t border-[#e8ddd2] mt-1 pt-1 flex justify-between font-bold text-sm">
              <span>應上繳現金</span>
              <span className="text-[#8b6748]">
                ${fmt(Math.max(0, totals.cash - dailyForm.laundry_fee - dailyForm.miscellaneous - dailyForm.reserve_cash))}
              </span>
            </div>
          </div>

          {daily && <div className="text-xs text-center text-[#8a7a6e]">上次儲存：{new Date(daily.submitted_at).toLocaleString("zh-TW")}</div>}

          <button onClick={handleSubmitDaily} disabled={saving}
            className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? "儲存中…" : "提交日結"}
          </button>
        </div>
      )}

      {/* Add checkout modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e8ddd2] flex justify-between items-center">
              <div className="font-medium text-[#1c1c1c]">新增結帳</div>
              <button onClick={() => { setShowAdd(false); setForm({ ...EMPTY_FORM }); }} className="text-[#8a7a6e]">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">客戶姓名 *</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="客戶姓名" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">手機（選填，用於建立會員資料）</label>
                <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="09xx-xxx-xxx" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">服務技師 *</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm bg-white">
                  <option value="">選擇技師</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.level})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">服務項目 *</label>
                <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm bg-white">
                  {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}（{s.duration}分）</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.addon_plus15min}
                  onChange={e => setForm(f => ({ ...f, addon_plus15min: e.target.checked }))}
                  className="w-4 h-4 accent-[#8b6748]" />
                加購延長 +15分
              </label>

              {/* Product add-ons */}
              {inventoryList.length > 0 && (
                <div>
                  <div className="text-xs text-[#8a7a6e] mb-2">加購商品</div>
                  <div className="space-y-1.5">
                    {inventoryList.map(item => {
                      const inCart = form.addon_products.find(p => p.name === item.product_name);
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-[#faf7f2] rounded-xl px-3 py-2">
                          <div className="text-sm text-[#1c1c1c]">{item.product_name}</div>
                          <div className="flex items-center gap-2">
                            {inCart ? (
                              <>
                                <input type="number" value={inCart.price || ""}
                                  onChange={e => setForm(f => ({
                                    ...f,
                                    addon_products: f.addon_products.map(p =>
                                      p.name === item.product_name ? { ...p, price: parseInt(e.target.value) || 0 } : p
                                    )
                                  }))}
                                  placeholder="金額" className="w-20 border border-[#e8ddd2] rounded-lg px-2 py-1 text-xs text-center" />
                                <button onClick={() => setForm(f => ({ ...f, addon_products: f.addon_products.filter(p => p.name !== item.product_name) }))}
                                  className="text-red-400 text-xs px-2 py-1 border border-red-200 rounded-lg">移除</button>
                              </>
                            ) : (
                              <button onClick={() => setForm(f => ({ ...f, addon_products: [...f.addon_products, { name: item.product_name, price: 0 }] }))}
                                className="text-xs px-3 py-1 bg-white border border-[#e8ddd2] rounded-lg text-[#8b6748]">+ 加購</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {form.staff_id && (
                <div className="bg-[#faf7f2] rounded-xl p-3 text-sm">
                  預估抽成：<span className="font-bold text-green-700">
                    ${fmt(calcCommission(form.staff_id, form.service_id, form.addon_plus15min))}
                  </span>
                </div>
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">收費金額 *</label>
                <input type="number" value={form.total_amount || ""}
                  onChange={e => setForm(f => ({ ...f, total_amount: parseInt(e.target.value) || 0 }))}
                  placeholder="0" className="w-full border border-[#e8ddd2] rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <div className="text-xs text-[#8a7a6e] mb-2">付款方式拆分</div>
                <div className="grid grid-cols-2 gap-2">
                  {PAY_FIELDS.map(p => (
                    <div key={p.key}>
                      <label className="text-xs text-[#8a7a6e]">{p.label}</label>
                      <input type="number" value={(form as any)[p.key] || ""}
                        onChange={e => setForm(f => ({ ...f, [p.key]: parseInt(e.target.value) || 0 }))}
                        placeholder="0" className={`w-full border rounded-xl px-3 py-1.5 text-sm ${p.cls}`} />
                    </div>
                  ))}
                </div>
                {form.total_amount > 0 && (
                  <div className={`mt-2 text-xs text-center font-medium ${paySum === form.total_amount ? "text-green-700" : "text-red-600"}`}>
                    付款合計 ${fmt(paySum)} / 應收 ${fmt(form.total_amount)}
                    {paySum !== form.total_amount && ` (差 $${fmt(form.total_amount - paySum)})`}
                  </div>
                )}
              </div>
              <button onClick={handleAdd} disabled={saving || !form.customer_name || !form.staff_id || paySum !== form.total_amount || form.total_amount === 0}
                className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">
                {saving ? "儲存中…" : "確認結帳"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
