"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { INVENTORY_PRODUCTS, ADMIN_STORES, InventoryProduct, ProductBrand } from "@/lib/adminMockData";
import { useRouter } from "next/navigation";

const BRAND_COLORS: Record<ProductBrand, string> = {
  "法夏嚴選": "bg-[#faf7f2] text-[#8b6748] border-[#e8ddd2]",
  "Sissel": "bg-blue-50 text-blue-700 border-blue-200",
  "黃金甲": "bg-amber-50 text-amber-700 border-amber-200",
};

const BRAND_LIST: ProductBrand[] = ["法夏嚴選", "Sissel", "黃金甲"];

type StoreId = "ST01" | "ST02";
type TabType = "庫存清單" | "盤點" | "調撥";

interface TransferRequest {
  id: string;
  productId: string;
  productName: string;
  fromStore: StoreId;
  toStore: StoreId;
  qty: number;
  note: string;
  status: "待處理" | "已完成" | "已拒絕";
  createdAt: string;
}

export default function InventoryPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("庫存清單");
  const [products, setProducts] = useState<InventoryProduct[]>(INVENTORY_PRODUCTS);
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | "全部">("全部");
  const [selectedStore, setSelectedStore] = useState<StoreId | "all">("all");
  const [searchQ, setSearchQ] = useState("");

  // Adjust modal (庫存清單)
  const [adjustTarget, setAdjustTarget] = useState<{ product: InventoryProduct; store: StoreId } | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");

  // 盤點 tab
  const [countStore, setCountStore] = useState<StoreId>("ST01");
  const [actualCounts, setActualCounts] = useState<Record<string, number>>({});
  const [countSubmitted, setCountSubmitted] = useState(false);
  const [accountantEmail, setAccountantEmail] = useState("accountant@fascia.tw");
  const [emailSent, setEmailSent] = useState(false);

  // 調撥 tab
  const [transfers, setTransfers] = useState<TransferRequest[]>([
    {
      id: "t1",
      productId: "P02",
      productName: "Sissel 筋膜球 Standard",
      fromStore: "ST01",
      toStore: "ST02",
      qty: 3,
      note: "大安店備貨不足",
      status: "待處理",
      createdAt: "2026-06-28",
    },
  ]);
  const [transferModal, setTransferModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    productId: "",
    fromStore: "ST01" as StoreId,
    toStore: "ST02" as StoreId,
    qty: 1,
    note: "",
  });

  if (!user) return null;
  if (user.role !== "管理者" && user.role !== "店長") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const isAdmin = user.role === "管理者";

  const filtered = products.filter(p => {
    const brandOk = selectedBrand === "全部" || p.brand === selectedBrand;
    const searchOk = searchQ === "" || p.name.includes(searchQ);
    return brandOk && searchOk;
  });

  const getStock = (p: InventoryProduct, store: StoreId | "all") => {
    if (store === "all") return p.stockST01 + p.stockST02;
    return store === "ST01" ? p.stockST01 : p.stockST02;
  };

  const isLow = (p: InventoryProduct, store: StoreId | "all") => {
    if (store === "all") return p.stockST01 < p.lowStockThreshold || p.stockST02 < p.lowStockThreshold;
    return getStock(p, store) < p.lowStockThreshold;
  };

  const lowStockCount = products.filter(p => isLow(p, selectedStore)).length;
  const totalInventoryValue = products.reduce((s, p) => s + (p.stockST01 + p.stockST02) * p.cost, 0);
  const totalRetailValue = products.reduce((s, p) => s + (p.stockST01 + p.stockST02) * p.price, 0);

  const saveAdjust = () => {
    if (!adjustTarget) return;
    setProducts(prev => prev.map(p => {
      if (p.id !== adjustTarget.product.id) return p;
      if (adjustTarget.store === "ST01") return { ...p, stockST01: Math.max(0, p.stockST01 + adjustQty) };
      return { ...p, stockST02: Math.max(0, p.stockST02 + adjustQty) };
    }));
    setAdjustTarget(null);
    setAdjustQty(0);
    setAdjustNote("");
  };

  // 盤點提交：用填入的實際數量更新庫存
  const submitCount = () => {
    setProducts(prev => prev.map(p => {
      const key = `${p.id}-${countStore}`;
      if (actualCounts[key] !== undefined) {
        const newQty = actualCounts[key];
        if (countStore === "ST01") return { ...p, stockST01: newQty };
        return { ...p, stockST02: newQty };
      }
      return p;
    }));
    setCountSubmitted(true);
  };

  const sendLowStockEmail = () => {
    // In production: call API to send email
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const submitTransfer = () => {
    const product = products.find(p => p.id === newTransfer.productId);
    if (!product) return;
    setTransfers(prev => [...prev, {
      id: `t${Date.now()}`,
      productId: newTransfer.productId,
      productName: product.name,
      fromStore: newTransfer.fromStore,
      toStore: newTransfer.toStore,
      qty: newTransfer.qty,
      note: newTransfer.note,
      status: "待處理",
      createdAt: new Date().toISOString().slice(0, 10),
    }]);
    setTransferModal(false);
    setNewTransfer({ productId: "", fromStore: "ST01", toStore: "ST02", qty: 1, note: "" });
  };

  const completeTransfer = (tid: string) => {
    const t = transfers.find(x => x.id === tid);
    if (!t) return;
    // Update stock
    setProducts(prev => prev.map(p => {
      if (p.id !== t.productId) return p;
      const fromST01 = t.fromStore === "ST01";
      const newST01 = fromST01 ? Math.max(0, p.stockST01 - t.qty) : p.stockST01 + t.qty;
      const newST02 = fromST01 ? p.stockST02 + t.qty : Math.max(0, p.stockST02 - t.qty);
      return { ...p, stockST01: newST01, stockST02: newST02 };
    }));
    setTransfers(prev => prev.map(x => x.id === tid ? { ...x, status: "已完成" } : x));
  };

  const storeName = (id: StoreId) => ADMIN_STORES.find(s => s.id === id)?.name || id;
  const brandCounts = BRAND_LIST.reduce((acc, b) => {
    acc[b] = products.filter(p => p.brand === b).length;
    return acc;
  }, {} as Record<ProductBrand, number>);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1c1c1c]">貨物管理</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">
            共 {products.length} 項商品
            {lowStockCount > 0 && <>，<span className="text-red-600 font-medium">{lowStockCount} 項庫存不足</span></>}
          </p>
        </div>
        {lowStockCount > 0 && (
          <button
            onClick={sendLowStockEmail}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              emailSent
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {emailSent ? "✓ 已發送" : "📧 通知會計"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f0e8] rounded-xl p-1 mb-5">
        {(["庫存清單", "盤點", "調撥"] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setCountSubmitted(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white text-[#8b6748] shadow-sm" : "text-[#8a7a6e]"
            }`}
          >
            {t}
            {t === "調撥" && transfers.filter(x => x.status === "待處理").length > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {transfers.filter(x => x.status === "待處理").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== 庫存清單 Tab ===== */}
      {tab === "庫存清單" && (
        <>
          {/* Low stock alert */}
          {lowStockCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <div className="text-sm font-medium text-red-700 mb-2">⚠ 以下商品庫存不足，請盡快補貨：</div>
              <div className="space-y-1">
                {products.filter(p => isLow(p, selectedStore)).map(p => (
                  <div key={p.id} className="text-xs text-red-600 flex justify-between">
                    <span>{p.name}</span>
                    <span>
                      {selectedStore === "all"
                        ? `小巨蛋:${p.stockST01} / 大安:${p.stockST02}`
                        : `${getStock(p, selectedStore)} ${p.unit}`}（警戒：{p.lowStockThreshold}）
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {isAdmin && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
                <div className="text-xs text-[#8a7a6e] mb-1">商品種類</div>
                <div className="text-xl font-semibold text-[#1c1c1c]">{products.length} 項</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
                <div className="text-xs text-[#8a7a6e] mb-1">庫存成本</div>
                <div className="text-xl font-semibold text-[#8b6748]">${totalInventoryValue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
                <div className="text-xs text-[#8a7a6e] mb-1">庫存售價</div>
                <div className="text-xl font-semibold text-green-700">${totalRetailValue.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["全部", ...BRAND_LIST] as (ProductBrand | "全部")[]).map(b => (
                <button key={b} onClick={() => setSelectedBrand(b)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    selectedBrand === b ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
                  }`}
                >
                  {b}{b !== "全部" && ` (${brandCounts[b as ProductBrand]})`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={selectedStore} onChange={e => setSelectedStore(e.target.value as StoreId | "all")}
                className="px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                <option value="all">全部門市</option>
                <option value="ST01">小巨蛋店</option>
                <option value="ST02">大安店</option>
              </select>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="搜尋商品名稱…"
                className="flex-1 px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
            </div>
          </div>

          {/* Product list */}
          <div className="space-y-2">
            {filtered.map(p => {
              const totalStock = getStock(p, selectedStore);
              const low = isLow(p, selectedStore);
              return (
                <div key={p.id} className={`bg-white rounded-2xl border p-4 ${low ? "border-red-200" : "border-[#e8ddd2]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-[#1c1c1c]">{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BRAND_COLORS[p.brand]}`}>{p.brand}</span>
                        {low && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">庫存不足</span>}
                      </div>
                      <div className="text-xs text-[#8a7a6e]">
                        單位：{p.unit} · 售價：${p.price.toLocaleString()}
                        {isAdmin && ` · 成本：$${p.cost.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {selectedStore === "all" ? (
                        <div className="text-xs space-y-0.5">
                          <div className={`font-medium ${p.stockST01 < p.lowStockThreshold ? "text-red-600" : "text-[#1c1c1c]"}`}>小巨蛋：{p.stockST01} {p.unit}</div>
                          <div className={`font-medium ${p.stockST02 < p.lowStockThreshold ? "text-red-600" : "text-[#1c1c1c]"}`}>大安：{p.stockST02} {p.unit}</div>
                          <div className="text-[#8a7a6e]">合計：{totalStock} {p.unit}</div>
                        </div>
                      ) : (
                        <div className={`text-lg font-bold ${low ? "text-red-600" : "text-[#1c1c1c]"}`}>
                          {totalStock} <span className="text-sm font-normal text-[#8a7a6e]">{p.unit}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-[#8a7a6e] mt-0.5">警戒：{p.lowStockThreshold}</div>
                    </div>
                  </div>
                  {selectedStore !== "all" ? (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setAdjustTarget({ product: p, store: selectedStore as StoreId }); setAdjustQty(1); }}
                        className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium">+ 入庫</button>
                      <button onClick={() => { setAdjustTarget({ product: p, store: selectedStore as StoreId }); setAdjustQty(-1); }}
                        className="px-3 py-1.5 bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2] rounded-lg text-xs font-medium">− 出庫</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setAdjustTarget({ product: p, store: "ST01" }); setAdjustQty(1); }}
                        className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs">小巨蛋 入庫</button>
                      <button onClick={() => { setAdjustTarget({ product: p, store: "ST02" }); setAdjustQty(1); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs">大安 入庫</button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-12 text-sm text-[#8a7a6e]">無符合條件的商品</div>}
          </div>
        </>
      )}

      {/* ===== 盤點 Tab ===== */}
      {tab === "盤點" && (
        <div>
          {/* Store selector */}
          <div className="flex gap-2 mb-4">
            {(["ST01", "ST02"] as StoreId[]).map(sid => (
              <button key={sid} onClick={() => { setCountStore(sid); setCountSubmitted(false); setActualCounts({}); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  countStore === sid ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
                }`}
              >
                {storeName(sid)}
              </button>
            ))}
          </div>

          {countSubmitted ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14L11 20L23 8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-[#1c1c1c] mb-1">盤點完成</p>
              <p className="text-sm text-[#8a7a6e] mb-4">{storeName(countStore)} 庫存已更新</p>
              <button onClick={() => { setCountSubmitted(false); setActualCounts({}); }}
                className="px-5 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium">再次盤點</button>
            </div>
          ) : (
            <>
              <div className="bg-[#faf7f2] border border-[#e8ddd2] rounded-xl px-4 py-3 mb-4 text-xs text-[#8a7a6e]">
                請清點 {storeName(countStore)} 的實際庫存數量並填入下方。若與系統數量不同，儲存後將自動更新。
              </div>

              <div className="space-y-2 mb-5">
                {products.map(p => {
                  const systemQty = countStore === "ST01" ? p.stockST01 : p.stockST02;
                  const key = `${p.id}-${countStore}`;
                  const actual = actualCounts[key];
                  const diff = actual !== undefined ? actual - systemQty : 0;
                  const hasDiff = actual !== undefined && diff !== 0;
                  return (
                    <div key={p.id} className={`bg-white rounded-2xl border p-4 ${hasDiff ? (diff < 0 ? "border-red-200" : "border-green-200") : "border-[#e8ddd2]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1c1c1c] truncate">{p.name}</p>
                          <p className="text-xs text-[#8a7a6e]">系統：{systemQty} {p.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDiff && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              diff > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                          <input
                            type="number"
                            min="0"
                            value={actual ?? ""}
                            onChange={e => {
                              const v = e.target.value === "" ? undefined : Number(e.target.value);
                              setActualCounts(prev => {
                                const next = { ...prev };
                                if (v === undefined) delete next[key]; else next[key] = v;
                                return next;
                              });
                            }}
                            placeholder={String(systemQty)}
                            className={`w-20 text-center py-2 border rounded-xl text-sm font-semibold focus:outline-none ${
                              hasDiff ? (diff < 0 ? "border-red-300 focus:border-red-500" : "border-green-300 focus:border-green-500") : "border-[#e8ddd2] focus:border-[#8b6748]"
                            }`}
                          />
                          <span className="text-xs text-[#8a7a6e] w-5">{p.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Email alert setting */}
              <div className="bg-white border border-[#e8ddd2] rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#8a7a6e] mb-2">庫存警示通知信箱（低於安全庫存時發送）</p>
                <div className="flex gap-2">
                  <input
                    value={accountantEmail}
                    onChange={e => setAccountantEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
                  />
                  <button
                    onClick={sendLowStockEmail}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      emailSent ? "bg-green-50 border-green-300 text-green-700" : "bg-[#faf7f2] border-[#e8ddd2] text-[#8b6748]"
                    }`}
                  >
                    {emailSent ? "✓ 已發送" : "測試發送"}
                  </button>
                </div>
              </div>

              <button
                onClick={submitCount}
                disabled={Object.keys(actualCounts).length === 0}
                className="w-full py-4 bg-[#8b6748] text-white text-base font-medium rounded-2xl shadow-md disabled:opacity-40"
              >
                提交盤點結果
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== 調撥 Tab ===== */}
      {tab === "調撥" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setTransferModal(true)}
              className="px-4 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium"
            >
              + 發起調撥
            </button>
          </div>

          {/* Transfer list */}
          <div className="space-y-3">
            {transfers.length === 0 && (
              <div className="text-center py-12 text-sm text-[#8a7a6e]">目前沒有調撥記錄</div>
            )}
            {transfers.map(t => (
              <div key={t.id} className={`bg-white rounded-2xl border p-4 ${
                t.status === "待處理" ? "border-amber-200" : t.status === "已完成" ? "border-green-200" : "border-gray-200"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#1c1c1c]">{t.productName}</p>
                    <p className="text-xs text-[#8a7a6e] mt-0.5">
                      {storeName(t.fromStore)} → {storeName(t.toStore)} · {t.qty} 件
                    </p>
                    {t.note && <p className="text-xs text-[#8a7a6e] mt-0.5">備註：{t.note}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.status === "待處理" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    t.status === "已完成" ? "bg-green-50 text-green-700 border border-green-200" :
                    "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#8a7a6e]">{t.createdAt}</p>
                  {t.status === "待處理" && isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTransfers(prev => prev.map(x => x.id === t.id ? { ...x, status: "已拒絕" } : x))}
                        className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs"
                      >
                        拒絕
                      </button>
                      <button
                        onClick={() => completeTransfer(t.id)}
                        className="px-3 py-1.5 bg-[#8b6748] text-white rounded-lg text-xs font-medium"
                      >
                        確認調撥
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Adjust Modal ===== */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-1">調整庫存</h3>
            <p className="text-sm text-[#8a7a6e] mb-4">
              {adjustTarget.product.name}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2]">
                {adjustTarget.store === "ST01" ? "小巨蛋店" : "大安店"}
              </span>
            </p>
            <div className="mb-4">
              <div className="text-xs text-[#8a7a6e] mb-1">目前庫存</div>
              <div className="text-2xl font-semibold text-[#1c1c1c] mb-3">
                {adjustTarget.store === "ST01" ? adjustTarget.product.stockST01 : adjustTarget.product.stockST02} {adjustTarget.product.unit}
              </div>
              <label className="text-sm font-medium text-[#1c1c1c] mb-2 block">調整數量（正數＝入庫，負數＝出庫）</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setAdjustQty(q => q - 1)}
                  className="w-10 h-10 rounded-xl border border-[#e8ddd2] text-lg font-medium text-[#8a7a6e] flex items-center justify-center">−</button>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-[#8b6748]" />
                <button onClick={() => setAdjustQty(q => q + 1)}
                  className="w-10 h-10 rounded-xl border border-[#e8ddd2] text-lg font-medium text-[#8a7a6e] flex items-center justify-center">+</button>
              </div>
              {adjustQty !== 0 && (
                <div className="mt-2 text-sm text-center text-[#8a7a6e]">
                  調整後：<span className="font-semibold text-[#1c1c1c] ml-1">
                    {Math.max(0, (adjustTarget.store === "ST01" ? adjustTarget.product.stockST01 : adjustTarget.product.stockST02) + adjustQty)} {adjustTarget.product.unit}
                  </span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a7a6e] mb-1 block">備註（選填）</label>
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="例：廠商補貨 / 客人購買"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setAdjustTarget(null); setAdjustQty(0); setAdjustNote(""); }}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={saveAdjust} disabled={adjustQty === 0}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-50">確認調整</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Transfer Modal ===== */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-[#1c1c1c] mb-4">發起調撥申請</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">商品</label>
                <select value={newTransfer.productId} onChange={e => setNewTransfer(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                  <option value="">選擇商品</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">從（出貨門市）</label>
                  <select value={newTransfer.fromStore} onChange={e => setNewTransfer(p => ({ ...p, fromStore: e.target.value as StoreId }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                    <option value="ST01">小巨蛋店</option>
                    <option value="ST02">大安店</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#8a7a6e] mb-1 block">到（收貨門市）</label>
                  <select value={newTransfer.toStore} onChange={e => setNewTransfer(p => ({ ...p, toStore: e.target.value as StoreId }))}
                    className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]">
                    <option value="ST02">大安店</option>
                    <option value="ST01">小巨蛋店</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">調撥數量</label>
                <input type="number" min="1" value={newTransfer.qty}
                  onChange={e => setNewTransfer(p => ({ ...p, qty: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              </div>
              <div>
                <label className="text-xs text-[#8a7a6e] mb-1 block">備註</label>
                <input value={newTransfer.note} onChange={e => setNewTransfer(p => ({ ...p, note: e.target.value }))}
                  placeholder="說明調撥原因…"
                  className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTransferModal(false)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={submitTransfer} disabled={!newTransfer.productId}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-40">送出申請</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
