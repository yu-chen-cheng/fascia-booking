"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";
import { upsertCustomer } from "@/lib/customerApi";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useBooking();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    year: "",
    month: "",
    day: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [lineUserId, setLineUserId] = useState("");

  // Auto-fill from LIFF sessionStorage (set by login page after LIFF auth)
  useEffect(() => {
    const displayName = sessionStorage.getItem("liff_display_name") || "";
    const userId = sessionStorage.getItem("liff_user_id") || "";
    setLineDisplayName(displayName);
    setLineUserId(userId);
    if (displayName) {
      setForm((f) => ({ ...f, name: displayName }));
    }
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "請輸入姓名";
    if (!form.phone.match(/^09\d{8}$/)) errs.phone = "請輸入有效的手機號碼";
    if (!form.year || !form.month || !form.day) errs.birthday = "請輸入完整出生年月日";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const birthday = `${form.year}-${form.month.padStart(2, "0")}-${form.day.padStart(2, "0")}`;

    // 寫入 Supabase（upsert：已有則更新）
    if (lineUserId) {
      await upsertCustomer({
        lineUserId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        birthday,
        consentSigned: false,
      });
    }

    // 本地快取
    localStorage.setItem("fascia_user_name", form.name);
    localStorage.setItem("fascia_user_phone", form.phone);
    localStorage.setItem("fascia_registration_done", "true");

    setUser({
      id: lineUserId || "new001",
      name: form.name,
      phone: form.phone,
      email: form.email || "",
      birthday,
      isNewUser: true,
      isMember: false,
      storedValue: 0,
      totalSpent: 0,
      consentSigned: false,
      vouchers: [],
      bookingHistory: [],
    });

    router.push("/booking/consent");
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-xl border text-base transition-colors outline-none ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-gray-200 bg-white focus:border-[#b8956a]"
    }`;

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="基本資料"
        subtitle="請填寫您的個人資訊"
        onBack={() => router.push("/booking/login")}
        step={2}
      />

      <div className="flex-1 px-6 py-6">
        {/* LINE profile hint */}
        {lineDisplayName && (
          <div className="flex items-center gap-3 bg-[#f0faf4] border border-[#06C755]/20 rounded-xl p-3 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#06C755">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <p className="text-xs text-[#1a7a45]">
              已透過 LINE 登入，顯示名稱「{lineDisplayName}」已自動帶入
            </p>
          </div>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              真實姓名 <span className="text-[#b8956a]">*</span>
              {lineDisplayName && (
                <span className="text-xs text-gray-400 font-normal ml-2">（由 LINE 帶入，可修改）</span>
              )}
            </label>
            <input
              type="text"
              placeholder="請輸入您的姓名"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                setErrors((e_) => ({ ...e_, name: "" }));
              }}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              手機號碼 <span className="text-[#b8956a]">*</span>
            </label>
            <input
              type="tel"
              placeholder="09XXXXXXXX"
              value={form.phone}
              onChange={(e) => {
                setForm((f) => ({ ...f, phone: e.target.value }));
                setErrors((e_) => ({ ...e_, phone: "" }));
              }}
              className={inputClass("phone")}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              電子郵件
              <span className="text-xs text-gray-400 font-normal ml-2">（選填）</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-[#b8956a] transition-colors"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              出生年月日 <span className="text-[#b8956a]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={form.year}
                onChange={(e) => {
                  setForm((f) => ({ ...f, year: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors appearance-none ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              >
                <option value="">年</option>
                {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              <select
                value={form.month}
                onChange={(e) => {
                  setForm((f) => ({ ...f, month: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors appearance-none ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>{m}</option>
                ))}
              </select>
              <select
                value={form.day}
                onChange={(e) => {
                  setForm((f) => ({ ...f, day: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors appearance-none ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              >
                <option value="">日</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>
            </div>
            {errors.birthday && (
              <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="bg-[#f5f0e8] rounded-xl p-4 mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            您的個人資料僅用於預約管理及療程記錄，我們承諾保護您的隱私。
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-4 bg-[#fafaf8] border-t border-gray-100" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <Button fullWidth size="lg" onClick={handleSubmit}>
          下一步：閱讀同意書
        </Button>
      </div>
    </div>
  );
}
