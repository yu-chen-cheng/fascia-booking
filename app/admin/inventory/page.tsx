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

export default function InventoryPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProduct[]>(INVENTORY_PRODUCTS);
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | "全部">("全部");
  const [selectedStore, setSelectedStore] = useState<"ST01" | "ST02" | "all">("all");
  const [adjustTarget, setAdjustTarget] = useState<{ product: InventoryProduct; store: "ST01" | "ST02" } | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [searchQ, setSearchQ] = useState("");

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

  const getStock = (p: InventoryProduct, store: "ST01" | "ST02" | "all") => {
    if (store === "all") return p.stockST01 + p.stockST02;
    return store === "ST01" ? p.stockST01 : p.stockST02;
  };

  const isLow = (p: InventoryProduct, store: "ST01" | "ST02" | "all") => {
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

  const brandCounts = BRAND_LIST.reduce((acc, b) => {
    acc[b] = products.filter(p => p.brand === b).length;
    return acc;
  }, {} as Record<ProductBrand, number>);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">貨物管理</h1>
        <p className="text-sm text-[#8a7a6e] mt-1">共 {products.length} 項商品，{lowStockCount > 0 ? <span className="text-red-600 font-medium">{lowStockCount} 項庫存不足</span> : "庫存充足"}</p>
      </div>

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
            <div className="text-xs text-[#8a7a6e] mb-1">庫存售價總值</div>
            <div className="text-xl font-semibold text-green-700">${totalRetailValue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Brand tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["全部", ...BRAND_LIST] as (ProductBrand | "全部")[]).map(b => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                selectedBrand === b
                  ? "bg-[#8b6748] text-white border-[#8b6748]"
                  : "bg-white text-[#8a7a6e] border-[#e8ddd2]"
              }`}
            >
              {b}{b !== "全部" && ` (${brandCounts[b as ProductBrand]})`}
            </button>
          ))}
        </div>
        {/* Store + search row */}
        <div className="flex gap-2">
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value as "ST01" | "ST02" | "all")}
            className="px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          >
            <option value="all">全部門市</option>
            <option value="ST01">小巨蛋店</option>
            <option value="ST02">大安店</option>
          </select>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="搜尋商品名稱…"
            className="flex-1 px-3 py-2 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {filtered.map(p => {
          const totalStock = getStock(p, selectedStore);
          const low = isLow(p, selectedStore);
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-4 ${low ? "border-red-200" : "border-[#e8ddd2]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-[#1c1c1c]">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BRAND_COLORS[p.brand]}`}>
                      {p.brand}
                    </span>
                    {low && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                        庫存不足
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8a7a6e]">
                    單位：{p.unit} · 售價：${p.price.toLocaleString()}
                    {isAdmin && ` · 成本：$${p.cost.toLocaleString()}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {selectedStore === "all" ? (
                    <div className="text-xs space-y-0.5">
                      <div className={`font-medium ${p.stockST01 < p.lowStockThreshold ? "text-red-600" : "text-[#1c1c1c]"}`}>
                        小巨蛋：{p.stockST01} {p.unit}
                      </div>
                      <div className={`font-medium ${p.stockST02 < p.lowStockThreshold ? "text-red-600" : "text-[#1c1c1c]"}`}>
                        大安：{p.stockST02} {p.unit}
                      </div>
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

              {/* Adjust buttons */}
              {selectedStore !== "all" ? (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setAdjustTarget({ product: p, store: selectedStore }); setAdjustQty(1); }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium"
                  >
                    + 入庫
                  </button>
                  <button
                    onClick={() => { setAdjustTarget({ product: p, store: selectedStore }); setAdjustQty(-1); }}
                    className="px-3 py-1.5 bg-[#faf7f2] text-[#8b6748] border border-[#e8ddd2] rounded-lg text-xs font-medium"
                  >
                    − 出庫
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setAdjustTarget({ product: p, store: "ST01" }); setAdjustQty(1); }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs"
                  >
                    小巨蛋 入庫
                  </button>
                  <button
                    onClick={() => { setAdjustTarget({ product: p, store: "ST02" }); setAdjustQty(1); }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs"
                  >
                    大安 入庫
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#8a7a6e]">無符合條件的商品</div>
        )}
      </div>

      {/* Adjust modal */}
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
                <button
                  onClick={() => setAdjustQty(q => q - 1)}
                  className="w-10 h-10 rounded-xl border border-[#e8ddd2] text-lg font-medium text-[#8a7a6e] flex items-center justify-center"
                >−</button>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-[#8b6748]"
                />
                <button
                  onClick={() => setAdjustQty(q => q + 1)}
                  className="w-10 h-10 rounded-xl border border-[#e8ddd2] text-lg font-medium text-[#8a7a6e] flex items-center justify-center"
                >+</button>
              </div>
              {adjustQty !== 0 && (
                <div className="mt-2 text-sm text-center text-[#8a7a6e]">
                  調整後：
                  <span className="font-semibold text-[#1c1c1c] ml-1">
                    {Math.max(0, (adjustTarget.store === "ST01" ? adjustTarget.product.stockST01 : adjustTarget.product.stockST02) + adjustQty)} {adjustTarget.product.unit}
                  </span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a7a6e] mb-1 block">備註（選填）</label>
              <input
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="例：廠商補貨 / 客人購買"
                className="w-full px-3 py-2.5 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAdjustTarget(null); setAdjustQty(0); setAdjustNote(""); }}
                className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]"
              >取消</button>
              <button
                onClick={saveAdjust}
                disabled={adjustQty === 0}
                className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >確認調整</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
