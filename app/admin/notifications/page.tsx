"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { useRouter } from "next/navigation";

interface NotifTemplate {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  template: string;
}

const DEFAULT_TEMPLATES: NotifTemplate[] = [
  {
    id: "confirm",
    label: "預約確認通知",
    description: "客戶完成預約後立即發送",
    enabled: true,
    template: `您好 {{客戶姓名}}，

感謝您預約 FASCIA 法夏・筋膜結構美學。

📅 預約日期：{{日期}}
🕐 預約時間：{{時間}}
💆 服務項目：{{服務名稱}}
👤 服務技師：{{技師姓名}}
📍 服務門市：{{門市名稱}}

如需調整，請提前24小時聯繫我們。
期待為您服務！`,
  },
  {
    id: "reminder",
    label: "24小時前提醒",
    description: "預約前24小時自動發送",
    enabled: true,
    template: `{{客戶姓名}} 您好！

提醒您明天的預約：
🕐 {{日期}} {{時間}}
💆 {{服務名稱}}
📍 {{門市名稱}} · {{技師姓名}}

如需取消或更改，請盡速與我們聯繫。
期待明天為您服務 ✨`,
  },
  {
    id: "aftercare",
    label: "調理後護理提醒",
    description: "完成預約後發送護理建議",
    enabled: true,
    template: `{{客戶姓名}} 您好，

感謝您今天選擇 FASCIA 法夏！

為使療程效果最佳，請注意：
✅ 多喝溫水，促進代謝
✅ 避免劇烈運動 24 小時
✅ 保持良好姿勢
✅ 若有任何不適請聯繫我們

下次預約可享 9 折優惠，期待再見！`,
  },
  {
    id: "revisit",
    label: "7天回訪提醒",
    description: "完成預約後7天內未再預約自動發送",
    enabled: false,
    template: `{{客戶姓名}} 您好 🌿

距離您上次筋膜調理已過 7 天，
身體的感受如何呢？

定期調理能讓效果更持久穩定，
歡迎您再次預約，讓筋膜保持最佳狀態。

點擊下方連結立即預約：
{{預約連結}}

FASCIA 法夏 期待再次為您服務 ✨`,
  },
];

export default function NotificationsPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [templates, setTemplates] = useState<NotifTemplate[]>(DEFAULT_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!user) return null;
  if (user.role === "員工") {
    return (
      <div className="p-8 text-center text-[#8a7a6e]">
        <p>無權限查看此頁面</p>
        <button onClick={() => router.back()} className="mt-4 text-[#8b6748] text-sm">返回</button>
      </div>
    );
  }

  const toggleEnabled = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const startEdit = (t: NotifTemplate) => {
    setEditingId(t.id);
    setEditText(t.template);
  };

  const saveEdit = () => {
    setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, template: editText } : t));
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1c1c1c]">LINE 通知設定</h1>
        <p className="text-sm text-[#8a7a6e] mt-1">管理自動發送給客戶的 LINE 訊息範本</p>
      </div>

      <div className="space-y-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#e8ddd2] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-[#1c1c1c]">{t.label}</div>
                <div className="text-xs text-[#8a7a6e] mt-0.5">{t.description}</div>
              </div>
              <button
                onClick={() => toggleEnabled(t.id)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors ${
                  t.enabled ? "bg-[#8b6748] border-[#8b6748]" : "bg-gray-200 border-gray-200"
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  t.enabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Template preview */}
            <div className="bg-[#faf7f2] rounded-xl p-3 mt-3 mb-3">
              <pre className="text-xs text-[#8a7a6e] whitespace-pre-wrap font-sans leading-relaxed">
                {t.template}
              </pre>
            </div>

            <button
              onClick={() => startEdit(t)}
              className="text-xs text-[#8b6748] border border-[#e8ddd2] px-3 py-1.5 rounded-lg hover:bg-[#faf7f2] transition-colors"
            >
              編輯範本
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#faf7f2] rounded-2xl border border-[#e8ddd2] p-4">
        <p className="text-xs text-[#8a7a6e]">
          <span className="font-medium text-[#8b6748]">可用變數：</span>
          {'{{客戶姓名}}、{{日期}}、{{時間}}、{{服務名稱}}、{{技師姓名}}、{{門市名稱}}、{{預約連結}}'}
        </p>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-base font-medium text-[#1c1c1c] mb-4">
              編輯：{templates.find(t => t.id === editingId)?.label}
            </h3>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={12}
              className="w-full px-3 py-3 border border-[#e8ddd2] rounded-xl text-sm focus:outline-none focus:border-[#8b6748] resize-none font-mono"
            />
            <p className="text-xs text-[#8a7a6e] mt-2 mb-4">使用 {'{{變數名稱}}'} 插入動態內容</p>
            <div className="flex gap-3">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 border border-[#e8ddd2] rounded-xl text-sm text-[#8a7a6e]">取消</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-[#8b6748] text-white rounded-xl text-sm">儲存範本</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
