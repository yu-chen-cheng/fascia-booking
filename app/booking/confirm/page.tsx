"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 w-24">{label}</span>
      <span className={`text-sm text-right ml-4 ${highlight ? "text-[#b8956a] font-semibold" : "font-medium text-[#1a1a1a]"}`}>
        {value}
      </span>
    </div>
  );
}

export default function ConfirmPage() {
  const router = useRouter();
  const { state, getTotalPrice } = useBooking();

  const {
    selectedStore,
    selectedTeacher,
    selectedService,
    hasAddon,
    selectedDate,
    selectedTime,
    notes,
    user,
  } = state;

  const isMember = user?.isMember || false;
  const isFirstTime = user?.isNewUser || false;
  const showDiscount = isMember || isFirstTime;
  const totalPrice = getTotalPrice();

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${DAYS_CN[selectedDate.getDay()]}）`
    : "—";

  const durationTotal =
    (selectedService?.duration || 0) + (hasAddon ? 20 : 0);

  const handleConfirm = () => {
    router.push("/booking/success");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="確認預約"
        subtitle="請確認以下預約資訊"
        onBack={() => router.back()}
        step={9}
      />

      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Summary card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            預約明細
          </h3>
          <Row label="門市" value={selectedStore?.name || "—"} />
          <Row label="技師" value={selectedTeacher ? `${selectedTeacher.name} ${selectedTeacher.level}` : "—"} />
          <Row label="服務" value={selectedService ? `${selectedService.name}${hasAddon ? " + 加購20分" : ""}` : "—"} />
          <Row label="療程時長" value={`${durationTotal} 分鐘`} />
          <Row label="日期" value={dateStr} />
          <Row label="時間" value={selectedTime ? `${selectedTime} 起` : "—"} />
          {notes && <Row label="備註" value={notes} />}
        </div>

        {/* Price card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            費用明細
          </h3>
          {selectedService && selectedTeacher && (
            <>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">{selectedService.name}</span>
                <span className="text-sm font-medium">
                  ${(showDiscount
                    ? selectedService.priceMember[selectedTeacher.level]
                    : selectedService.priceRegular[selectedTeacher.level]
                  ).toLocaleString()}
                </span>
              </div>
              {hasAddon && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">加購 +20分</span>
                  <span className="text-sm font-medium">$600</span>
                </div>
              )}
              {showDiscount && (
                <div className="bg-amber-50 rounded-lg px-3 py-2 my-2">
                  <p className="text-xs text-amber-700">
                    {isFirstTime && !isMember ? "✨ 新客首次預約，享會員優惠價" : "✓ 會員優惠價已套用"}
                  </p>
                </div>
              )}
              <div className="border-t border-gray-100 mt-2 pt-3 flex justify-between items-center">
                <span className="text-base font-semibold text-[#1a1a1a]">總計</span>
                <span className="text-xl font-bold text-[#b8956a]">${totalPrice.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            客戶資訊
          </h3>
          <Row label="姓名" value={user?.name || "—"} />
          <Row label="手機" value={user?.phone || "—"} />
        </div>

        {/* Edit reminder */}
        <div className="bg-[#f5f0e8] rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            確認預約後，系統將透過 LINE 傳送確認通知。如需更改或取消，請於療程前24小時前聯繫我們。
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100 space-y-2">
        <Button fullWidth size="lg" onClick={handleConfirm}>
          確認預約
        </Button>
        <button
          onClick={() => router.push("/booking/store")}
          className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          重新選擇
        </button>
      </div>
    </div>
  );
}
