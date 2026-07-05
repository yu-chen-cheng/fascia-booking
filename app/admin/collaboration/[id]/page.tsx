"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
}

interface PermRow {
  can_view_phone: boolean;
  can_checkout: boolean;
  can_branch_settings: boolean;
  can_plan_management: boolean;
  can_member_management: boolean;
  can_inventory: boolean;
  can_reports: boolean;
}

interface StaffLink {
  staff_id: string;
  staff_name: string;
  staff_level: string;
}

const DEFAULT_PERM: PermRow = {
  can_view_phone: false,
  can_checkout: true,
  can_branch_settings: false,
  can_plan_management: false,
  can_member_management: false,
  can_inventory: false,
  can_reports: false,
};

const AVATAR_COLORS = ["#e8606a","#f57c00","#388e3c","#1976d2","#7b1fa2","#0097a7","#c62828","#8e24aa","#5d4037","#00796b"];

export default function CollaborationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const { user } = useAdmin();

  const [member, setMember] = useState<MemberRow | null>(null);
  const [perm, setPerm]     = useState<PermRow>(DEFAULT_PERM);
  const [links, setLinks]   = useState<StaffLink[]>([]);
  const [saving, setSaving] = useState(false);

  const isManager = (role: string) => role === "管理者" || role === "店長";

  const load = useCallback(async () => {
    const { data: m } = await supabase
      .from("staff_profiles")
      .select("id,name,email,role,level")
      .eq("id", memberId)
      .single();
    if (m) setMember(m as MemberRow);

    const { data: p } = await supabase
      .from("staff_permissions")
      .select("*")
      .eq("staff_id", memberId)
      .maybeSingle();
    if (p) setPerm(p as PermRow);

    // Load managed staff links
    const { data: sl } = await supabase
      .from("staff_managed_links")
      .select("staff_id, staff_profiles!inner(name,level)")
      .eq("manager_id", memberId);
    const mapped: StaffLink[] = (sl ?? []).map((row: Record<string, unknown>) => {
      const sp = row.staff_profiles as { name: string; level: string };
      return { staff_id: row.staff_id as string, staff_name: sp.name, staff_level: sp.level };
    });
    setLinks(mapped);
  }, [memberId]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const save = async () => {
    setSaving(true);
    await supabase.from("staff_permissions").upsert({
      staff_id: memberId,
      ...perm,
    }, { onConflict: "staff_id" });
    setSaving(false);
    router.back();
  };

  if (!user || !member) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">載入中…</div>
  );

  const color = AVATAR_COLORS[0];
  const roleIsManager = isManager(member.role);

  const operationPerms = [
    { key: "can_view_phone" as keyof PermRow,  label: "查看手機號碼",  desc: "開啟後，將可以檢視完整手機號碼" },
    { key: "can_checkout"   as keyof PermRow,  label: "操作結帳",      desc: "開啟後，將能操作結帳、刪除和重新結帳" },
  ];

  const featurePerms = roleIsManager ? [
    { key: "can_branch_settings"  as keyof PermRow, label: "分店設定",   desc: "開啟後，將可以進行分店的設定，包含分店資料管理、服務預約管理等" },
    { key: "can_plan_management"  as keyof PermRow, label: "方案管理",   desc: "開啟後，將可以進行方案升降級、綁定信用卡、查看訂閱紀錄等" },
    { key: "can_member_management" as keyof PermRow, label: "會員管理", desc: "開啟後，將可以維護會員護照，修改會員資料、儲值金和紅利點數等資料，進行會員群發等功能" },
    { key: "can_inventory"        as keyof PermRow, label: "進存貨管理", desc: "開啟後，將能管理進貨數量、安全庫存、查看進存紀錄等" },
    { key: "can_reports"          as keyof PermRow, label: "報表",       desc: "開啟後，將能查看會員、結帳、業績等報表" },
  ] : [];

  const toggle = (key: keyof PermRow) => setPerm(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-400 text-xl w-8">✕</button>
        <h1 className="text-sm font-semibold text-gray-800 flex-1 text-center">{member.name}</h1>
        <button onClick={save} disabled={saving} className="text-[#e8606a] font-medium text-sm w-8 text-right">
          {saving ? "…" : "✓"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* 操作權限 */}
        <div className="px-4 mt-4">
          <p className="text-xs text-gray-400 text-center mb-2">操作權限</p>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {operationPerms.map(({ key, label, desc }) => (
              <div key={key} className="px-4 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</div>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${perm[key] ? "bg-[#e8606a]" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${perm[key] ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 功能權限 — 僅店長顯示 */}
        {featurePerms.length > 0 && (
          <div className="px-4 mt-4">
            <p className="text-xs text-gray-400 text-center mb-2">功能權限</p>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {featurePerms.map(({ key, label, desc }) => (
                <div key={key} className="px-4 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                  <button
                    onClick={() => toggle(key)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${perm[key] ? "bg-[#e8606a]" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${perm[key] ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 能管理哪些服務人員 — 僅店員顯示 */}
        {!roleIsManager && (
          <div className="px-4 mt-4">
            <p className="text-xs text-gray-400 text-center mb-2">能管理哪些服務人員</p>
            <p className="text-xs text-gray-400 px-1 mb-3 leading-relaxed">
              📍 選擇此帳號能管理的服務人員，加入後，就能管理預約和編輯服務人員資訊，也可以另外設定是否能管理網路預約、檢視每日業績等。
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button className="w-full flex items-center gap-2 px-4 py-4 border-b border-gray-50 text-[#1976d2] text-sm font-medium hover:bg-gray-50">
                <span className="text-lg leading-none">⊕</span>
                <span>加入服務人員</span>
              </button>
              {links.map((lk, i) => (
                <div key={lk.staff_id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                  <span className="text-red-400 text-xl w-6">⊖</span>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {lk.staff_name.slice(0, 2)}
                  </div>
                  <span className="flex-1 text-sm text-gray-800">{lk.staff_name}｜{lk.staff_level}</span>
                  <span className="text-gray-300 text-lg">✏</span>
                </div>
              ))}
              {links.length === 0 && (
                <div className="px-4 py-6 text-xs text-gray-400 text-center">尚未加入任何服務人員</div>
              )}
            </div>
          </div>
        )}

        {/* 移除按鈕 */}
        <div className="px-4 mt-8">
          <button className="w-full flex items-center justify-center gap-2 py-4 text-sm text-red-500">
            <span>🗑</span>
            <span>移除{roleIsManager ? "店長" : "店員"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
