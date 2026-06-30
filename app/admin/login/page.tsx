"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, user } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.replace("/admin/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(email, password);
    if (result.success) {
      router.replace("/admin/dashboard");
    } else {
      setError(result.error ?? "登入失敗");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-[#8b6748] tracking-widest">FASCIA 法夏</h1>
          <p className="text-sm text-[#8a7a6e] mt-1">後台管理系統</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e8ddd2] p-8 shadow-sm">
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-6 text-center">員工登入</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8a7a6e] mb-1.5">電子信箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="輸入信箱"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-[#e8ddd2] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#8b6748] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8a7a6e] mb-1.5">密碼</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="輸入密碼"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-[#e8ddd2] bg-[#faf7f2] text-sm focus:outline-none focus:border-[#8b6748] transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center py-2 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#8b6748] text-white rounded-xl text-sm font-medium hover:bg-[#7a5a3e] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "登入中…" : "登入"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#8a7a6e] mt-6">
          忘記密碼請聯繫管理者
        </p>
      </div>
    </div>
  );
}
