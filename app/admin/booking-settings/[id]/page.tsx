"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const START_HOUR = 10;
const END_HOUR = 22;

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function defaultSlots(): string[] {
  const s: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    s.push(`${String(h).padStart(2,"0")}:00`);
    s.push(`${String(h).padStart(2,"0")}:30`);
  }
  return s;
}

const DAYS_CN = ["日","一","二","三","四","五","六"];
const AVATAR_COLORS = ["#e8606a","#f57c00","#388e3c","#1976d2","#7b1fa2","#0097a7","#c62828","#8e24aa","#5d4037","#00796b"];

interface StaffRow { id: string; name: string; level: string; }
interface Settings {
  is_open: boolean;
  publish_day: number;
  publish_months: number;
  publish_time: string;
  min_before_mins: number;
}
interface SlotRow { date: string; slots: string[]; }

type Tab = "settings" | "hours" | "items";

export default function StaffBookingSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const { user } = useAdmin();

  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [cfg, setCfg] = useState<Settings>({
    is_open: true, publish_day: 25, publish_months: 2, publish_time: "12:00", min_before_mins: 0,
  });
  const [tab, setTab] = useState<Tab>("settings");
  const [saving, setSaving] = useState(false);

  // For 開放時間 tab
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [slotMap, setSlotMap]     = useState<Record<string, string[]>>({});
  const [editDay, setEditDay]     = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<string[]>([]);

  // For 開放項目 tab
  type SelectMode = "single" | "multiple";
  const MAIN_SVCS = [
    { id: "premium-120",    name: "頂級筋膜結構整合", dur: 120 },
    { id: "refined-90",     name: "精緻筋膜調理",     dur: 90  },
    { id: "basic-60",       name: "基礎筋膜放鬆",     dur: 60  },
    { id: "training-smart", name: "智能訓練",          dur: 50  },
  ];
  const ADDON_SVCS = [
    { id: "addon-15",          name: "加購延長 +15分",       dur: 15 },
    { id: "addon-gold-sleep",  name: "黃金甲｜舒壓好眠組",  dur: 0  },
    { id: "addon-gold-eye",    name: "黃金甲｜晶亮活力組",  dur: 0  },
    { id: "addon-gold-beauty", name: "黃金甲｜逆齡淨化組",  dur: 0  },
  ];
  const [selectMode, setSelectMode] = useState<SelectMode>("multiple");
  const [mainIds, setMainIds]       = useState<string[]>(MAIN_SVCS.map(s => s.id));
  const [addonIds, setAddonIds]     = useState<string[]>(ADDON_SVCS.map(s => s.id));
  const [showMain, setShowMain]     = useState(false);
  const [showAddon, setShowAddon]   = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from("staff_profiles").select("id,name,level").eq("id", staffId).single();
    if (s) setStaff(s as StaffRow);

    const { data: cfgData } = await supabase.from("staff_booking_settings").select("*").eq("staff_id", staffId).maybeSingle();
    if (cfgData) {
      setCfg({
        is_open: cfgData.is_open,
        publish_day: cfgData.publish_day,
        publish_months: cfgData.publish_months,
        publish_time: cfgData.publish_time?.slice(0,5) ?? "12:00",
        min_before_mins: cfgData.min_before_mins,
      });
    }

    // Load slot overrides for this month
    const monthStart = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-01`;
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const monthEnd = `${nextY}-${String(nextM+1).padStart(2,"0")}-01`;
    const { data: slotData } = await supabase
      .from("staff_available_slots")
      .select("date,slots")
      .eq("staff_id", staffId)
      .gte("date", monthStart)
      .lt("date", monthEnd);
    const map: Record<string, string[]> = {};
    (slotData ?? []).forEach((r: SlotRow) => { map[r.date] = r.slots; });
    setSlotMap(map);
  }, [staffId, viewYear, viewMonth]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const saveCfg = async () => {
    setSaving(true);
    await supabase.from("staff_booking_settings").upsert({
      staff_id: staffId,
      ...cfg,
      publish_time: cfg.publish_time + ":00",
    }, { onConflict: "staff_id" });
    setSaving(false);
  };

  const saveSlots = async (date: string, slots: string[]) => {
    await supabase.from("staff_available_slots").upsert({ staff_id: staffId, date, slots }, { onConflict: "staff_id,date" });
    setSlotMap(prev => ({ ...prev, [date]: slots }));
    setEditDay(null);
  };

  if (!user || !staff) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">載入中…</div>
  );

  const color = AVATAR_COLORS[0];
  const levelDisplay = staff.level === "技術長" ? "技術長" : "技術職人";

  // Build days in month for 開放時間
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewYear, viewMonth, i + 1);
    return { date: toYMD(d), dayNum: i + 1, dayOfWeek: d.getDay() };
  });

  const allSlots = defaultSlots();
  const toggleMain  = (id: string) => setMainIds(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const toggleAddon = (id: string) => setAddonIds(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-400 text-xl w-8">✕</button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
            {staff.name.slice(0,2)}
          </div>
          <span className="text-sm font-semibold text-gray-800">{staff.name}｜{levelDisplay}</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        {(["settings","hours","items"] as Tab[]).map(t => {
          const labels: Record<Tab, string> = { settings: "開放設定", hours: "開放時間", items: "開放項目" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm transition-colors ${
                tab === t ? "font-semibold text-gray-900 border-b-2 border-gray-900" : "text-gray-400"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── 開放設定 tab ──────────────────────────────────── */}
      {tab === "settings" && (
        <div className="flex-1 overflow-y-auto pb-24">
          <p className="text-xs text-gray-400 px-5 py-3">
            📍 服務人員不論是否開放個人網路預約，皆可以加入不指定預約組合，並且被指派預約。
          </p>

          {/* Toggle */}
          <div className="bg-white mx-4 mt-2 rounded-2xl border border-gray-100 px-4 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-800">開放個人網路預約</span>
            <button
              onClick={() => setCfg(p => ({ ...p, is_open: !p.is_open }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${cfg.is_open ? "bg-[#e8606a]" : "bg-gray-200"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.is_open ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* 顧客可預約時間 */}
          <div className="mx-4 mt-4">
            <p className="text-xs text-gray-400 text-center mb-2">顧客可預約時間</p>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {/* 公開日期 */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">公開日期</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      每月{cfg.publish_day}日公開下{cfg.publish_months}個月
                    </span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 block mb-1">每月幾號公開</label>
                    <select
                      value={cfg.publish_day}
                      onChange={e => setCfg(p => ({ ...p, publish_day: parseInt(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                    >
                      {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>{d} 號</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 block mb-1">公開未來幾個月</label>
                    <select
                      value={cfg.publish_months}
                      onChange={e => setCfg(p => ({ ...p, publish_months: parseInt(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                    >
                      {[1,2,3,6].map(n => <option key={n} value={n}>{n} 個月</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 公開時間 */}
              <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm text-gray-700">公開時間（分店共用）</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={cfg.publish_time}
                    onChange={e => setCfg(p => ({ ...p, publish_time: e.target.value }))}
                    className="text-sm text-gray-600 border border-gray-200 rounded-lg px-2 py-1 outline-none"
                  />
                </div>
              </div>

              {/* 最晚預約 */}
              <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm text-gray-700">最晚預約時間</span>
                <div className="flex items-center gap-2">
                  <select
                    value={cfg.min_before_mins}
                    onChange={e => setCfg(p => ({ ...p, min_before_mins: parseInt(e.target.value) }))}
                    className="text-sm text-gray-600 border border-gray-200 rounded-lg px-2 py-1 outline-none"
                  >
                    <option value={0}>不限制（0 分鐘前）</option>
                    <option value={30}>30 分鐘前</option>
                    <option value={60}>1 小時前</option>
                    <option value={120}>2 小時前</option>
                    <option value={180}>3 小時前</option>
                    <option value={360}>6 小時前</option>
                    <option value={1440}>1 天前</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-4 mt-6">
            <button
              onClick={saveCfg}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#e8606a" }}
            >
              {saving ? "儲存中…" : "儲存設定"}
            </button>
          </div>
        </div>
      )}

      {/* ── 開放時間 tab ──────────────────────────────────── */}
      {tab === "hours" && (
        <div className="flex-1 overflow-y-auto pb-24">
          <p className="text-xs text-gray-400 px-5 py-3">📍 開放顧客預約的時間。</p>

          {/* Month nav */}
          <div className="bg-white mx-4 mb-3 rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              {viewMonth+1}月, {viewYear}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewYear(today.getFullYear()) || setViewMonth(today.getMonth())}
                className="text-xs text-[#e8606a] border border-[#e8606a] px-2 py-1 rounded-lg"
              >
                今天
              </button>
              <button
                onClick={() => { if (viewMonth === 0) { setViewYear(y=>y-1); setViewMonth(11); } else setViewMonth(m=>m-1); }}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500"
              >‹</button>
              <button
                onClick={() => { if (viewMonth === 11) { setViewYear(y=>y+1); setViewMonth(0); } else setViewMonth(m=>m+1); }}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500"
              >›</button>
            </div>
          </div>

          {/* Day list */}
          <div className="mx-4 bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {monthDays.map(({ date, dayNum, dayOfWeek }) => {
              const isToday = date === toYMD(today);
              const isSun = dayOfWeek === 0;
              const isSat = dayOfWeek === 6;
              const slots = slotMap[date] ?? allSlots;
              const isPast = new Date(date) < new Date(toYMD(today));

              return (
                <div key={date} className={`px-4 py-3 ${isPast ? "opacity-40" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 flex flex-col items-center pt-0.5">
                      <span className={`text-[10px] font-medium ${isSun || isSat ? "text-red-400" : "text-gray-400"}`}>
                        週{DAYS_CN[dayOfWeek]}
                      </span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 ${
                        isToday ? "bg-[#e8606a] text-white" : "text-gray-700"
                      }`}>
                        {dayNum}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 leading-relaxed break-all">
                        {slots.join(", ")}
                      </p>
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => { setEditDay(date); setEditSlots(slotMap[date] ?? allSlots); }}
                        className="text-gray-300 text-lg flex-shrink-0 mt-0.5"
                      >✏</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 開放項目 tab ──────────────────────────────────── */}
      {tab === "items" && (
          <div className="flex-1 overflow-y-auto pb-24 px-4 py-4 space-y-3">
            {/* 主要服務項目 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowMain(p => !p)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">主要服務項目</span>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{mainIds.length}</span>
                  <span className={`transition-transform ${showMain ? "rotate-90" : ""}`}>›</span>
                </div>
              </button>
              {showMain && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {MAIN_SVCS.map(svc => {
                    const on = mainIds.includes(svc.id);
                    return (
                      <button key={svc.id} onClick={() => toggleMain(svc.id)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? "bg-[#e8606a] border-[#e8606a]" : "border-gray-300"}`}>
                          {on && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-800">{svc.name}</div>
                          {svc.dur > 0 && <div className="text-xs text-gray-400">{svc.dur} 分鐘</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 線上預約選取類型 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">線上預約選取類型</span>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs">
                  <button
                    onClick={() => setSelectMode("single")}
                    className={`px-3 py-1.5 transition-colors ${selectMode === "single" ? "bg-[#e8606a] text-white font-medium" : "text-gray-500"}`}
                  >
                    單選
                  </button>
                  <button
                    onClick={() => setSelectMode("multiple")}
                    className={`px-3 py-1.5 transition-colors ${selectMode === "multiple" ? "bg-[#e8606a] text-white font-medium" : "text-gray-500"}`}
                  >
                    複選
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 px-4 pb-4 leading-relaxed">
                網路預約時，主要項目是客人必選的服務。你可以設定顧客只能預約一項或多項服務。
              </p>
            </div>

            {/* 加購服務項目 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowAddon(p => !p)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">加購服務項目</span>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{addonIds.length}</span>
                  <span className={`transition-transform ${showAddon ? "rotate-90" : ""}`}>›</span>
                </div>
              </button>
              {showAddon && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {ADDON_SVCS.map(svc => {
                    const on = addonIds.includes(svc.id);
                    return (
                      <button key={svc.id} onClick={() => toggleAddon(svc.id)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? "bg-[#e8606a] border-[#e8606a]" : "border-gray-300"}`}>
                          {on && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-800">{svc.name}</div>
                          {svc.dur > 0 && <div className="text-xs text-gray-400">{svc.dur} 分鐘</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 px-4 pb-4 leading-relaxed border-t border-gray-50 pt-3">
                網路預約時，加購項目是給客人額外加選的，非必選但可以重複選擇。
              </p>
            </div>

            <button
              className="w-full py-3.5 rounded-2xl text-sm font-medium text-white"
              style={{ backgroundColor: "#e8606a" }}
            >
              儲存開放項目
            </button>
          </div>
      )}

      {/* ── Edit slots bottom sheet ──────────────────────── */}
      {editDay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setEditDay(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={() => setEditDay(null)} className="text-gray-400 text-xl w-8">✕</button>
              <h3 className="text-sm font-semibold text-gray-800">
                {editDay} 可預約時段
              </h3>
              <button
                onClick={() => saveSlots(editDay, editSlots)}
                className="text-[#e8606a] font-medium text-sm"
              >
                儲存
              </button>
            </div>
            <div className="px-4 py-4 max-h-[60vh] overflow-y-auto pb-8">
              <div className="flex justify-between mb-3">
                <button onClick={() => setEditSlots(allSlots)} className="text-xs text-[#e8606a]">全部開放</button>
                <button onClick={() => setEditSlots([])} className="text-xs text-gray-400">全部關閉</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {allSlots.map(t => {
                  const on = editSlots.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setEditSlots(prev => on ? prev.filter(x=>x!==t) : [...prev, t].sort())}
                      className={`py-2 rounded-xl text-xs font-mono transition-colors ${
                        on ? "bg-[#e8606a] text-white" : "border border-gray-200 text-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
