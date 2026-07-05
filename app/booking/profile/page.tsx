"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { getCustomerByLineId, getCustomerVouchers } from "@/lib/customerApi";

const LEVEL_CONFIG = {
  general: {
    label: "一般會員",
    color: "text-gray-500",
    bg: "bg-gray-100",
    next: "bronze" as const,
    nextLabel: "銅級",
    threshold: 15000,
  },
  bronze: {
    label: "銅級會員",
    color: "text-amber-700",
    bg: "bg-amber-50",
    next: "platinum" as const,
    nextLabel: "白金",
    threshold: 30000,
  },
  platinum: {
    label: "白金會員",
    color: "text-slate-600",
    bg: "bg-slate-100",
    next: "gold" as const,
    nextLabel: "黃金",
    threshold: 50000,
  },
  gold: {
    label: "黃金會員",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    next: null,
    nextLabel: null,
    threshold: null,
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { state } = useBooking();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbCustomer, setDbCustomer] = useState<any>(null);
  const [voucherCount, setVoucherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const user = state.user;

  useEffect(() => {
    if (!state.isLoggedIn || !user) {
      router.replace("/booking/login");
      return;
    }
    (async () => {
      const customer = await getCustomerByLineId(user.id);
      if (customer) {
        setDbCustomer(customer);
        const vouchers = await getCustomerVouchers(customer.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active = vouchers.filter((v: any) =>
          !v.used_at && (!v.expire_at || new Date(v.expire_at) > new Date())
        );
        setVoucherCount(active.length);
      }
      setLoading(false);
    })();
  }, [state.isLoggedIn, user, router]);

  if (!user) return null;

  // Use DB data if available, fallback to context
  const membershipLevel =
    ((dbCustomer?.membership_level as string) ?? "general") as keyof typeof LEVEL_CONFIG;
  const storedValue = (dbCustomer?.stored_value as number) ?? user.storedValue ?? 0;
  const totalSpent = (dbCustomer?.total_spent as number) ?? user.totalSpent ?? 0;
  const levelConfig = LEVEL_CONFIG[membershipLevel];

  const progressToNext =
    levelConfig.threshold
      ? Math.min((totalSpent / levelConfig.threshold) * 100, 100)
      : 100;

  const remaining =
    levelConfig.threshold ? Math.max(levelConfig.threshold - totalSpent, 0) : 0;

  const menuItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="3" width="14" height="12" rx="2" />
          <path d="M6 7h6M6 10.5h4" />
        </svg>
      ),
      label: "預約紀錄",
      sub: "查看過去與即將到來的調理",
      href: "/booking/history",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="9" cy="9" r="7" />
          <path d="M9 6v3l2 2" />
        </svg>
      ),
      label: "消費紀錄",
      sub: "儲值與消費明細",
      href: "/booking/history",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 6h12M3 9h8M3 12h5" />
          <path d="M14 10l2 2-2 2" />
        </svg>
      ),
      label: "票券夾",
      sub: `${voucherCount} 張有效票券`,
      href: "/booking/wallet",
      badge: voucherCount > 0 ? voucherCount : undefined,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2a4 4 0 100 8 4 4 0 000-8z" />
          <path d="M3 16c0-3 2.7-5 6-5s6 2 6 5" />
        </svg>
      ),
      label: "法夏嚴選產品",
      sub: "技師推薦居家保養",
      href: "/booking/products",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <BookingHeader
        title="我的帳戶"
        subtitle="會員資料與紀錄"
        onBack={() => router.replace("/booking/store")}
        step={0}
      />

      <div className="flex-1 px-5 py-5 space-y-4">
        {/* Profile card */}
        <div className="bg-gradient-to-br from-[#b8956a] to-[#8b6748] rounded-2xl p-5 text-white shadow-lg shadow-[#b8956a]/20">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-light">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium`}>
                  {levelConfig.label}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-0.5">{user.phone}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-white/60 text-[10px] tracking-wider uppercase mb-1">儲值餘額</p>
              <p className="text-xl font-semibold">${storedValue.toLocaleString()}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-white/60 text-[10px] tracking-wider uppercase mb-1">累積消費</p>
              <p className="text-xl font-semibold">${totalSpent.toLocaleString()}</p>
            </div>
          </div>

          {/* Level progress */}
          {levelConfig.next && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-white/70 text-xs">距離{levelConfig.nextLabel}會員</p>
                <p className="text-white/90 text-xs font-medium">
                  還差 ${remaining.toLocaleString()}
                </p>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
          {!levelConfig.next && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-300 flex items-center justify-center">
                <span className="text-[8px]">★</span>
              </div>
              <p className="text-white/80 text-xs">您已是最高等級會員</p>
            </div>
          )}
        </div>

        {/* Quick action: 儲值 */}
        <button
          onClick={() => router.push("/booking/topup")}
          className="w-full bg-[#f5f0e8] rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8956a] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="4" width="14" height="10" rx="2" />
                <path d="M2 7h14M6 11h2" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#1a1a1a]">立即儲值</p>
              <p className="text-xs text-gray-500">儲值 $15,000 起享票券好禮</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8956a" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>

        {/* Menu items */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => router.replace(item.href)}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-[#fafaf8] transition-colors text-left ${
                idx < menuItems.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#f5f0e8] flex items-center justify-center text-[#b8956a] flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a]">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.badge !== undefined && (
                  <span className="w-5 h-5 rounded-full bg-[#b8956a] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#d4bfab" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Book CTA */}
        <button
          onClick={() => router.replace("/booking/store")}
          className="w-full py-4 bg-[#b8956a] text-white rounded-2xl font-medium text-sm shadow-md shadow-[#b8956a]/20 hover:bg-[#a07d58] transition-colors"
        >
          立即預約調理
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          FASCIA 法夏 · 筋膜結構美學
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-[#b8956a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
