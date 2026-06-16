"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — white top, warm coffee brand bar */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {/* Subtle warm wash */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c4a882]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e8ddd2]/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
          {/* Logo area */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b6748] to-[#c4a882] flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#8b6748]/20">
              <span className="text-2xl font-light text-white tracking-widest">法</span>
            </div>
            <h1 className="text-3xl font-light text-[#1c1c1c] tracking-[0.15em] mb-2">
              FASCIA
            </h1>
            <p className="text-[#8b6748] text-base tracking-[0.3em] font-light">
              法夏・筋膜結構美學
            </p>
          </div>

          <p className="text-[#8a7a6e] text-sm leading-relaxed max-w-xs mb-12">
            專業筋膜調理，還原身體最自然的排列。
            <br />
            預約您的專屬調理體驗。
          </p>

          {/* CTA Buttons */}
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => router.push("/booking/login")}
              className="w-full py-4 bg-[#8b6748] text-white text-base font-medium rounded-2xl shadow-md shadow-[#8b6748]/25 hover:bg-[#7a5a3d] transition-all duration-200 active:scale-[0.97]"
            >
              立即預約
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-4 border border-[#e8ddd2] text-[#8b6748] text-base font-medium rounded-2xl bg-[#faf7f2] hover:bg-[#f0e8dc] transition-all duration-200 active:scale-[0.97]"
            >
              會員中心
            </button>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="bg-[#faf7f2] border-t border-[#e8ddd2] px-6 py-8">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xs tracking-[0.2em] text-[#8b6748] uppercase font-medium mb-4">
            門市據點
          </h2>
          <div className="space-y-3">
            {[
              { name: "小巨蛋店", addr: "台北市松山區南京東路四段133巷4弄15號1樓", active: true },
              { name: "大安店", addr: "台北市大安區信義路四段30巷7弄1號1樓", active: true },
              { name: "板橋店（即將開幕）", addr: "新北市板橋區", active: false },
            ].map((s) => (
              <div key={s.name} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${s.active ? "bg-[#8b6748]" : "bg-[#c4a882]"}`} />
                <div>
                  <p className={`text-sm font-medium ${s.active ? "text-[#1c1c1c]" : "text-[#c4a882]"}`}>{s.name}</p>
                  <p className="text-xs text-[#8a7a6e]">{s.addr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
