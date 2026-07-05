"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Level = "準師" | "初階職人" | "進階職人" | "資深職人" | "技術長";
type EmploymentType = "承攬制" | "僱傭制";
type Role = "管理者" | "店長" | "員工";

const LEVELS: Level[] = ["準師", "初階職人", "進階職人", "資深職人", "技術長"];

const SERVICES = [
  { key: "50min",    name: "智能結構訓練",     duration: 50 },
  { key: "60min",    name: "基礎筋膜放鬆",     duration: 60 },
  { key: "90min",    name: "精緻筋膜調理",     duration: 90 },
  { key: "120min",   name: "頂級筋膜結構整合", duration: 120 },
  { key: "40min",    name: "頻率檢測",         duration: 40 },
  { key: "plus15min",name: "+15min 加購時間",  duration: 15 },
  { key: "product",  name: "商品銷售獎金",      duration: 0 },
];

const BRANCHES = [
  { id: "ST01", name: "小巨蛋店" },
  { id: "ST02", name: "大安店" },
  { id: "ST03", name: "板橋店" },
];

interface StaffProfile {
  id: string;
  email: string;
  name: string;
  branch_id: string | null;
  role: Role;
  level: Level;
  employment_type: EmploymentType;
  base_salary: number;
  position_allowance: number;
  session_threshold: number;
  is_active: boolean;
  sort_order: number;
}

// commission_rates 儲存結構: { [level]: { [service_key]: amount } }
type CommissionMap = Record<string, Record<string, number>>;

const EMPTY_STAFF: Partial<StaffProfile> & { password: string } = {
  email: "",
  password: "fascia2024",
  name: "",
  branch_id: "ST01",
  role: "員工",
  level: "初階職人",
  employment_type: "承攬制",
  base_salary: 0,
  position_allowance: 0,
  session_threshold: 40,
  is_active: true,
};

export default function StaffPage() {
  const { user } = useAdmin();
  const router = useRouter();

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [commissionMap, setCommissionMap] = useState<{ 承攬制: CommissionMap; 僱傭制: CommissionMap }>({ 承攬制: {}, 僱傭制: {} });
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("ST01");
  const [showCommission, setShowCommission] = useState(false);
  const [activeCommissionType, setActiveCommissionType] = useState<EmploymentType>("承攬制");
  const [editStaff, setEditStaff] = useState<(StaffProfile & { password?: string }) | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState(EMPTY_STAFF);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ type: EmploymentType; level: Level; key: string } | null>(null);
  const [cellValue, setCellValue] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: staff }, { data: rates }] = await Promise.all([
      supabase.from("staff_profiles").select("id,email,name,branch_id,role,level,employment_type,base_salary,position_allowance,session_threshold,is_active,sort_order").order("name"),
      supabase.from("commission_rates").select("employment_type,level,service_key,amount"),
    ]);

    setStaffList(staff ?? []);

    // Build commission map
    const map: { 承攬制: CommissionMap; 僱傭制: CommissionMap } = { 承攬制: {}, 僱傭制: {} };
    for (const r of rates ?? []) {
      const t = r.employment_type as EmploymentType;
      if (!map[t][r.level]) map[t][r.level] = {};
      map[t][r.level][r.service_key] = r.amount;
    }
    setCommissionMap(map);
    setLoading(false);
  }

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const filteredStaff = staffList.filter(s => s.branch_id === selectedBranch && s.is_active);

  const getCommission = (type: EmploymentType, level: Level, key: string) =>
    commissionMap[type]?.[level]?.[key] ?? 0;

  const saveCommissionCell = async () => {
    if (!editingCell) return;
    const { type, level, key } = editingCell;
    const amount = parseInt(cellValue) || 0;
    await supabase.from("commission_rates")
      .upsert({ employment_type: type, level, service_key: key, amount }, { onConflict: "employment_type,level,service_key" });
    setCommissionMap(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [level]: { ...(prev[type][level] ?? {}), [key]: amount },
      },
    }));
    setEditingCell(null);
  };

  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.name || !newStaff.password) return;
    setSaving(true);
    const { error } = await supabase.from("staff_profiles").insert({
      email: newStaff.email.toLowerCase().trim(),
      password: newStaff.password,
      name: newStaff.name,
      branch_id: newStaff.branch_id,
      role: newStaff.role,
      level: newStaff.level,
      employment_type: newStaff.employment_type,
      base_salary: newStaff.base_salary ?? 0,
      position_allowance: newStaff.position_allowance ?? 0,
      session_threshold: newStaff.session_threshold ?? 40,
    });
    if (!error) {
      await fetchData();
      setShowAddModal(false);
      setNewStaff(EMPTY_STAFF);
    } else {
      if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        alert(`新增失敗：此信箱 ${newStaff.email} 已有帳號，請直接在員工列表中編輯，或使用不同的信箱。`);
      } else {
        alert("新增失敗：" + error.message);
      }
    }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!editStaff) return;
    setSaving(true);
    const updateData: Record<string, unknown> = {
      name: editStaff.name,
      branch_id: editStaff.branch_id,
      role: editStaff.role,
      level: editStaff.level,
      employment_type: editStaff.employment_type,
      base_salary: editStaff.base_salary,
      position_allowance: editStaff.position_allowance,
      session_threshold: editStaff.session_threshold,
    };
    if (editStaff.password) updateData.password = editStaff.password;
    await supabase.from("staff_profiles").update(updateData).eq("id", editStaff.id);
    await fetchData();
    setEditStaff(null);
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("確定要停用此員工帳號？")) return;
    await supabase.from("staff_profiles").update({ is_active: false }).eq("id", id);
    await fetchData();
  };

  const moveStaff = async (index: number, direction: "up" | "down") => {
    const list = filteredStaff;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const a = list[index];
    const b = list[targetIndex];
    const aOrder = a.sort_order ?? index;
    const bOrder = b.sort_order ?? targetIndex;
    await Promise.all([
      supabase.from("staff_profiles").update({ sort_order: bOrder }).eq("id", a.id),
      supabase.from("staff_profiles").update({ sort_order: aOrder }).eq("id", b.id),
    ]);
    await fetchData();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">員工管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-0.5">{filteredStaff.length} 位員工在職</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm font-medium">
          + 新增員工
        </button>
      </div>

      {/* Branch tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {BRANCHES.map(b => (
          <button key={b.id} onClick={() => setSelectedBranch(b.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${
              selectedBranch === b.id
                ? "bg-[#8b6748] text-white border-[#8b6748]"
                : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
            }`}>
            {b.name}
          </button>
        ))}
      </div>

      {/* Commission table */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] mb-5 overflow-hidden">
        <button onClick={() => setShowCommission(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4">
          <div>
            <span className="text-sm font-medium text-[#1c1c1c]">各職級抽成費率設定</span>
            <span className="text-xs text-[#8a7a6e] ml-2">點擊金額可編輯</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8b6748" strokeWidth="1.5"
            style={{ transform: showCommission ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showCommission && (
          <div className="px-5 pb-5 border-t border-[#f0e8df]">
            {/* Tab: 承攬制 / 僱傭制 */}
            <div className="flex gap-2 mt-4 mb-4">
              {(["承攬制", "僱傭制"] as EmploymentType[]).map(t => (
                <button key={t} onClick={() => setActiveCommissionType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCommissionType === t
                      ? "bg-[#8b6748] text-white"
                      : "bg-[#faf7f2] text-[#8a7a6e] border border-[#e8ddd2]"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {activeCommissionType === "承攬制" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[520px]">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-3 text-[#8a7a6e] font-medium min-w-[120px]">服務項目</th>
                      {LEVELS.map(l => (
                        <th key={l} className="text-center py-2 px-2 text-[#8a7a6e] font-medium min-w-[70px]">{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICES.map(svc => (
                      <tr key={svc.key} className="border-t border-[#f0e8df]">
                        <td className="py-2 pr-3 text-[#1c1c1c] font-medium">
                          <div>{svc.name}</div>
                          {svc.duration > 0 && <div className="text-[10px] text-[#8a7a6e]">{svc.duration}分鐘</div>}
                        </td>
                        {LEVELS.map(level => {
                          const isEditing = editingCell?.type === "承攬制" && editingCell?.level === level && editingCell?.key === svc.key;
                          return (
                            <td key={level} className="py-1 px-1 text-center">
                              {isEditing ? (
                                <input autoFocus type="number" value={cellValue}
                                  onChange={e => setCellValue(e.target.value)}
                                  onBlur={saveCommissionCell}
                                  onKeyDown={e => { if (e.key === "Enter") saveCommissionCell(); if (e.key === "Escape") setEditingCell(null); }}
                                  className="w-16 px-1 py-1 border border-[#8b6748] rounded-lg text-center text-xs focus:outline-none" />
                              ) : (
                                <button onClick={() => { setEditingCell({ type: "承攬制", level, key: svc.key }); setCellValue(String(getCommission("承攬制", level, svc.key))); }}
                                  className="w-full py-1.5 rounded-lg bg-[#faf7f2] hover:bg-[#f0e8df] text-[#8b6748] font-semibold transition-colors">
                                  ${getCommission("承攬制", level, svc.key).toLocaleString()}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeCommissionType === "僱傭制" && (
              <div>
                <p className="text-xs text-[#8a7a6e] mb-3">滿 40 人次後，每筆服務計抽成（以 60min 為基準人次）</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[400px]">
                    <thead>
                      <tr>
                        <th className="text-left py-2 pr-3 text-[#8a7a6e] font-medium">項目</th>
                        {LEVELS.map(l => (
                          <th key={l} className="text-center py-2 px-2 text-[#8a7a6e] font-medium min-w-[70px]">{l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "60min", name: "每人次（60min基準）" },
                        { key: "plus15min", name: "+15min 加購" },
                        { key: "product", name: "商品銷售獎金" },
                      ].map(svc => (
                        <tr key={svc.key} className="border-t border-[#f0e8df]">
                          <td className="py-2 pr-3 text-[#1c1c1c] font-medium">{svc.name}</td>
                          {LEVELS.map(level => {
                            const isEditing = editingCell?.type === "僱傭制" && editingCell?.level === level && editingCell?.key === svc.key;
                            return (
                              <td key={level} className="py-1 px-1 text-center">
                                {isEditing ? (
                                  <input autoFocus type="number" value={cellValue}
                                    onChange={e => setCellValue(e.target.value)}
                                    onBlur={saveCommissionCell}
                                    onKeyDown={e => { if (e.key === "Enter") saveCommissionCell(); if (e.key === "Escape") setEditingCell(null); }}
                                    className="w-16 px-1 py-1 border border-[#8b6748] rounded-lg text-center text-xs focus:outline-none" />
                                ) : (
                                  <button onClick={() => { setEditingCell({ type: "僱傭制", level, key: svc.key }); setCellValue(String(getCommission("僱傭制", level, svc.key))); }}
                                    className="w-full py-1.5 rounded-lg bg-[#faf7f2] hover:bg-[#f0e8df] text-[#8b6748] font-semibold transition-colors">
                                    ${getCommission("僱傭制", level, svc.key).toLocaleString()}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="text-center py-10 text-sm text-[#8a7a6e]">載入中…</div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#8a7a6e]">此分店尚無在職員工</div>
      ) : (
        <div className="space-y-3">
          {filteredStaff.map((s, idx) => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1 mr-2 shrink-0">
                  <button
                    onClick={() => moveStaff(idx, "up")}
                    disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e8ddd2] text-[#8a7a6e] disabled:opacity-20 hover:bg-[#faf7f2] transition-colors text-xs"
                  >▲</button>
                  <button
                    onClick={() => moveStaff(idx, "down")}
                    disabled={idx === filteredStaff.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e8ddd2] text-[#8a7a6e] disabled:opacity-20 hover:bg-[#faf7f2] transition-colors text-xs"
                  >▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-[#1c1c1c]">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.role === "管理者" ? "bg-purple-50 text-purple-700" :
                      s.role === "店長" ? "bg-blue-50 text-blue-700" :
                      "bg-[#faf7f2] text-[#8b6748]"
                    }`}>{s.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.employment_type === "僱傭制" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                    }`}>{s.employment_type}</span>
                  </div>
                  <div className="text-xs text-[#8a7a6e] space-y-0.5">
                    <div>職級：<span className="font-medium text-[#1c1c1c]">{s.level}</span></div>
                    <div className="text-[#8a7a6e]">{s.email}</div>
                    {s.employment_type === "僱傭制" && s.base_salary > 0 && (
                      <div>底薪：<span className="font-medium text-[#1c1c1c]">${s.base_salary.toLocaleString()}</span></div>
                    )}
                    {s.position_allowance > 0 && (
                      <div>職務加給：<span className="font-medium text-[#1c1c1c]">${s.position_allowance.toLocaleString()}</span></div>
                    )}
                  </div>

                  {/* Commission preview */}
                  <div className="mt-2 pt-2 border-t border-[#f0e8df]">
                    <div className="text-[10px] text-[#8a7a6e] mb-1">此職級抽成（{s.employment_type}）</div>
                    <div className="flex flex-wrap gap-1">
                      {SERVICES.slice(0, 5).map(svc => (
                        <span key={svc.key} className="text-[10px] bg-[#faf7f2] border border-[#e8ddd2] rounded-lg px-2 py-0.5">
                          {svc.name.slice(0, 6)} <span className="text-[#8b6748] font-semibold">${getCommission(s.employment_type, s.level, svc.key)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setEditStaff({ ...s, password: "" })}
                  className="ml-3 px-3 py-1.5 border border-[#e8ddd2] text-[#8a7a6e] rounded-lg text-xs shrink-0">
                  編輯
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">編輯 - {editStaff.name}</h3>
            <div className="space-y-3">
              <Field label="姓名">
                <input value={editStaff.name} onChange={e => setEditStaff(p => p && ({ ...p, name: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="職級">
                <select value={editStaff.level} onChange={e => setEditStaff(p => p && ({ ...p, level: e.target.value as Level }))}
                  className={inputCls}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="角色">
                <select value={editStaff.role} onChange={e => setEditStaff(p => p && ({ ...p, role: e.target.value as Role }))}
                  className={inputCls}>
                  {["員工","店長","管理者","會計"].map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="所屬分店">
                <select value={editStaff.branch_id ?? ""} onChange={e => setEditStaff(p => p && ({ ...p, branch_id: e.target.value }))}
                  className={inputCls}>
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="聘用制度">
                <select value={editStaff.employment_type} onChange={e => setEditStaff(p => p && ({ ...p, employment_type: e.target.value as EmploymentType }))}
                  className={inputCls}>
                  <option value="承攬制">承攬制（純抽成）</option>
                  <option value="僱傭制">僱傭制（底薪＋抽成）</option>
                </select>
              </Field>
              {editStaff.employment_type === "僱傭制" && (
                <Field label="底薪（元／月）">
                  <input type="number" value={editStaff.base_salary} onChange={e => setEditStaff(p => p && ({ ...p, base_salary: Number(e.target.value) }))}
                    className={inputCls} />
                </Field>
              )}
              <Field label="職務加給（元／月）">
                <input type="number" value={editStaff.position_allowance} onChange={e => setEditStaff(p => p && ({ ...p, position_allowance: Number(e.target.value) }))}
                  className={inputCls} />
              </Field>
              <Field label="重設密碼（留空不更改）">
                <input type="text" placeholder="輸入新密碼" value={editStaff.password ?? ""} onChange={e => setEditStaff(p => p && ({ ...p, password: e.target.value }))}
                  className={inputCls} />
              </Field>

              {/* Commission preview for this staff's level */}
              <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e8ddd2]">
                <div className="text-xs text-[#8a7a6e] font-medium mb-2">{editStaff.level} 抽成預覽（{editStaff.employment_type}）</div>
                <div className="space-y-1">
                  {SERVICES.map(svc => (
                    <div key={svc.key} className="flex justify-between text-xs">
                      <span className="text-[#8a7a6e]">{svc.name}</span>
                      <span className="font-semibold text-[#8b6748]">${getCommission(editStaff.employment_type, editStaff.level, svc.key).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditStaff(null)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? "儲存中…" : "儲存"}
              </button>
            </div>
            <button onClick={() => handleDeactivate(editStaff.id)}
              className="w-full mt-2 py-2 text-xs text-red-400 hover:text-red-600 transition-colors">
              停用此帳號
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增員工</h3>
            <div className="space-y-3">
              <Field label="姓名 *">
                <input placeholder="員工姓名" value={newStaff.name ?? ""}
                  onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="信箱 *">
                <input type="email" placeholder="employee@email.com" value={newStaff.email ?? ""}
                  onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="初始密碼 *">
                <input value={newStaff.password}
                  onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))}
                  className={inputCls} />
              </Field>
              <Field label="職級">
                <select value={newStaff.level} onChange={e => setNewStaff(p => ({ ...p, level: e.target.value as Level }))}
                  className={inputCls}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="角色">
                <select value={newStaff.role} onChange={e => setNewStaff(p => ({ ...p, role: e.target.value as Role }))}
                  className={inputCls}>
                  {["員工","店長","管理者","會計"].map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="所屬分店">
                <select value={newStaff.branch_id ?? "ST01"} onChange={e => setNewStaff(p => ({ ...p, branch_id: e.target.value }))}
                  className={inputCls}>
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="聘用制度">
                <select value={newStaff.employment_type} onChange={e => setNewStaff(p => ({ ...p, employment_type: e.target.value as EmploymentType }))}
                  className={inputCls}>
                  <option value="承攬制">承攬制（純抽成）</option>
                  <option value="僱傭制">僱傭制（底薪＋抽成）</option>
                </select>
              </Field>
              {newStaff.employment_type === "僱傭制" && (
                <Field label="底薪（元／月）">
                  <input type="number" value={newStaff.base_salary ?? 0}
                    onChange={e => setNewStaff(p => ({ ...p, base_salary: Number(e.target.value) }))}
                    className={inputCls} />
                </Field>
              )}
              <Field label="職務加給（元／月）">
                <input type="number" value={newStaff.position_allowance ?? 0}
                  onChange={e => setNewStaff(p => ({ ...p, position_allowance: Number(e.target.value) }))}
                  className={inputCls} />
              </Field>

              {/* Commission preview */}
              <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e8ddd2]">
                <div className="text-xs text-[#8a7a6e] mb-1">{newStaff.level} 抽成預覽（{newStaff.employment_type}）</div>
                {SERVICES.slice(0, 4).map(svc => (
                  <div key={svc.key} className="flex justify-between text-xs">
                    <span className="text-[#8a7a6e]">{svc.name}</span>
                    <span className="font-semibold text-[#8b6748]">
                      ${getCommission(newStaff.employment_type as EmploymentType, newStaff.level as Level, svc.key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={handleAddStaff} disabled={saving || !newStaff.name || !newStaff.email}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? "新增中…" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[#8a7a6e] mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] bg-white";
