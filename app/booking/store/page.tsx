"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { stores, Store } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import Card from "@/components/ui/Card";

export default function StorePage() {
  const router = useRouter();
  const { state, setSelectedStore } = useBooking();
  const [selected, setSelected] = useState<Store | null>(state.selectedStore);
  const [mapOpen, setMapOpen] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const availableStores = stores.filter((s) => !s.comingSoon);

  // Birthday banner: check if current month matches user birthday month
  const isBirthdayMonth = useMemo(() => {
    const birthday = state.user?.birthday;
    if (!birthday) return false;
    const todayMonth = new Date().getMonth() + 1;
    const birthMonth = parseInt(birthday.split("-")[1], 10);
    return todayMonth === birthMonth;
  }, [state.user?.birthday]);

  return (
    <>
    <style>{`
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }
      .shake { animation: shake 0.4s ease; }
    `}</style>
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="選擇門市"
        subtitle="請選擇您方便前往的門市"
        onBack={() => router.back()}
        step={4}
      />

      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Birthday banner */}
        {isBirthdayMonth && (
          <div className="bg-gradient-to-r from-[#b8956a] to-[#d4b896] rounded-2xl px-5 py-4 text-white shadow-md shadow-[#b8956a]/25">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎂</span>
              <div>
                <p className="text-sm font-semibold">生日快樂，{state.user?.name?.split(" ")[0] || "親愛的會員"}！</p>
                <p className="text-xs text-white/80 mt-0.5">本月預約享專屬生日優惠，歡迎預約時告知技師</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick access */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/booking/history")}
            className="bg-white rounded-2xl px-4 py-3.5 ring-1 ring-gray-100 shadow-sm text-left hover:shadow-md transition-shadow active:scale-[0.97]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#f5f0e8] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" />
                <path d="M8 5v3l2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-[#1a1a1a]">調理紀錄</p>
            <p className="text-[10px] text-gray-400 mt-0.5">查看歷次調理</p>
          </button>
          <button
            onClick={() => router.push("/booking/products")}
            className="bg-white rounded-2xl px-4 py-3.5 ring-1 ring-gray-100 shadow-sm text-left hover:shadow-md transition-shadow active:scale-[0.97]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#f5f0e8] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8956a" strokeWidth="1.5">
                <path d="M2 3h12l-1.5 7H3.5L2 3z" strokeLinejoin="round" />
                <circle cx="5.5" cy="12.5" r="1" />
                <circle cx="10.5" cy="12.5" r="1" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-[#1a1a1a]">法夏嚴選</p>
            <p className="text-[10px] text-gray-400 mt-0.5">居家保養推薦</p>
          </button>
        </div>
        {availableStores.map((store) => (
          <div key={store.id}>
            <Card
              selected={selected?.id === store.id}
              onClick={() => {
                setSelectedStore(store);
                setSelected(store);
                setMapOpen(null);
                setTimeout(() => router.push("/booking/teacher"), 150);
              }}
              hoverable
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">
                      {store.name}
                    </h3>
                    {selected?.id === store.id && (
                      <div className="w-5 h-5 rounded-full bg-[#b8956a] flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-2">{store.address}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="6" cy="6" r="4.5" />
                        <path d="M6 3.5v2.5l1.5 1.5" strokeLinecap="round" />
                      </svg>
                      {store.hours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Map toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMapOpen(mapOpen === store.id ? null : store.id);
                }}
                className="mt-3 text-xs text-[#b8956a] flex items-center gap-1 hover:underline"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5c0 2.786 3.5 6.5 3.5 6.5s3.5-3.714 3.5-6.5C9.5 2.567 7.933 1 6 1z" />
                  <circle cx="6" cy="4.5" r="1" />
                </svg>
                {mapOpen === store.id ? "收起地圖" : "查看地圖"}
              </button>
            </Card>

            {/* Embedded map */}
            {mapOpen === store.id && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="bg-[#f5f0e8] p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2 font-medium">{store.name}</p>
                  <p className="text-xs text-gray-400 mb-3">{store.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#b8956a] text-white text-sm rounded-xl"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M7 1C4.791 1 3 2.791 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.209-1.791-4-4-4z" />
                      <circle cx="7" cy="5" r="1.25" />
                    </svg>
                    在 Google Maps 開啟
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>

    </div>
    </>
  );
}
