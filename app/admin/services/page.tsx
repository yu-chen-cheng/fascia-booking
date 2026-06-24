"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { ADMIN_SERVICES, ADMIN_STAFF, ADMIN_STORES, AdminService } from "@/lib/adminMockData";
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
  const [selectedStore, setSelectedStore] = useState("");

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

  const toggleOnlineBookable = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, onlineBookable: !s.onlineBookable } : s));
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
      if (!newService.priceRegular || !newService.priceMember || !newService.priceJuniorRegular || !newService.priceInternRegular) return;
      setPriceConfirm("");
      setAddStep("confirm_price");
    } else if (addStep === "confirm_price") {
      if (String(priceConfirm) !== String(newService.priceRegular)) {
        setPriceError(true);
        return;
      }
      setPriceError(false);
      setAddStep("preview");
    }
  };

  const saveService = () => {
    const id = `SV${String(services.length + 1).padStart(2, "0")}`;
    setServices(prev => [...prev, { ...newService, id, enabled: false, onlineBookable: newService.onlineBookable ?? true } as AdminService]);
    setShowAddFlow(false);
  };

  const stepLabels: Record<AddStep, string> = {
    name: "步驟 1/5：輸入服務名稱",
    duration: "步驟 2/5：選擇服務時長",
    price: "步驟 3/5：設定價格",
    confirm_price: "步驟 4/5：再次確認定價",
    preview: "步驟 5/5：預覽確認",
  };

  const storeTabs = [{ id: "", name: "全部" }, ...ADMIN_STORES];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
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

      {/* Store filter tabs */}
      <div className="flex gap-2 mb-5">
        {storeTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStore(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              selectedStore === tab.id
                ? "bg-[#8b6748] text-white border-[#8b6748]"
                : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
            }`}
          >
            {tab.name}
          </button>
        ))}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    s.onlineBookable
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-gray-100 text-gray-400 border-gray-200"
                  }`}>
                    {s.onlineBookable ? "開放網路預約" : "僅現場預約"}
                  </span>
                </div>
                <div className="text-xs text-[#8a7a6e]">時長：{s.duration} 分鐘</div>
              </div>
              <div className="flex flex-col gap-1 items-end">
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
                <button
                  onClick={() => toggleOnlineBookable(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                    s.onlineBookable
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {s.onlineBookable ? "關閉網路預約" : "開放網路預約"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[#8a7a6e] mt-2">
              <div>技師職人 一般：<span className="text-[#1c1c1c] font-medium">${s.priceRegular.toLocaleString()}</span></div>
              <div>技師職人 會員：<span className="text-[#8b6748] font-medium">${s.priceMember.toLocaleString()}</span></div>
              <div>技術長 一般：<span className="text-[#1c1c1c] font-medium">${s.priceSeniorRegular.toLocaleString()}</span></div>
              <div>技術長 會員：<span className="text-[#8b6748] font-medium">${s.priceSeniorMember.toLocaleString()}</span></div>
              <div>準技師 一般：<span className="text-[#1c1c1c] font-medium">${s.priceJuniorRegular.toLocaleString()}</span></div>
              <div>準技師 會員：<span className="text-[#8b6748] font-medium">${s.priceJuniorMember.toLocaleString()}</span></div>
              <div>實習技師 一般：<span className="text-[#1c1c1c] font-medium">${s.priceInternRegular.toLocaleString()}</span></div>
              <div>實習技師 會員：<span className="text-[#8b6748] font-medium">${s.priceInternMember.toLocaleString()}</span></div>
              <div>特約廠商：<span className="text-purple-600 font-medium">${s.priceVendor.toLocaleString()}</span></div>
              <div>親友價：<span className="text-blue-600 font-medium">${s.priceFriend.toLocaleString()}</span></div>
            </div>
            {/* 可執行老師 */}
            <div className="mt-3 pt-3 border-t border-[#f0e8df]">
              <div className="text-xs text-[#8a7a6e] mb-1">
                可執行老師
                {selectedStore !== "" && (
                  <span className="ml-1 text-[#8b6748]">
                    （{ADMIN_STORES.find(st => st.id === selectedStore)?.name}）
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {ADMIN_STAFF.filter(st => st.allowedServiceIds.includes(s.id) && (selectedStore === "" || st.storeId === selectedStore)).map(st => (
                  <span key={st.id} className="text-xs px-2 py-0.5 bg-[#faf7f2] text-[#8b6748] rounded-full border border-[#e8ddd2]">
                    {st.name}
                  </span>
                ))}
                {ADMIN_STAFF.filter(st => st.allowedServiceIds.includes(s.id) && (selectedStore === "" || st.storeId === selectedStore)).length === 0 && (
                  <span className="text-xs text-[#c0b5ac]">此門市尚無可執行老師</span>
                )}
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1c1c1c] block">設定各級定價</label>
                <div className="flex items-center justify-between py-2 px-3 bg-[#faf7f2] rounded-xl border border-[#e8ddd2]">
                  <span className="text-xs text-[#8a7a6e]">開放網路預約</span>
                  <button
                    type="button"
                    onClick={() => setNewService(p => ({ ...p, onlineBookable: !p.onlineBookable }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${newService.onlineBookable ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newService.onlineBookable ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {[
                  { label: "技師職人 一般價", field: "priceRegular" },
                  { label: "技師職人 會員價", field: "priceMember" },
                  { label: "技術長 一般價", field: "priceSeniorRegular" },
                  { label: "技術長 會員價", field: "priceSeniorMember" },
                  { label: "準技師 一般價", field: "priceJuniorRegular" },
                  { label: "準技師 會員價", field: "priceJuniorMember" },
                  { label: "實習技師 一般價", field: "priceInternRegular" },
                  { label: "實習技師 會員價", field: "priceInternMember" },
                  { label: "特約廠商價", field: "priceVendor" },
                  { label: "親友價", field: "priceFriend" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-xs text-[#8a7a6e] mb-1 block">{label}</label>
                    <input
                      type="number"
                      value={(newService as Record<string, unknown>)[field] as number || ""}
                      onChange={e => setNewService(p => ({ ...p, [field]: Number(e.target.value) }))}
                      placeholder="輸入金額"
                      className="w-full px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                    />
                  </div>
                ))}
              </div>
            )}

            {addStep === "confirm_price" && (
              <div>
                <label className="text-sm font-medium text-[#1c1c1c] mb-1 block">再次輸入一般定價確認</label>
                <p className="text-xs text-[#8a7a6e] mb-3">請再次輸入技師職人一般價 ${newService.priceRegular?.toLocaleString()} 以確認</p>
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
                    <span className="text-[#8a7a6e]">技師職人 一般</span>
                    <span className="text-[#1c1c1c]">${newService.priceRegular?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">技師職人 會員</span>
                    <span className="text-[#8b6748]">${newService.priceMember?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">技術長 一般</span>
                    <span className="text-[#1c1c1c]">${newService.priceSeniorRegular?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">技術長 會員</span>
                    <span className="text-[#8b6748]">${newService.priceSeniorMember?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">準技師 一般</span>
                    <span className="text-[#1c1c1c]">${newService.priceJuniorRegular?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">準技師 會員</span>
                    <span className="text-[#8b6748]">${newService.priceJuniorMember?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">實習技師 一般</span>
                    <span className="text-[#1c1c1c]">${newService.priceInternRegular?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">實習技師 會員</span>
                    <span className="text-[#8b6748]">${newService.priceInternMember?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">特約廠商</span>
                    <span className="text-purple-600">${newService.priceVendor?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">親友價</span>
                    <span className="text-blue-600">${newService.priceFriend?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a7a6e]">網路預約</span>
                    <span className={newService.onlineBookable ? "text-blue-600" : "text-gray-500"}>{newService.onlineBookable ? "開放" : "僅現場"}</span>
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
