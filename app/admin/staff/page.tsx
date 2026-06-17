"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_STAFF, ADMIN_STORES, ADMIN_SERVICES, AdminStaff, InternalLevel, DisplayLevel, EmploymentType } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

const INTERNAL_LEVELS: InternalLevel[] = ["實習技師", "準技師", "初階老師", "進階老師", "資深老師", "技術長"];
const DISPLAY_LEVELS: DisplayLevel[] = ["技師職人", "技術長", "準技師", "實習技師"];

export default function StaffPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [staff, setStaff] = useState<AdminStaff[]>(ADMIN_STAFF);
  const [editStaff, setEditStaff] = useState<AdminStaff | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    setEditStaff(prev => prev ? { ...prev, allowedServiceIds: updated } : null);
  };

  const toggleServiceForNew = (serviceId: string) => {
    const current = newStaff.allowedServiceIds ?? [];
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    setNewStaff(p => ({ ...p, allowedServiceIds: updated }));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">員工管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">共 {staff.length} 位員工</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm"
        >
          + 新增員工
        </button>
      </div>

      <div className="space-y-3">
        {staff.map(s => {
          const store = ADMIN_STORES.find(st => st.id === s.storeId);
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2]">
                      {s.displayLevel}
                    </span>
                  </div>
                  <div className="text-xs text-[#8a7a6e] space-y-0.5">
                    <div>內部職級：{s.internalLevel}</div>
                    <div>所屬門市：{store?.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.employmentType === "僱傭制" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{s.employmentType}</span>
                      {s.employmentType === "僱傭制" && <span>底薪 ${s.baseSalary.toLocaleString()}</span>}
                      <span>抽成 ${s.commissionPerSession.toLocaleString()}／筆</span>
                      {s.positionAllowance > 0 && <span>加給 ${s.positionAllowance.toLocaleString()}</span>}
                    </div>
                    <div>帳號：{s.username}</div>
                    <div className="mt-1">
                      <span className="text-[#8a7a6e]">可執行服務：</span>
                      <span className="text-[#1c1c1c]">
                        {(s.allowedServiceIds ?? []).length > 0
                          ? (s.allowedServiceIds ?? []).map(id => ADMIN_SERVICES.find(sv => sv.id === id)?.name).filter(Boolean).join("、")
                          : "未設定"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditStaff({ ...s })}
                  className="px-3 py-1.5 border border-[#e8ddd2] text-[#8a7a6e] rounded-lg text-xs"
                >
                  編輯
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">編輯員工 - {editStaff.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">姓名</label>
                <input
                  value={editStaff.name}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">內部職級</label>
                <select
                  value={editStaff.internalLevel}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, internalLevel: e.target.value as InternalLevel } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  {INTERNAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">對外顯示職級</label>
                <select
                  value={editStaff.displayLevel}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, displayLevel: e.target.value as DisplayLevel } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  {DISPLAY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">所屬門市</label>
                <select
                  value={editStaff.storeId}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, storeId: e.target.value } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">聘用制度</label>
                <select
                  value={editStaff.employmentType}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, employmentType: e.target.value as EmploymentType, baseSalary: e.target.value === "承攬制" ? 0 : prev.baseSalary } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                >
                  <option value="承攬制">承攬制（無底薪，純抽成）</option>
                  <option value="僱傭制">僱傭制（底薪 + 抽成）</option>
                </select>
              </div>
              {editStaff.employmentType === "僱傭制" && (
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">底薪（元／月）</label>
                  <input
                    type="number"
                    min={0}
                    value={editStaff.baseSalary}
                    onChange={e => setEditStaff(prev => prev ? { ...prev, baseSalary: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">每筆固定抽成（元）</label>
                <input
                  type="number"
                  min={0}
                  value={editStaff.commissionPerSession}
                  onChange={e => setEditStaff(prev => prev ? { ...prev, commissionPerSession: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
              {editStaff.employmentType === "僱傭制" && (
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">職位加給（元／月）</label>
                  <input
                    type="number"
                    min={0}
                    value={editStaff.positionAllowance}
                    onChange={e => setEditStaff(prev => prev ? { ...prev, positionAllowance: Number(e.target.value) } : null)}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-2 block">可執行服務</label>
                <div className="space-y-1">
                  {ADMIN_SERVICES.map(sv => {
                    const allowed = (editStaff.allowedServiceIds ?? []).includes(sv.id);
                    return (
                      <label key={sv.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowed}
                          onChange={() => toggleServiceForStaff(editStaff, sv.id)}
                          className="rounded border-[#e8ddd2] accent-[#8b6748]"
                        />
                        <span className="text-xs text-[#1c1c1c]">{sv.name}</span>
                        <span className="text-xs text-[#8a7a6e]">({sv.duration}分)</span>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">新增員工</h3>
            <div className="space-y-3">
              <input
                placeholder="姓名"
                value={newStaff.name || ""}
                onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
              <select
                value={newStaff.internalLevel}
                onChange={e => setNewStaff(p => ({ ...p, internalLevel: e.target.value as InternalLevel }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              >
                {INTERNAL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={newStaff.displayLevel}
                onChange={e => setNewStaff(p => ({ ...p, displayLevel: e.target.value as DisplayLevel }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              >
                {DISPLAY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={newStaff.storeId}
                onChange={e => setNewStaff(p => ({ ...p, storeId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              >
                {ADMIN_STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={newStaff.employmentType}
                onChange={e => setNewStaff(p => ({ ...p, employmentType: e.target.value as EmploymentType, baseSalary: e.target.value === "承攬制" ? 0 : p.baseSalary }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              >
                <option value="承攬制">承攬制（無底薪，純抽成）</option>
                <option value="僱傭制">僱傭制（底薪 + 抽成）</option>
              </select>
              {newStaff.employmentType === "僱傭制" && (
                <input
                  type="number"
                  placeholder="底薪（元／月）"
                  value={newStaff.baseSalary || ""}
                  onChange={e => setNewStaff(p => ({ ...p, baseSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              )}
              <input
                type="number"
                placeholder="每筆固定抽成（元）"
                value={newStaff.commissionPerSession || ""}
                onChange={e => setNewStaff(p => ({ ...p, commissionPerSession: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
              {newStaff.employmentType === "僱傭制" && (
                <input
                  type="number"
                  placeholder="職位加給（元／月），無則填 0"
                  value={newStaff.positionAllowance ?? ""}
                  onChange={e => setNewStaff(p => ({ ...p, positionAllowance: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              )}
              <div>
                <label className="text-xs text-[#8a7a6e] mb-2 block">可執行服務</label>
                <div className="space-y-1">
                  {ADMIN_SERVICES.map(sv => {
                    const allowed = (newStaff.allowedServiceIds ?? []).includes(sv.id);
                    return (
                      <label key={sv.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowed}
                          onChange={() => toggleServiceForNew(sv.id)}
                          className="rounded border-[#e8ddd2] accent-[#8b6748]"
                        />
                        <span className="text-xs text-[#1c1c1c]">{sv.name}</span>
                        <span className="text-xs text-[#8a7a6e]">({sv.duration}分)</span>
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
