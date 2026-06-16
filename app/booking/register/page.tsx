"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useBooking();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    year: "",
    month: "",
    day: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "請輸入姓名";
    if (!form.phone.match(/^09\d{8}$/)) errs.phone = "請輸入有效的手機號碼";
    if (!form.year || !form.month || !form.day) errs.birthday = "請輸入完整出生年月日";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Persist registration data to localStorage
    localStorage.setItem("fascia_user_name", form.name);
    localStorage.setItem("fascia_user_phone", form.phone);
    localStorage.setItem("fascia_registration_done", "true");

    setUser({
      id: "new001",
      name: form.name,
      phone: form.phone,
      email: "user@line.example.com",
      birthday: `${form.year}-${form.month.padStart(2, "0")}-${form.day.padStart(2, "0")}`,
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
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              姓名 <span className="text-[#b8956a]">*</span>
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

          {/* Email (from LINE) */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              電子郵件
              <span className="text-xs text-gray-400 font-normal ml-2">（由 LINE 自動帶入）</span>
            </label>
            <input
              type="email"
              value="user@line.example.com"
              disabled
              className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-base"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              出生年月日 <span className="text-[#b8956a]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="年（例：1990）"
                value={form.year}
                onChange={(e) => {
                  setForm((f) => ({ ...f, year: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              />
              <input
                type="number"
                placeholder="月"
                min="1"
                max="12"
                value={form.month}
                onChange={(e) => {
                  setForm((f) => ({ ...f, month: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              />
              <input
                type="number"
                placeholder="日"
                min="1"
                max="31"
                value={form.day}
                onChange={(e) => {
                  setForm((f) => ({ ...f, day: e.target.value }));
                  setErrors((e_) => ({ ...e_, birthday: "" }));
                }}
                className={`px-3 py-3.5 rounded-xl border text-base text-center outline-none transition-colors ${
                  errors.birthday ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-[#b8956a]"
                }`}
              />
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
      <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100">
        <Button fullWidth size="lg" onClick={handleSubmit}>
          下一步：閱讀同意書
        </Button>
      </div>
    </div>
  );
}
