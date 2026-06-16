"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_SERVICES, AdminService } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

const DURATIONS = [20, 50, 60, 90, 120];

type AddStep = "name" | "duration" | "price" | "confirm_price" | "preview";

export default function ServicesPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [services, setServices] = useState<AdminService[]>(ADMIN_SERVICES);
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>("name");
  const [newService, setNewService] = useState<Partial<AdminService>>({ duration: 60 });
  const [priceConfirm, setPriceConfirm] = useState("");
  const [priceError, setPriceError] = useState(false);

  if (!user) return null;
  if (user.role !== "管理者") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const toggleEnabled = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const startAddFlow = () => {
    setNewService({ duration: 60 });
    setPriceConfirm("");
    setPriceError(false);
    setAddStep("name");
    setShowAddFlow(true);
  };

  const nextStep = () => {
    if (addStep === "name") {
      if (!newService.name?.trim()) return;
      setAddStep("duration");
    } else if (addStep === "duration") {
      setAddStep("price");
    } else if (addStep === "price") {
      if (!newService.price || !newService.memberPrice) return;
      setPriceConfirm("");
      setAddStep("confirm_price");
    } else if (addStep === "confirm_price") {
      if (String(priceConfirm) !== String(newService.price)) {
        setPriceError(true);
        return;
      }
      setPriceError(false);
      setAddStep("preview");
    }
  };

  const saveService = () => {
    const id = `SV${String(services.length + 1).padStart(2, "0")}`;
    setServices(prev => [...prev, { ...newService, id, enabled: false } as AdminService]);
    setShowAddFlow(false);
  };

  const stepLabels: Record<AddStep, string> = {
    name: "步驟 1/5：輸入服務名稱",
    duration: "步驟 2/5：選擇服務時長",
    price: "步驟 3/5：設定價格",
    confirm_price: "步驟 4/5：再次確認定價",
    preview: "步驟 5/5：預覽確認",
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">服務項目</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">共 {services.length} 項服務</p>
        </div>
        <button
          onClick={startAddFlow}
          className="px-4 py-2 bg-[#8b6748] text-white rounded-xl text-sm"
        >
          + 新增服務
        </button>
      </div>

      <div className="space-y-3">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1c1c1c]">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.enabled
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {s.enabled ? "啟用中" : "未啟用"}
                  </span>
                </div>
                <div className="text-xs text-[#8a7a6e]">時長：{s.duration} 分鐘</div>
              </div>
              <button
                onClick={() => toggleEnabled(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                  s.enabled
                    ? "bg-gray-100 text-gray-600 border-gray-200"
                    : "bg-[#8b6748] text-white border-[#8b6748]"
                }`}
              >
                {s.enabled ? "停用" : "啟用"}
              </button>
            </div>
            <div className="flex gap-4 text-xs text-[#8a7a6e]">
              <div>一般價：<span className="text-[#1c1c1c] font-medium">${s.price.toLocaleString()}</span></div>
              <div>會員價：<span className="text-[#8b6748] font-medium">${s.memberPrice.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Add service modal - POS style防呆 flow */}
      {showAddFlow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-xs text-[#8a7a6e] mb-1">{stepLabels[addStep]}</div>
            <div className="w-full bg-[#e8ddd2] rounded-full h-1 mb-5">
              <div
                className="bg-[#8b6748] h-1 rounded-full transition-all"
                style={{ width: `${(["name","duration","price","confirm_price","preview"].indexOf(addStep) + 1) * 20}%` }}
              />
            </div>

            {addStep === "name" && (
              <div>
                <label className="text-sm font-medium text-[#1c1c1c] mb-3 block">服務名稱</label>
                <input
                  autoFocus
                  value={newService.name || ""}
                  onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                  placeholder="例：全身筋膜舒壓"
                  className="w-full px-3 py-3 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                />
              </div>
            )}

            {addStep === "duration" && (
              <div>
                <label className="text-sm font-medium text-[#1c1c1c] mb-3 block">服務時長</label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setNewService(p => ({ ...p, duration: d }))}
                      className={`py-3 rounded-xl text-sm border transition-colors ${
                        newService.duration === d
                          ? "bg-[#8b6748] text-white border-[#8b6748]"
                          : "bg-[#faf7f2] text-[#1c1c1c] border-[#e8ddd2]"
                      }`}
                    >
                      {d} 分鐘
                    </button>
                  ))}
                </div>
              </div>
            )}

            {addStep === "price" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#1c1c1c] block">設定價格</label>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">一般定價</label>
                  <input
                    type="number"
                    value={newService.price || ""}
                    onChange={e => setNewService(p => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="例：3000"
                    className="w-full px-3 py-3 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">會員價</label>
                  <input
                    type="number"
                    value={newService.memberPrice || ""}
                    onChange={e => setNewService(p => ({ ...p, memberPrice: Number(e.target.value) }))}
                    placeholder="例：2500"
                    className="w-full px-3 py-3 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                </div>
              </div>
            )}

            {addStep === "confirm_price" && (
              <div>
                <label className="text-sm font-medium text-[#1c1c1c] mb-1 block">再次輸入一般定價確認</label>
                <p className="text-xs text-[#8a7a6e] mb-3">請再次輸入 ${newService.price?.toLocaleString()} 以確認</p>
                <input
                  autoFocus
                  type="number"
                  value={priceConfirm}
                  onChange={e => { setPriceConfirm(e.target.value); setPriceError(false); }}
                  placeholder="再次輸入定價"
                  className={`w-full px-3 py-3 border rounded-xl text-sm focus:outline-none ${
                    priceError ? "border-red-400 focus:border-red-400" : "border-[#e8ddd2] focus:border-[#8b6748]"
                  }`}
                />
                {priceError && <p className="text-red-500 text-xs mt-1">價格不符，請重新輸入</p>}
              </div>
            )}

            {addStep === "preview" && (
              <div>
                <label className="text-sm font-medium text-[#1c1c1c] mb-3 block">確認新增以下服務</label>
                <div className="bg-[#faf7f2] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">服務名稱</span>
                    <span className="font-medium text-[#1c1c1c]">{newService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">時長</span>
                    <span className="text-[#1c1c1c]">{newService.duration} 分鐘</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">一般定價</span>
                    <span className="text-[#1c1c1c]">${newService.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">會員價</span>
                    <span className="text-[#8b6748]">${newService.memberPrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">狀態</span>
                    <span className="text-gray-500">未啟用（可稍後手動啟用）</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  if (addStep === "name") { setShowAddFlow(false); return; }
                  const steps: AddStep[] = ["name", "duration", "price", "confirm_price", "preview"];
                  const idx = steps.indexOf(addStep);
                  setAddStep(steps[idx - 1]);
                }}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
              >
                {addStep === "name" ? "取消" : "上一步"}
              </button>
              {addStep !== "preview" ? (
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={saveService}
                  className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm"
                >
                  確認新增
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
