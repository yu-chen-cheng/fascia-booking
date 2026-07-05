"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

// Service display names + order
const SERVICE_ITEMS = [
  { keys: ["training-smart", "50min"], label: "智能訓練" },
  { keys: ["basic-60", "60min"],       label: "60分鐘基礎筋膜放鬆" },
  { keys: ["refined-90", "90min"],     label: "90分鐘筋膜放鬆" },
  { keys: ["premium-120", "120min"],   label: "120分鐘 筋膜結構整合訓練" },
  { keys: ["addon-15", "plus15min"],   label: "15分鐘加購時間" },
];

interface CheckoutRow {
  service_key: string | null;
  service_name: string | null;
  staff_commission: number;
  addon_products: Array<{ name: string; price: number }>;
}

interface ServiceStat {
  label: string;
  count: number;
  total: number;
}

interface ProductStat {
  name: string;
  count: number;
  total: number;
}

export default function MyReportPage() {
  const { user } = useAdmin();
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [services, setServices]   = useState<ServiceStat[]>([]);
  const [products, setProducts]   = useState<ProductStat[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const monthStart = `${year}-${String(month+1).padStart(2,"0")}-01`;
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const monthEnd = `${nextY}-${String(nextM+1).padStart(2,"0")}-01`;

      const { data } = await supabase
        .from("service_checkouts")
        .select("service_key,service_name,staff_commission,addon_products")
        .eq("staff_id", user.id)
        .gte("created_at", monthStart)
        .lt("created_at", monthEnd);

      const rows = (data ?? []) as CheckoutRow[];

      // Group by service
      const svcMap: Record<string, { count: number; total: number }> = {};
      rows.forEach(r => {
        const key = r.service_key ?? "";
        if (!svcMap[key]) svcMap[key] = { count: 0, total: 0 };
        svcMap[key].count++;
        svcMap[key].total += r.staff_commission ?? 0;
      });

      const svcStats = SERVICE_ITEMS.map(item => {
        const stat = item.keys.reduce((acc, k) => {
          const s = svcMap[k];
          if (s) { acc.count += s.count; acc.total += s.total; }
          return acc;
        }, { count: 0, total: 0 });
        return { label: item.label, count: stat.count, total: stat.total };
      });
      setServices(svcStats);

      // Group products from addon_products JSONB
      const prdMap: Record<string, { count: number; total: number }> = {};
      rows.forEach(r => {
        (r.addon_products ?? []).forEach((p: { name: string; price: number }) => {
          if (!prdMap[p.name]) prdMap[p.name] = { count: 0, total: 0 };
          prdMap[p.name].count++;
          prdMap[p.name].total += p.price ?? 0;
        });
      });
      setProducts(Object.entries(prdMap).map(([name, s]) => ({ name, ...s })));

      setLoading(false);
    };
    load();
  }, [user, year, month]);

  if (!user) return null;

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const serviceTotal  = services.reduce((s, r) => s + r.total, 0);
  const productTotal  = products.reduce((s, r) => s + r.total, 0);
  const positionBonus = user.positionAllowance ?? 0;
  const grandTotal    = serviceTotal + positionBonus;
  // Products paid separately on the 15th

  const MONTH_NAMES = ["一","二","三","四","五","六","七","八","九","十","十一","十二"];
  const monthLabel = `${year} 年 ${month+1} 月`;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8ddd2] px-5 py-4">
        <h1 className="text-sm font-semibold text-[#1c1c1c]">我的業績</h1>
        <p className="text-xs text-[#8a7a6e] mt-0.5">{user.name}</p>
      </div>

      {/* Month nav */}
      <div className="bg-white border-b border-[#e8ddd2] px-4 py-3 flex items-center justify-between">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center border border-[#e8ddd2] rounded-lg text-gray-500">‹</button>
        <span className="text-sm font-semibold text-[#1c1c1c]">{monthLabel}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-[#e8ddd2] rounded-lg text-gray-500">›</button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#8a7a6e]">載入中…</div>
      ) : (
        <div className="px-4 py-4 pb-28 space-y-4">

          {/* 職級 */}
          <div className="bg-white rounded-2xl border border-[#e8ddd2] px-5 py-3 flex items-center gap-2">
            <span className="text-xs text-[#8a7a6e]">職級</span>
            <span className="text-sm font-semibold text-[#1c1c1c]">{user.level}</span>
          </div>

          {/* 執行業務 */}
          <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#f0ece6]">
              <span className="text-xs font-semibold text-[#8a7a6e] uppercase tracking-wide">執行業務</span>
            </div>
            {services.map((s, i) => (
              <div key={i} className={`px-5 py-3.5 flex items-center ${i > 0 ? "border-t border-[#f0ece6]" : ""}`}>
                <div className="flex-1 text-sm text-[#1c1c1c]">{s.label}</div>
                <div className="text-sm text-[#8a7a6e] mr-4">×{s.count}次</div>
                <div className={`text-sm font-medium w-20 text-right ${s.total > 0 ? "text-[#1c1c1c]" : "text-[#c0b8b0]"}`}>
                  {s.total > 0 ? `$${s.total.toLocaleString()}` : "$0"}
                </div>
              </div>
            ))}
            <div className="px-5 py-3 border-t border-[#e8ddd2] bg-[#faf7f2] flex items-center justify-between">
              <span className="text-xs text-[#8a7a6e]">小計</span>
              <span className="text-sm font-semibold text-[#1c1c1c]">${serviceTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* 產品分潤 */}
          <div className="bg-white rounded-2xl border border-[#e8ddd2] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#f0ece6]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8a7a6e] uppercase tracking-wide">產品分潤</span>
                <span className="text-[10px] text-[#8a7a6e]">獎金於每月15日發放，遇假日順延</span>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="px-5 py-4 text-sm text-[#c0b8b0]">本月尚無產品銷售</div>
            ) : products.map((p, i) => (
              <div key={i} className={`px-5 py-3.5 flex items-center ${i > 0 ? "border-t border-[#f0ece6]" : ""}`}>
                <div className="flex-1 text-sm text-[#1c1c1c]">{p.name}</div>
                <div className="text-sm text-[#8a7a6e] mr-4">×{p.count}</div>
                <div className="text-sm font-medium text-[#1c1c1c] w-20 text-right">${p.total.toLocaleString()}</div>
              </div>
            ))}
            {products.length > 0 && (
              <div className="px-5 py-3 border-t border-[#e8ddd2] bg-[#faf7f2] flex items-center justify-between">
                <span className="text-xs text-[#8a7a6e]">小計</span>
                <span className="text-sm font-semibold text-[#1c1c1c]">${productTotal.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* 職務加給 */}
          {positionBonus > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8ddd2] px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm text-[#1c1c1c]">職務加給</span>
              <span className="text-sm font-semibold text-[#8b6748]">${positionBonus.toLocaleString()}</span>
            </div>
          )}

          {/* 月份總計 */}
          <div className="bg-[#8b6748] rounded-2xl px-5 py-4">
            <div className="text-xs text-white/70 mb-1">{monthLabel}總計</div>
            <div className="text-2xl font-bold text-white">${grandTotal.toLocaleString()}</div>
            {products.length > 0 && (
              <div className="text-[10px] text-white/60 mt-1.5">
                另有產品獎金 ${productTotal.toLocaleString()} 將於15日另行發放
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
