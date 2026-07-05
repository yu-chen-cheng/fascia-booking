"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { services, Service } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";

export default function ServicePage() {
  const router = useRouter();
  const { state, setSelectedService, setSelectedServices, setHasAddon } = useBooking();

  const initialService = state.selectedServices.length > 0
    ? state.selectedServices[0]
    : state.selectedService ?? null;

  const [selected, setSelected] = useState<Service | null>(initialService);
  const [addon, setAddon] = useState(state.hasAddon);

  const isMember = state.user?.isMember || false;
  const isFirstTime = state.user?.isNewUser || false;
  const showDiscount = isMember || isFirstTime;
  const level = state.selectedTeacher?.level || "技師職人";

  const teacher = state.selectedTeacher;
  const mainServices = services.filter(
    (s) => !s.isAddon && s.onlineBookable &&
    (!teacher || teacher.allowedServiceIds.includes(s.id))
  );
  const addonService = services.find(
    (s) => s.isAddon && s.onlineBookable &&
    (!teacher || teacher.allowedServiceIds.includes(s.id))
  );

  const getPrice = (service: Service) => {
    if (showDiscount) return service.priceMember[level];
    return service.priceRegular[level];
  };

  const handleContinue = () => {
    if (!selected) return;
    setSelectedServices([selected]);
    setSelectedService(selected);
    setHasAddon(addon);
    router.replace("/booking/datetime");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <BookingHeader
        title="選擇服務"
        onBack={() => router.push("/booking/teacher")}
      />

      <div className="flex-1 px-4 py-4 space-y-2">
        {mainServices.map((service) => {
          const isSelected = selected?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => setSelected(isSelected ? null : service)}
              className={`w-full text-left px-4 py-4 bg-white border rounded-xl transition-colors ${
                isSelected ? "border-[#8b6748]" : "border-[#e8ddd2]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1c1c1c]">{service.name}</p>
                  <p className="text-xs text-[#8a7a6e] mt-0.5">{service.duration} 分鐘</p>
                </div>
                <p className="text-sm font-semibold text-[#1c1c1c]">
                  ${getPrice(service).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}

        {addonService && selected && (
          <button
            onClick={() => setAddon(!addon)}
            className={`w-full text-left px-4 py-4 bg-white border rounded-xl transition-colors mt-4 ${
              addon ? "border-[#8b6748]" : "border-[#e8ddd2]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1c1c1c]">{addonService.name}</p>
                <p className="text-xs text-[#8a7a6e] mt-0.5">+{addonService.duration} 分鐘</p>
              </div>
              <p className="text-sm font-semibold text-[#1c1c1c]">+$600</p>
            </div>
          </button>
        )}
      </div>

      <div className="px-4 py-4 border-t border-[#e8ddd2]">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors ${
            selected
              ? "bg-[#8b6748] text-white"
              : "bg-[#e8ddd2] text-[#8a7a6e] cursor-not-allowed"
          }`}
        >
          {selected ? "繼續" : "請選擇服務"}
        </button>
      </div>
    </div>
  );
}
