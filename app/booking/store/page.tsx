"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { stores, Store } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function StorePage() {
  const router = useRouter();
  const { state, setSelectedStore } = useBooking();
  const [selected, setSelected] = useState<Store | null>(state.selectedStore);
  const [mapOpen, setMapOpen] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setSelectedStore(selected);
    router.push("/booking/teacher");
  };

  const availableStores = stores.filter((s) => !s.comingSoon);

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="選擇門市"
        subtitle="請選擇您方便前往的門市"
        onBack={() => router.back()}
        step={4}
      />

      <div className="flex-1 px-6 py-6 space-y-4">
        {availableStores.map((store) => (
          <div key={store.id}>
            <Card
              selected={selected?.id === store.id}
              onClick={() => {
                setSelected(store);
                setMapOpen(null);
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

        {/* Coming soon */}
        <Card className="opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" strokeDasharray="2 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-400">板橋店</h3>
              <p className="text-sm text-gray-400">即將開幕，敬請期待</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100">
        <Button fullWidth size="lg" onClick={handleContinue} disabled={!selected}>
          {selected ? `確認選擇 ${selected.name}` : "請選擇門市"}
        </Button>
      </div>
    </div>
  );
}
