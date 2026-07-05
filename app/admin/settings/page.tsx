"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/adminContext";

const BRANCH_NAMES: Record<string, string> = {
  ST01: "台北｜小巨蛋店",
  ST02: "台北｜大安店",
  ST03: "新北｜板橋店",
};

interface SettingItem {
  icon: string;
  label: string;
  desc: string;
  href: string;
  badge?: string;
}

interface SettingGroup {
  title?: string;
  items: SettingItem[];
}

const GROUPS: SettingGroup[] = [
  {
    title: "基本設定",
    items: [
      { icon: "👤", label: "服務人員", desc: "新增、編輯技師資料、照片、介紹等資訊", href: "/admin/staff" },
      { icon: "📋", label: "服務項目（價目表）", desc: "價目表是預約、結帳的計算基礎", href: "/admin/services" },
      { icon: "🌐", label: "網路預約管理", desc: "設定各技師與不指定預約的開放時間與項目", href: "/admin/booking-settings" },
      { icon: "📅", label: "預約設定", desc: "設定服務項目、定金、網路預約相關功能", href: "/admin/booking-config" },
      { icon: "📦", label: "商品", desc: "建立商品庫和庫存管理", href: "/admin/inventory" },
      { icon: "👥", label: "協作管理", desc: "管理店長與店員帳號及其操作功能的使用權限", href: "/admin/collaboration" },
    ],
  },
  {
    title: "裝置",
    items: [
      { icon: "✍️", label: "結帳簽名", desc: "結帳時可請求電子簽名，以 PDF 格式儲存", href: "/admin/checkout-signature" },
      { icon: "📱", label: "iPad 裝置管理", desc: "管理進入分店的 iPad 裝置及其操作權限", href: "/admin/device-management" },
    ],
  },
  {
    title: "第三方服務",
    items: [
      { icon: "💳", label: "金流整合", desc: "提供信用卡、LINE Pay 等線上金流串接", href: "/admin/payment-integration" },
      { icon: "💬", label: "簡訊", desc: "會員可透過簡訊收到通知和訊息，費用額外計算", href: "/admin/sms" },
    ],
  },
  {
    title: "會員應用",
    items: [
      { icon: "🎟", label: "票券管理", desc: "提供多種類型票券，可應用於折價券、堂數券、點數券", href: "/admin/vouchers" },
      { icon: "📄", label: "文件管理", desc: "建立問卷、滿意度調查及服務同意書，供客人或會員簽署", href: "/admin/documents" },
    ],
  },
];

export default function SettingsPage() {
  const { user, activeBranchId } = useAdmin();
  if (!user) return null;

  const branchName = BRANCH_NAMES[activeBranchId] ?? "FASCIA 法夏";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">分店設定</h1>
        <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded">#{activeBranchId}</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Store info card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-xl bg-[#f0e8df] flex items-center justify-center text-2xl flex-shrink-0">
              🍃
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{branchName}</div>
              <div className="text-xs text-gray-400 mt-0.5">FASCIA法夏・筋膜結構美學</div>
            </div>
            <span className="text-gray-300 text-lg">⚙</span>
          </div>
        </div>

        {/* Search */}
        <div className="mx-4 mt-3">
          <div className="bg-white rounded-xl border border-gray-100 flex items-center gap-2 px-3 py-2.5">
            <span className="text-gray-300 text-sm">🔍</span>
            <span className="text-sm text-gray-300">搜尋設定</span>
          </div>
        </div>

        {/* Groups */}
        {GROUPS.map((group) => (
          <div key={group.title} className="mt-5 mx-4">
            {group.title && (
              <h2 className="text-xs font-medium text-gray-400 mb-2 px-1">{group.title}</h2>
            )}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">{item.badge}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed truncate">{item.desc}</div>
                  </div>
                  <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
