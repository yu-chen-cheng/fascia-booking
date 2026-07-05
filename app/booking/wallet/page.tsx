"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { getCustomerByLineId, getCustomerVouchers } from "@/lib/customerApi";

type VoucherType = "discount_200" | "structure_training" | "frequency_check";

interface Voucher {
  id: string;
  type: VoucherType;
  amount: number;
  description: string | null;
  source: string | null;
  expire_at: string | null;
  used_at: string | null;
  created_at: string;
}

const VOUCHER_CONFIG: Record<VoucherType, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}> = {
  discount_200: {
    label: "$200 折價券",
    icon: "✦",
    color: "text-[#b8956a]",
    bg: "bg-[#fdf8f3]",
    border: "border-[#e8d5be]",
  },
  structure_training: {
    label: "結構訓練券",
    icon: "◈",
    color: "text-[#7a9e8e]",
    bg: "bg-[#f0f7f4]",
    border: "border-[#b8d4c8]",
  },
  frequency_check: {
    label: "頻率檢測券",
    icon: "◉",
    color: "text-[#8b7db8]",
    bg: "bg-[#f5f2ff]",
    border: "border-[#c8bfe8]",
  },
};

function formatExpiry(expire_at: string | null): string {
  if (!expire_at) return "無期限";
  const d = new Date(expire_at);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return "已過期";
  if (diffDays <= 7) return `${diffDays} 天後到期`;
  return `${d.getMonth() + 1}/${d.getDate()} 到期`;
}

function isExpired(expire_at: string | null): boolean {
  if (!expire_at) return false;
  return new Date(expire_at) <= new Date();
}

export default function WalletPage() {
  const router = useRouter();
  const { state } = useBooking();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
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
        const data = await getCustomerVouchers(customer.id);
        setVouchers(data as Voucher[]);
      }
      setLoading(false);
    })();
  }, [state.isLoggedIn, user, router]);

  const activeVouchers = vouchers.filter(
    (v) => !v.used_at && !isExpired(v.expire_at)
  );
  const usedVouchers = vouchers.filter((v) => v.used_at);
  const expiredVouchers = vouchers.filter(
    (v) => !v.used_at && isExpired(v.expire_at)
  );

  const VoucherCard = ({
    voucher,
    dimmed = false,
  }: {
    voucher: Voucher;
    dimmed?: boolean;
  }) => {
    const config = VOUCHER_CONFIG[voucher.type];
    const expiry = formatExpiry(voucher.expire_at);
    const isUrgent =
      voucher.expire_at &&
      !voucher.used_at &&
      Math.ceil(
        (new Date(voucher.expire_at).getTime() - Date.now()) / 86400000
      ) <= 7;

    return (
      <div
        className={`rounded-2xl border p-4 ${config.bg} ${config.border} ${
          dimmed ? "opacity-50" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${config.color} bg-white/70 flex-shrink-0`}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </p>
              {voucher.amount > 0 && (
                <span className="text-xs font-bold text-white bg-[#b8956a] px-1.5 py-0.5 rounded-full">
                  ${voucher.amount.toLocaleString()}
                </span>
              )}
            </div>
            {voucher.description && (
              <p className="text-xs text-gray-500 mt-0.5">{voucher.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {voucher.used_at ? (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  已使用
                </span>
              ) : (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isUrgent
                      ? "text-red-600 bg-red-50"
                      : "text-gray-500 bg-white/60"
                  }`}
                >
                  {expiry}
                </span>
              )}
              {voucher.source === "google_review" && (
                <span className="text-[10px] text-gray-400">Google 評價贈送</span>
              )}
              {voucher.source?.startsWith("topup") && (
                <span className="text-[10px] text-gray-400">儲值贈送</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <BookingHeader
        title="票券夾"
        subtitle={`${activeVouchers.length} 張有效票券`}
        onBack={() => router.push("/booking/profile")}
        step={0}
      />

      <div className="flex-1 px-5 py-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#b8956a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 有效票券 */}
            <section>
              <h2 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
                有效票券 · {activeVouchers.length} 張
              </h2>
              {activeVouchers.length === 0 ? (
                <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-8 text-center">
                  <p className="text-sm text-gray-400">目前沒有有效票券</p>
                  <p className="text-xs text-gray-400 mt-1">
                    儲值 $30,000 起即贈結構訓練券
                  </p>
                  <button
                    onClick={() => router.push("/booking/topup")}
                    className="mt-3 text-sm text-[#b8956a] font-medium"
                  >
                    立即儲值 →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeVouchers.map((v) => (
                    <VoucherCard key={v.id} voucher={v} />
                  ))}
                </div>
              )}
            </section>

            {/* 如何獲得票券 */}
            <div className="bg-[#f5f0e8] rounded-2xl p-4">
              <p className="text-xs text-[#8b6748] font-medium mb-2">如何獲得票券？</p>
              <div className="space-y-1.5">
                {[
                  { icon: "✦", text: "完成 Google 評價 → $200 折價券（30天）" },
                  { icon: "◈", text: "儲值 $30,000 → 結構訓練券 $2,500（90天）" },
                  { icon: "◈◉", text: "儲值 $50,000 → 結構訓練券*1 + 頻率檢測券*1（各90天）" },
                ].map((item) => (
                  <div key={item.text} className="flex gap-2 text-xs text-[#8b6748]">
                    <span className="flex-shrink-0 font-medium">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 已使用 */}
            {usedVouchers.length > 0 && (
              <section>
                <h2 className="text-xs tracking-[0.15em] text-gray-400 uppercase font-medium mb-3">
                  已使用 · {usedVouchers.length} 張
                </h2>
                <div className="space-y-3">
                  {usedVouchers.map((v) => (
                    <VoucherCard key={v.id} voucher={v} dimmed />
                  ))}
                </div>
              </section>
            )}

            {/* 已過期 */}
            {expiredVouchers.length > 0 && (
              <section>
                <h2 className="text-xs tracking-[0.15em] text-gray-400 uppercase font-medium mb-3">
                  已過期 · {expiredVouchers.length} 張
                </h2>
                <div className="space-y-3">
                  {expiredVouchers.map((v) => (
                    <VoucherCard key={v.id} voucher={v} dimmed />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
