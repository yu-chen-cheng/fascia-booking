"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, user } = useAdmin();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    router.replace("/admin/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        router.replace("/admin/dashboard");
      } else {
        setError("帳號或密碼錯誤，請重試");
        setLoading(false);
      }
    }, 500);
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
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-6 text-center">登入</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8a7a6e] mb-1.5">帳號</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="輸入帳號"
                required
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

        {/* Role hints */}
        <div className="mt-6 bg-white rounded-xl border border-[#e8ddd2] p-4">
          <p className="text-xs text-[#8a7a6e] mb-3 font-medium">測試帳號</p>
          <div className="space-y-2 text-xs text-[#8a7a6e]">
            <div className="flex justify-between">
              <span>admin / admin123</span>
              <span className="text-[#8b6748]">管理者</span>
            </div>
            <div className="flex justify-between">
              <span>manager / mgr123</span>
              <span className="text-[#8b6748]">店長</span>
            </div>
            <div className="flex justify-between">
              <span>staff1 / staff123</span>
              <span className="text-[#8b6748]">員工</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
