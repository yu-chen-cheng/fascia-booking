"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_STAFF, ADMIN_STORES, ADMIN_SERVICES, DEFAULT_COMMISSION_TABLE, CommissionTable, AdminStaff, InternalLevel, DisplayLevel, EmploymentType } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

const INTERNAL_LEVELS: InternalLevel[] = ["實習技師", "準技師", "初階老師", "進階老師", "資深老師", "技術長"];
const DISPLAY_LEVELS: DisplayLevel[] = ["技師職人", "技術長", "準技師", "實習技師"];

export default function StaffPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [staff, setStaff] = useState<AdminStaff[]>(ADMIN_STAFF);
  const [editStaff, setEditStaff] = useState<AdminStaff | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("ST01");
  const [showCommissionTable, setShowCommissionTable] = useState(false);
  const [commissionTable, setCommissionTable] = useState<CommissionTable>(DEFAULT_COMMISSION_TABLE);
  const [editingCell, setEditingCell] = useState<{ serviceId: string; level: InternalLevel } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [newStaff, setNewStaff] = useState<Partial<AdminStaff>>({
    internalLevel: "初階老師",
    displayLevel: "技師職人",
    storeId: "ST01",
    employmentType: "承攬制",
    baseSalary: 0,
    commissionPerSession: 500,
    positionAllowance: 0,
    allowedServiceIds: [],
  });

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const filteredStaff = staff.filter(s => s.storeId === selectedStoreId);

  const saveEdit = () => {
    if (!editStaff) return;
    setStaff(prev => prev.map(s => s.id === editStaff.id ? editStaff : s));
    setEditStaff(null);
  };

  const addNewStaff = () => {
    const id = `S${String(staff.length + 1).padStart(3, "0")}`;
    setStaff(prev => [...prev, { ...newStaff, id, username: `staff${staff.length + 1}`, allowedServiceIds: newStaff.allowedServiceIds ?? [] } as AdminStaff]);
    setShowAddModal(false);
    setNewStaff({ internalLevel: "初階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 500, positionAllowance: 0, allowedServiceIds: [] });
  };

  const toggleServiceForStaff = (staffObj: AdminStaff, serviceId: string) => {
    const current = staffObj.allowedServiceIds ?? [];
    const updated = current.includes(serviceId) ? current.filter(id => id !== serviceId) : [...current, serviceId];
    setEditStaff(prev => prev ? { ...prev, allowedServiceIds: updated } : null);
  };

  const toggleServiceForNew = (serviceId: string) => {
    const current = newStaff.allowedServiceIds ?? [];
    const updated = current.includes(serviceId) ? current.filter(id => id !== serviceId) : [...current, serviceId];
    setNewStaff(p => ({ ...p, allowedServiceIds: updated }));
  };

  const startEditCell = (serviceId: string, level: InternalLevel) => {
    setEditingCell({ serviceId, level });
    setCellValue(String(commissionTable[serviceId]?.[level] ?? 0));
  };

  const saveCell = () => {
    if (!editingCell) return;
    const val = parseInt(cellValue) || 0;
    setCommissionTable(prev => ({
      ...prev,
      [editingCell.serviceId]: {
        ...prev[editingCell.serviceId],
        [editingCell.level]: val,
      },
    }));
    setEditingCell(null);
  };

  // Get effective commission for a staff at a service
  const getEffectiveCommission = (s: AdminStaff, serviceId: string): number => {
    return commissionTable[serviceId]?.[s.internalLevel] ?? s.commissionPerSession;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">員工管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">共 {filteredStaff.length} 位員工</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm">
          + 新增員工
        </button>
      </div>

      {/* Store tabs */}
      <div className="flex gap-2 mb-4">
        {ADMIN_STORES.map(s => (
          <button key={s.id} onClick={() => setSelectedStoreId(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              selectedStoreId === s.id ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
            }`}>
            {s.name}
          </button>
        ))}
      </div>

      {/* Commission table section */}
      <div className="bg-white rounded-2xl border border-[#e8ddd2] mb-4 overflow-hidden">
        <button
          onClick={() => setShowCommissionTable(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div>
            <span className="text-sm font-medium text-[#1c1c1c]">各層級抽成費率設定</span>
            <span className="text-xs text-[#8a7a6e] ml-2">（點擊金額可編輯）</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8b6748" strokeWidth="1.5"
            style={{ transform: showCommissionTable ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showCommissionTable && (
          <div className="px-5 pb-5">
            <p className="text-xs text-[#8a7a6e] mb-3">
              依員工內部職級 × 服務品項設定每筆抽成金額（元）。員工升級後，抽成費率自動更新。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-3 text-[#8a7a6e] font-medium whitespace-nowrap min-w-[120px]">服務品項</th>
                    {INTERNAL_LEVELS.map(level => (
                      <th key={level} className="text-center py-2 px-2 text-[#8a7a6e] font-medium whitespace-nowrap min-w-[72px]">
                        {level}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_SERVICES.map(svc => (
                    <tr key={svc.id} className="border-t border-[#f0e8df]">
                      <td className="py-2 pr-3 text-[#1c1c1c] font-medium whitespace-nowrap">
                        <div>{svc.name}</div>
                        <div className="text-[10px] text-[#8a7a6e]">{svc.duration}分鐘</div>
                      </td>
                      {INTERNAL_LEVELS.map(level => {
                        const isEditing = editingCell?.serviceId === svc.id && editingCell?.level === level;
                        const amount = commissionTable[svc.id]?.[level] ?? 0;
                        return (
                          <td key={level} className="py-2 px-1 text-center">
                            {isEditing ? (
                              <input
                                autoFocus
                                type="number"
                                value={cellValue}
                                onChange={e => setCellValue(e.target.value)}
                                onBlur={saveCell}
                                onKeyDown={e => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setEditingCell(null); }}
                                className="w-16 px-1 py-1 border border-[#8b6748] rounded-lg text-center text-xs focus:outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => startEditCell(svc.id, level)}
                                className="w-full py-1.5 rounded-lg bg-[#faf7f2] hover:bg-[#f0e8df] text-[#8b6748] font-semibold transition-colors"
                              >
                                ${amount}
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
            <p className="text-[10px] text-[#8a7a6e] mt-3">
              💡 點擊任一金額格可直接編輯，按 Enter 或點擊其他位置儲存。費率調整後立即生效於費用計算。
            </p>
          </div>
        )}
      </div>

      {/* Staff list */}
      <div className="space-y-3">
        {filteredStaff.map(s => {
          const store = ADMIN_STORES.find(st => st.id === s.storeId);
          const allowedServices = ADMIN_SERVICES.filter(sv => (s.allowedServiceIds ?? []).includes(sv.id));
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2]">
                      {s.displayLevel}
                    </span>
                  </div>
                  <div className="text-xs text-[#8a7a6e] space-y-0.5">
                    <div>內部職級：<span className="font-medium text-[#1c1c1c]">{s.internalLevel}</span></div>
                    <div>所屬門市：{store?.name}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.employmentType === "僱傭制" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{s.employmentType}</span>
                      {s.employmentType === "僱傭制" && <span>底薪 ${s.baseSalary.toLocaleString()}</span>}
                      {s.positionAllowance > 0 && <span>加給 ${s.positionAllowance.toLocaleString()}</span>}
                    </div>
                    <div>帳號：{s.username}</div>
                  </div>

                  {/* Per-service commission rates for this staff's level */}
                  {allowedServices.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#f0e8df]">
                      <div className="text-[10px] text-[#8a7a6e] mb-1">
                        各品項抽成（{s.internalLevel}）
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allowedServices.map(svc => (
                          <div key={svc.id} className="text-[10px] bg-[#faf7f2] rounded-lg px-2 py-1 border border-[#e8ddd2]">
                            <span className="text-[#1c1c1c]">{svc.name}</span>
                            <span className="text-[#8b6748] font-semibold ml-1">
                              ${getEffectiveCommission(s, svc.id).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setEditStaff({ ...s })}
                  className="px-3 py-1.5 border border-[#e8ddd2] text-[#8a7a6e] rounded-lg text-xs ml-3">
                  編輯
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit staff modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">編輯員工 - {editStaff.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">姓名</label>
                <input value={editStaff.name}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">內部職級</label>
                <select value={editStaff.internalLevel}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, internalLevel: e.target.value as InternalLevel } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                  {INTERNAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Show effective commissions for selected level */}
              <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e8ddd2]">
                <div className="text-xs text-[#8a7a6e] font-medium mb-2">此職級的各品項抽成預覽</div>
                <div className="space-y-1">
                  {ADMIN_SERVICES.map(svc => (
                    <div key={svc.id} className="flex justify-between text-xs">
                      <span className="text-[#8a7a6e]">{svc.name}</span>
                      <span className="font-semibold text-[#8b6748]">
                        ${(commissionTable[svc.id]?.[editStaff.internalLevel] ?? 0).toLocaleString()}／筆
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#8a7a6e] mt-2">如需調整，請至「各層級抽成費率設定」修改</p>
              </div>

              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">對外顯示職級</label>
                <select value={editStaff.displayLevel}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, displayLevel: e.target.value as DisplayLevel } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                  {DISPLAY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">所屬門市</label>
                <select value={editStaff.storeId}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, storeId: e.target.value } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                  {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">聘用制度</label>
                <select value={editStaff.employmentType}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, employmentType: e.target.value as EmploymentType, baseSalary: e.target.value === "承攬制" ? 0 : prev.baseSalary } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                  <option value="承攬制">承攬制（無底薪，純抽成）</option>
                  <option value="僱傭制">僱傭制（底薪 + 抽成）</option>
                </select>
              </div>
              {editStaff.employmentType === "僱傭制" && (
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">底薪（元／月）</label>
                  <input type="number" min={0} value={editStaff.baseSalary}
                    onChange={e => setEditStaff(prev => prev ? { ...prev, baseSalary: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
              )}
              {editStaff.employmentType === "僱傭制" && (
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">職位加給（元／月）</label>
                  <input type="number" min={0} value={editStaff.positionAllowance}
                    onChange={e => setEditStaff(prev => prev ? { ...prev, positionAllowance: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
                </div>
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-2 block">可執行服務</label>
                <div className="space-y-1">
                  {ADMIN_SERVICES.map(sv => {
                    const allowed = (editStaff.allowedServiceIds ?? []).includes(sv.id);
                    return (
                      <label key={sv.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowed} onChange={() => toggleServiceForStaff(editStaff, sv.id)}
                          className="rounded border-[#e8ddd2] accent-[#8b6748]" />
                        <span className="text-xs text-[#1c1c1c]">{sv.name}</span>
                        <span className="text-xs text-[#8a7a6e]">({sv.duration}分)</span>
                        <span className="text-xs text-[#8b6748] font-medium ml-auto">
                          ${(commissionTable[sv.id]?.[editStaff.internalLevel] ?? 0).toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditStaff(null)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* Add staff modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增員工</h3>
            <div className="space-y-3">
              <input placeholder="姓名" value={newStaff.name || ""}
                onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              <select value={newStaff.internalLevel}
                onChange={e => setNewStaff(p => ({ ...p, internalLevel: e.target.value as InternalLevel }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                {INTERNAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              {/* Preview commissions for new staff's level */}
              <div className="bg-[#faf7f2] rounded-xl p-3 border border-[#e8ddd2]">
                <div className="text-xs text-[#8a7a6e] mb-1">此職級抽成預覽</div>
                {ADMIN_SERVICES.slice(0, 3).map(svc => (
                  <div key={svc.id} className="flex justify-between text-xs">
                    <span className="text-[#8a7a6e]">{svc.name}</span>
                    <span className="font-semibold text-[#8b6748]">
                      ${(commissionTable[svc.id]?.[newStaff.internalLevel as InternalLevel] ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-[#8a7a6e] mt-1">…依費率表自動套用</p>
              </div>

              <select value={newStaff.displayLevel}
                onChange={e => setNewStaff(p => ({ ...p, displayLevel: e.target.value as DisplayLevel }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                {DISPLAY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={newStaff.storeId}
                onChange={e => setNewStaff(p => ({ ...p, storeId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={newStaff.employmentType}
                onChange={e => setNewStaff(p => ({ ...p, employmentType: e.target.value as EmploymentType, baseSalary: e.target.value === "承攬制" ? 0 : p.baseSalary }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                <option value="承攬制">承攬制（純抽成）</option>
                <option value="僱傭制">僱傭制（底薪 + 抽成）</option>
              </select>
              {newStaff.employmentType === "僱傭制" && (
                <input type="number" placeholder="底薪（元／月）" value={newStaff.baseSalary || ""}
                  onChange={e => setNewStaff(p => ({ ...p, baseSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-2 block">可執行服務</label>
                <div className="space-y-1">
                  {ADMIN_SERVICES.map(sv => {
                    const allowed = (newStaff.allowedServiceIds ?? []).includes(sv.id);
                    return (
                      <label key={sv.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allowed} onChange={() => toggleServiceForNew(sv.id)}
                          className="rounded border-[#e8ddd2] accent-[#8b6748]" />
                        <span className="text-xs text-[#1c1c1c]">{sv.name}</span>
                        <span className="text-xs text-[#8a7a6e] ml-1">({sv.duration}分)</span>
                        <span className="text-xs text-[#8b6748] font-medium ml-auto">
                          ${(commissionTable[sv.id]?.[newStaff.internalLevel as InternalLevel] ?? 0).toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={addNewStaff} disabled={!newStaff.name} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm disabled:opacity-50">新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
