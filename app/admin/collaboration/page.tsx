"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/adminContext";
import { supabase } from "@/lib/supabase";

type MemberTab = "manager" | "staff";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
  branch_id: string | null;
}

const AVATAR_COLORS = ["#e8606a","#f57c00","#388e3c","#1976d2","#7b1fa2","#0097a7","#c62828","#8e24aa","#5d4037","#00796b"];

export default function CollaborationPage() {
  const router = useRouter();
  const { user, activeBranchId } = useAdmin();
  const [tab, setTab] = useState<MemberTab>("manager");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: assignedData } = await supabase
        .from("staff_branch_assignments")
        .select("staff_id")
        .eq("branch_id", activeBranchId);
      const assignedIds = (assignedData ?? []).map((r: { staff_id: string }) => r.staff_id);

      const { data } = await supabase
        .from("staff_profiles")
        .select("id,name,email,role,level,branch_id")
        .or(`branch_id.eq.${activeBranchId}${assignedIds.length ? `,id.in.(${assignedIds.join(",")})` : ""}`)
        .eq("is_active", true)
        .neq("role", "會計")
        .order("name");
      setMembers((data ?? []) as Member[]);
      setLoading(false);
    };
    load();
  }, [activeBranchId]);

  if (!user) return null;

  const isManager = (m: Member) => m.role === "管理者" || m.role === "店長";
  const managers = members.filter(isManager);
  const staff    = members.filter(m => !isManager(m));
  const list     = tab === "manager" ? managers : staff;

  const hint = tab === "manager"
    ? "只有品牌管理員可以決定店長能操作哪些功能，包含結帳、查看會員資料、查看報表等各項設定。"
    : "品牌管理員和擁有店員管理權限的店長，可以決定店員能管理哪些服務人員，包含編輯預約、檢視業績等。";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-400 text-xl w-8">✕</button>
        <h1 className="text-sm font-semibold text-gray-800 flex-1 text-center">團隊成員</h1>
        <div className="w-8" />
      </div>

      {/* Tab switcher */}
      <div className="bg-white mx-4 mt-4 rounded-xl flex border border-gray-200 overflow-hidden">
        {(["manager","staff"] as MemberTab[]).map(t => {
          const label = t === "manager" ? "店長" : "店員";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-gray-700 text-white" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-500 px-5 py-3 leading-relaxed">
        📍 {hint}
      </p>

      {/* List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">載入中…</div>
      ) : (
        <div className="mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Invite button */}
          <button className="w-full flex items-center gap-2 px-4 py-4 border-b border-gray-50 text-[#1976d2] text-sm font-medium hover:bg-gray-50">
            <span className="text-lg leading-none">⊕</span>
            <span>邀請{tab === "manager" ? "店長" : "店員"}</span>
          </button>

          {list.map((m, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isSelf = m.email === user.email;
            return (
              <button
                key={m.id}
                onClick={() => router.push(`/admin/collaboration/${m.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 last:border-0 text-left"
              >
                <span className="text-red-400 text-xl w-6">⊖</span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {m.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800">
                    {m.name}{isSelf ? " (自己)" : ""}
                  </div>
                  <div className="text-xs text-gray-400">{m.email}</div>
                </div>
                <span className="text-gray-300 text-lg flex-shrink-0">✏</span>
              </button>
            );
          })}

          {list.length === 0 && (
            <div className="px-4 py-8 text-sm text-gray-400 text-center">尚無成員</div>
          )}
        </div>
      )}
    </div>
  );
}
