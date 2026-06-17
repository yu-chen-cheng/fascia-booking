"use client";

import { useState } from "react";
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
  const { state, getTotalPrice, setNotes } = useBooking();
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [localNotes, setLocalNotes] = useState(state.notes || "");

  const toggleNote = (s: string) => {
    const next = noteTags.includes(s) ? noteTags.filter(x => x !== s) : [...noteTags, s];
    setNoteTags(next);
    setLocalNotes(next.join("、"));
  };

  const {
    selectedStore,
    selectedTeacher,
    selectedService,
    selectedServices,
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

  const servicesToShow = selectedServices && selectedServices.length > 0
    ? selectedServices
    : selectedService
    ? [selectedService]
    : [];

  const durationTotal =
    (servicesToShow.length > 0
      ? servicesToShow.reduce((sum, s) => sum + s.duration, 0)
      : 0) + (hasAddon ? 20 : 0);

  const handleConfirm = () => {
    setNotes(localNotes);
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
          <Row label="服務" value={servicesToShow.length > 0 ? `${servicesToShow.map(s => s.name).join("、")}${hasAddon ? " + 加購20分" : ""}` : "—"} />
          <Row label="調理時長" value={`${durationTotal} 分鐘`} />
          <Row label="日期" value={dateStr} />
          <Row label="時間" value={selectedTime ? `${selectedTime} 起` : "—"} />
          {notes && <Row label="備註" value={notes} />}
        </div>

        {/* Price card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            費用明細
          </h3>
          {servicesToShow.length > 0 && selectedTeacher && (
            <>
              {servicesToShow.map((svc) => (
                <div key={svc.id} className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">{svc.name}</span>
                  <span className="text-sm font-medium">
                    ${(showDiscount
                      ? svc.priceMember[selectedTeacher.level]
                      : svc.priceRegular[selectedTeacher.level]
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
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

        {/* Optional notes */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <button
            onClick={() => setNotesOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium">調理前備註（選填）</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8956a" strokeWidth="1.5" style={{ transform: notesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {notesOpen && (
            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {["腰部長期痠痛","肩頸緊繃","久坐辦公室","運動後恢復","姿勢矯正需求","頭痛問題"].map(s => (
                  <button key={s} onClick={() => toggleNote(s)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${noteTags.includes(s) ? "bg-[#8b6748] border-[#8b6748] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                placeholder="其他需要告訴技師的事項..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:border-[#b8956a] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Edit reminder */}
        <div className="bg-[#f5f0e8] rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            確認後，系統將透過 LINE 傳送確認通知。如需更改或取消，請於調理前24小時前聯繫我們。
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-4 bg-[#fafaf8] border-t border-gray-100 space-y-2" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
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
