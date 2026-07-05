"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const LEVELS = ["技術長", "資深職人", "進階職人", "初階職人", "準師"] as const;
const CATEGORIES = [
  { value: "fascia", label: "筋膜調理" },
  { value: "training", label: "訓練課程" },
  { value: "addon", label: "加購項目" },
] as const;

interface Service {
  id: string;
  name: string;
  duration: number;
  category: string;
  is_addon: boolean;
  online_bookable: boolean;
  active: boolean;
  sort_order: number;
  prices: Record<string, { regular: number; member: number }>;
  staffIds: string[];
}

interface StaffProfile {
  id: string;
  name: string;
  branch_id: string | null;
}

const BRANCH_NAMES: Record<string, string> = {
  ST01: "小巨蛋",
  ST02: "大安",
  ST03: "板橋",
};

function emptyPrices() {
  const p: Record<string, { regular: number; member: number }> = {};
  LEVELS.forEach(l => { p[l] = { regular: 0, member: 0 }; });
  return p;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    duration: 60,
    category: "fascia",
    is_addon: false,
    online_bookable: true,
    active: true,
    sort_order: 0,
    prices: emptyPrices(),
    staffIds: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: svcData }, { data: priceData }, { data: ssData }, { data: staffData }] = await Promise.all([
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("service_prices").select("*"),
      supabase.from("staff_services").select("*"),
      supabase.from("staff_profiles").select("id,name,branch_id").order("name"),
    ]);

    setStaffList(staffData || []);

    const svcs: Service[] = (svcData || []).map((s: Record<string, unknown>) => {
      const prices = emptyPrices();
      (priceData || []).filter((p: Record<string, unknown>) => p.service_id === s.id).forEach((p: Record<string, unknown>) => {
        if (p.staff_level && typeof p.staff_level === "string") {
          prices[p.staff_level] = {
            regular: (p.price_regular as number) || 0,
            member: (p.price_member as number) || 0,
          };
        }
      });
      const staffIds = (ssData || [])
        .filter((ss: Record<string, unknown>) => ss.service_id === s.id)
        .map((ss: Record<string, unknown>) => ss.staff_id as string);
      return { ...s, prices, staffIds } as Service;
    });

    setServices(svcs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      id: `svc-${Date.now()}`,
      name: "",
      duration: 60,
      category: "fascia",
      is_addon: false,
      online_bookable: true,
      active: true,
      sort_order: services.length + 1,
      prices: emptyPrices(),
      staffIds: [],
    });
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setForm({
      id: svc.id,
      name: svc.name,
      duration: svc.duration,
      category: svc.category,
      is_addon: svc.is_addon,
      online_bookable: svc.online_bookable,
      active: svc.active,
      sort_order: svc.sort_order,
      prices: { ...svc.prices },
      staffIds: [...svc.staffIds],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("請輸入服務名稱"); return; }
    setSaving(true);

    const { error: svcErr } = await supabase.from("services").upsert({
      id: form.id,
      name: form.name,
      duration: form.duration,
      category: form.category,
      is_addon: form.is_addon,
      online_bookable: form.online_bookable,
      active: form.active,
      sort_order: form.sort_order,
    });
    if (svcErr) { alert("儲存失敗：" + svcErr.message); setSaving(false); return; }

    await supabase.from("service_prices").delete().eq("service_id", form.id);
    const priceRows = LEVELS.map(l => ({
      service_id: form.id,
      staff_level: l,
      price_regular: form.prices[l]?.regular || 0,
      price_member: form.prices[l]?.member || 0,
    }));
    await supabase.from("service_prices").insert(priceRows);

    await supabase.from("staff_services").delete().eq("service_id", form.id);
    if (form.staffIds.length > 0) {
      await supabase.from("staff_services").insert(
        form.staffIds.map(staffId => ({ staff_id: staffId, service_id: form.id }))
      );
    }

    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleToggleActive = async (svc: Service) => {
    await supabase.from("services").update({ active: !svc.active }).eq("id", svc.id);
    fetchData();
  };

  const toggleStaff = (id: string) => {
    setForm(f => ({
      ...f,
      staffIds: f.staffIds.includes(id) ? f.staffIds.filter(x => x !== id) : [...f.staffIds, id],
    }));
  };

  const groupedStaff = staffList.reduce<Record<string, StaffProfile[]>>((acc, s) => {
    const branch = s.branch_id || "other";
    if (!acc[branch]) acc[branch] = [];
    acc[branch].push(s);
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#8b6748] uppercase">FASCIA 法夏</p>
            <h1 className="text-lg font-semibold text-[#1c1c1c]">服務項目管理</h1>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-[#8b6748] text-white text-sm rounded-lg"
          >
            + 新增服務
          </button>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-sm text-gray-400 border border-[#e8ddd2]">
            尚無服務項目，請先在 Supabase 執行 supabase/services_schema.sql
          </div>
        ) : (
          <div className="space-y-2">
            {services.map(svc => (
              <div key={svc.id} className={`bg-white rounded-xl p-4 border border-[#e8ddd2] ${!svc.active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1c1c1c]">{svc.name}</span>
                      {svc.is_addon && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">加購</span>
                      )}
                      {!svc.online_bookable && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">僅內部</span>
                      )}
                      {!svc.active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">已停用</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8a7a6e] mt-0.5">
                      {CATEGORIES.find(c => c.value === svc.category)?.label}
                      {svc.duration > 0 ? ` · ${svc.duration}分鐘` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {LEVELS.filter(l => svc.prices[l]?.regular > 0).map(l => (
                        <span key={l} className="text-xs text-gray-500">
                          {l}: <span className="text-[#1c1c1c] font-medium">${svc.prices[l].regular.toLocaleString()}</span>
                          {svc.prices[l].member !== svc.prices[l].regular && (
                            <span className="text-amber-600"> / 會員${svc.prices[l].member.toLocaleString()}</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5">
                      {svc.staffIds.length === 0 ? (
                        <p className="text-xs text-gray-400">全體技師</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {svc.staffIds.map(sid => {
                            const s = staffList.find(x => x.id === sid);
                            return s ? (
                              <span key={sid} className="text-[10px] px-1.5 py-0.5 bg-[#f5f0e8] text-[#8b6748] rounded">
                                {s.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(svc)}
                      className="px-3 py-1.5 text-xs border border-[#e8ddd2] rounded-lg text-[#1c1c1c] hover:bg-[#f5f0e8]"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleToggleActive(svc)}
                      className={`px-3 py-1.5 text-xs rounded-lg ${svc.active ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {svc.active ? "停用" : "啟用"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e8ddd2] px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-[#1c1c1c]">{editing ? "編輯服務" : "新增服務"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#8a7a6e] mb-1">服務名稱</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#8b6748]"
                  placeholder="例：精緻筋膜調理"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8a7a6e] mb-1">時長（分鐘）</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#8b6748]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8a7a6e] mb-1">類別</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#8b6748]"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_addon}
                    onChange={e => setForm(f => ({ ...f, is_addon: e.target.checked }))}
                    className="w-4 h-4 accent-[#8b6748]"
                  />
                  加購項目
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.online_bookable}
                    onChange={e => setForm(f => ({ ...f, online_bookable: e.target.checked }))}
                    className="w-4 h-4 accent-[#8b6748]"
                  />
                  開放線上預約
                </label>
              </div>

              <div>
                <label className="block text-xs text-[#8a7a6e] mb-2">各等級價格（一般 / 會員）</label>
                <div className="space-y-2">
                  {LEVELS.map(level => (
                    <div key={level} className="flex items-center gap-2">
                      <span className="text-xs text-[#1c1c1c] w-20 flex-shrink-0">{level}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.prices[level]?.regular || ""}
                        onChange={e => setForm(f => ({
                          ...f,
                          prices: { ...f.prices, [level]: { ...f.prices[level], regular: parseInt(e.target.value) || 0 } }
                        }))}
                        placeholder="一般價"
                        className="flex-1 border border-[#e8ddd2] rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#8b6748]"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.prices[level]?.member || ""}
                        onChange={e => setForm(f => ({
                          ...f,
                          prices: { ...f.prices, [level]: { ...f.prices[level], member: parseInt(e.target.value) || 0 } }
                        }))}
                        placeholder="會員價"
                        className="flex-1 border border-[#e8ddd2] rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#8b6748]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8a7a6e] mb-1">
                  指定技師（不選 = 全體技師皆可）
                </label>
                <div className="border border-[#e8ddd2] rounded-lg p-3 space-y-3">
                  {Object.entries(groupedStaff).map(([branchId, staffMembers]) => (
                    <div key={branchId}>
                      <p className="text-[10px] text-[#8a7a6e] uppercase tracking-wider mb-1.5">
                        {BRANCH_NAMES[branchId] || "跨店"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {staffMembers.map(s => (
                          <button
                            key={s.id}
                            onClick={() => toggleStaff(s.id)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                              form.staffIds.includes(s.id)
                                ? "bg-[#8b6748] border-[#8b6748] text-white"
                                : "border-[#e8ddd2] text-[#1c1c1c] hover:border-[#8b6748]"
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8a7a6e] mb-1">排列順序</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-24 border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#8b6748]"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#e8ddd2] px-5 py-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-[#8b6748] text-white text-sm font-medium rounded-xl disabled:opacity-60"
              >
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
