"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

const LEGACY_ID_MAP: Record<string, string> = {
  ST01: "xiaoJudan", ST02: "daan", ST03: "banqiao",
};

interface StaffRow {
  id: string;
  name: string;
  level: string;
  branch_id: string | null;
}

interface SettingsRow {
  staff_id: string;
  is_open: boolean;
  publish_day: number;
  publish_months: number;
  publish_time: string;
}

const AVATAR_COLORS = ["#e8606a","#f57c00","#388e3c","#1976d2","#7b1fa2","#0097a7","#c62828","#8e24aa","#5d4037","#00796b"];

export default function BookingSettingsPage() {
  const router = useRouter();
  const { user, activeBranchId } = useAdmin();
  const [staff, setStaff]       = useState<StaffRow[]>([]);
  const [settings, setSettings] = useState<Record<string, SettingsRow>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: assignedData } = await supabase
        .from("staff_branch_assignments")
        .select("staff_id")
        .eq("branch_id", activeBranchId);
      const assignedIds = (assignedData ?? []).map((r: { staff_id: string }) => r.staff_id);

      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("id,name,level,branch_id")
        .or(`branch_id.eq.${activeBranchId}${assignedIds.length ? `,id.in.(${assignedIds.join(",")})` : ""}`)
        .eq("is_active", true)
        .neq("role", "會計")
        .order("name");

      const rows = (staffData ?? []) as StaffRow[];
      setStaff(rows);

      if (rows.length > 0) {
        const ids = rows.map(s => s.id);
        const { data: settingsData } = await supabase
          .from("staff_booking_settings")
          .select("*")
          .in("staff_id", ids);
        const map: Record<string, SettingsRow> = {};
        (settingsData ?? []).forEach((s: SettingsRow) => { map[s.staff_id] = s; });
        setSettings(map);
      }
      setLoading(false);
    };
    load();
  }, [activeBranchId]);

  if (!user) return null;

  const getLevelDisplay = (level: string) => {
    if (level === "技術長") return "技術長";
    return "技術職人";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-400 text-xl w-8">✕</button>
        <h1 className="text-sm font-semibold text-gray-800 flex-1 text-center">預約開放設定</h1>
        <div className="w-8" />
      </div>

      <p className="text-xs text-gray-400 px-5 py-3">
        📍 你可以針對擁有權限的服務人員，進行網路預約的細節設定，包含開放時間、開放項目等。
      </p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">載入中…</div>
      ) : (
        <div className="flex-1 bg-white mx-0 divide-y divide-gray-100">
          {staff.map((s, i) => {
            const cfg = settings[s.id];
            const isOpen = cfg ? cfg.is_open : true;
            const publishDay = cfg?.publish_day ?? 25;
            const publishMonths = cfg?.publish_months ?? 2;
            const hasTime = true; // assume default slots exist
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

            return (
              <button
                key={s.id}
                onClick={() => router.push(`/admin/booking-settings/${s.id}`)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-left"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {s.name.slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">
                    {s.name}｜{getLevelDisplay(s.level)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    每月{publishDay}日公開下{publishMonths}個月
                  </div>
                  {!isOpen && (
                    <div className="text-xs text-red-400 mt-0.5">⊗ 已關閉個人網路預約</div>
                  )}
                </div>

                {/* Edit icon */}
                <span className="text-gray-300 text-lg flex-shrink-0">✏</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
