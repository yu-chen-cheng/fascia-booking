"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { stores, Store } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";

export default function StorePage() {
  const router = useRouter();
  const { state, setSelectedStore } = useBooking();
  const [selected, setSelected] = useState<Store | null>(state.selectedStore);

  const availableStores = stores.filter((s) => !s.comingSoon);

  const handleSelect = (store: Store) => {
    setSelectedStore(store);
    setSelected(store);
    setTimeout(() => router.push("/booking/teacher"), 150);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <BookingHeader
        title="選擇門市"
        onBack={() => router.back()}
      />

      <div className="flex-1 px-4 py-4 space-y-2">
        {availableStores.map((store) => (
          <button
            key={store.id}
            onClick={() => handleSelect(store)}
            className={`w-full text-left px-4 py-4 bg-white border rounded-xl transition-colors ${
              selected?.id === store.id
                ? "border-[#8b6748]"
                : "border-[#e8ddd2]"
            }`}
          >
            <p className="text-sm font-semibold text-[#1c1c1c]">{store.name}</p>
            <p className="text-xs text-[#8a7a6e] mt-0.5">{store.address}</p>
          </button>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-[#e8ddd2]">
        <button
          onClick={() => {
            if (selected) router.push("/booking/teacher");
          }}
          disabled={!selected}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors ${
            selected
              ? "bg-[#8b6748] text-white"
              : "bg-[#e8ddd2] text-[#8a7a6e] cursor-not-allowed"
          }`}
        >
          {selected ? "繼續" : "請選擇門市"}
        </button>
      </div>
    </div>
  );
}
