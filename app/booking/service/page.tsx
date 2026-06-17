"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { services, Service } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

export default function ServicePage() {
  const router = useRouter();
  const { state, setSelectedService, setSelectedServices, setHasAddon } = useBooking();
  const [selectedServices, setLocalSelectedServices] = useState<Service[]>(
    state.selectedServices.length > 0
      ? state.selectedServices
      : state.selectedService
      ? [state.selectedService]
      : []
  );
  const [addon, setAddon] = useState(state.hasAddon);
  const [shaking, setShaking] = useState(false);

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

  const getOriginalPrice = (service: Service) => service.priceRegular[level];

  const toggleService = (service: Service) => {
    setLocalSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setSelectedServices(selectedServices);
    setSelectedService(selectedServices[0]);
    setHasAddon(addon);
    router.push("/booking/datetime");
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + getPrice(s), 0) + (addon ? 600 : 0);

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
          title="選擇服務"
          subtitle={state.selectedTeacher ? `${state.selectedTeacher.name} ${state.selectedTeacher.level}` : ""}
          onBack={() => router.back()}
          step={6}
        />

        <div className="flex-1 px-6 py-6 space-y-3">
          {/* Discount banner */}
          {showDiscount && (
            <div className={`rounded-xl px-4 py-3 flex items-center gap-2 ${isFirstTime && !isMember ? "bg-amber-50 border border-amber-200" : "bg-[#f5f0e8] border border-[#d4b896]/30"}`}>
              <div className="w-5 h-5 flex-shrink-0">
                {isFirstTime && !isMember ? (
                  <svg viewBox="0 0 20 20" fill="#b8956a"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="#b8956a"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
              </div>
              <p className="text-xs text-[#b8956a] font-medium">
                {isFirstTime && !isMember
                  ? "🎉 新客戶首次預約享會員優惠價！"
                  : "會員優惠價已套用"}
              </p>
            </div>
          )}

          {/* Service cards */}
          {mainServices.map((service) => {
            const isSelected = !!selectedServices.find((s) => s.id === service.id);
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service)}
                className={`bg-white rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? "ring-2 ring-[#b8956a] shadow-md"
                    : "ring-1 ring-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#b8956a] flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-[#1a1a1a]">{service.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-[#f5f0e8] text-[#b8956a] px-2 py-0.5 rounded-full">
                        {service.duration} 分鐘
                      </span>
                      {service.category === "training" && (
                        <span className="text-xs bg-[#f0f5f3] text-[#7a9e8e] px-2 py-0.5 rounded-full">
                          訓練課程
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">{service.description}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-semibold text-[#1a1a1a]">
                      ${getPrice(service).toLocaleString()}
                    </div>
                    {showDiscount && getOriginalPrice(service) !== getPrice(service) && (
                      <div className="text-xs text-gray-400 line-through">
                        ${getOriginalPrice(service).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add-on */}
          {addonService && selectedServices.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">加購選項</p>
              <div
                onClick={() => setAddon(!addon)}
                className={`bg-white rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  addon
                    ? "ring-2 ring-[#7a9e8e] shadow-md"
                    : "ring-1 ring-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${addon ? "bg-[#7a9e8e] border-[#7a9e8e]" : "border-gray-300"}`}>
                      {addon && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{addonService.name}</p>
                      <p className="text-xs text-gray-500">{addonService.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#7a9e8e]">+$600</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100">
          {selectedServices.length > 0 && (
            <div className="mb-3 space-y-1">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{s.name}</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">${getPrice(s).toLocaleString()}</span>
                </div>
              ))}
              {addon && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">加購20分</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">$600</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-sm text-gray-600 font-medium">合計</span>
                <span className="text-lg font-semibold text-[#1a1a1a]">${totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className={shaking ? "shake" : ""}>
            <Button fullWidth size="lg" onClick={handleContinue} disabled={selectedServices.length === 0}>
              {selectedServices.length > 0 ? "確認服務，選擇時間" : "請選擇服務"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
