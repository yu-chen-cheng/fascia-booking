"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2d2520] to-[#1a1a1a]">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8956a]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7a9e8e]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
          {/* Logo area */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#b8956a] to-[#d4b896] flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#b8956a]/30">
              <span className="text-2xl font-light text-white tracking-widest">法</span>
            </div>
            <h1 className="text-3xl font-light text-white tracking-[0.15em] mb-2">
              FASCIA
            </h1>
            <p className="text-[#b8956a] text-base tracking-[0.3em] font-light">
              法夏・筋膜結構美學
            </p>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-12">
            專業筋膜調理，還原身體最自然的排列。
            <br />
            預約您的專屬療程體驗。
          </p>

          {/* CTA Buttons */}
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => router.push("/booking/login")}
              className="w-full py-4 bg-gradient-to-r from-[#b8956a] to-[#a07d58] text-white text-base font-medium rounded-2xl shadow-lg shadow-[#b8956a]/30 hover:shadow-xl hover:shadow-[#b8956a]/40 transition-all duration-200 active:scale-[0.97]"
            >
              立即預約
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-4 border border-[#b8956a]/40 text-[#b8956a] text-base font-medium rounded-2xl hover:bg-[#b8956a]/10 transition-all duration-200 active:scale-[0.97]"
            >
              會員中心
            </button>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="bg-[#f5f0e8] px-6 py-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xs tracking-[0.2em] text-[#b8956a] uppercase font-medium mb-4">
            門市據點
          </h2>
          <div className="space-y-3">
            {[
              { name: "小巨蛋店", addr: "台北市松山區南京東路四段133巷4弄15號1樓", active: true },
              { name: "大安店", addr: "台北市大安區信義路四段30巷7弄1號1樓", active: true },
              { name: "板橋店（即將開幕）", addr: "新北市板橋區", active: false },
            ].map((s) => (
              <div key={s.name} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${s.active ? "bg-[#b8956a]" : "bg-gray-300"}`} />
                <div>
                  <p className={`text-sm font-medium ${s.active ? "text-[#1a1a1a]" : "text-gray-400"}`}>{s.name}</p>
                  <p className="text-xs text-gray-500">{s.addr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
