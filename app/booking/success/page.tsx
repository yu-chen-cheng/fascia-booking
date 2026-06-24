"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";

const DAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

function DetailRow({ icon, label, value, valueClass = "" }: { icon: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium text-[#1a1a1a] leading-snug ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  const router = useRouter();
  const { state, resetBooking, getTotalPrice } = useBooking();
  const [showStamp, setShowStamp] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowStamp(true), 300);
    return () => clearTimeout(t);
  }, []);

  const { selectedStore, selectedTeacher, selectedServices, selectedService, selectedDate, selectedTime, hasAddon, notes, user } = state;

  const visitCount = (user?.bookingHistory?.length ?? 0) + 1;
  const milestone =
    visitCount === 3 ? { num: 3, msg: "您已完成第 3 次調理，身體正在建立新的平衡模式 ✦" } :
    visitCount === 10 ? { num: 10, msg: "第 10 次調理里程碑！您的筋膜已走過一段深度修復的旅程 ✦" } :
    visitCount === 20 ? { num: 20, msg: "第 20 次！您已成為真正了解自己身體的人 ✦" } :
    null;

  const displayServices = selectedServices && selectedServices.length > 0
    ? selectedServices
    : selectedService ? [selectedService] : [];

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${DAYS_CN[selectedDate.getDay()]}）`
    : "—";

  const bookingNo = `FC${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="flex flex-col bg-[#faf7f2]" style={{ minHeight: '100dvh' }}>
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#8b6748] via-[#c4a882] to-[#8b6748]" />

      <div className="flex-1 px-5 py-8 flex flex-col items-center">

        {/* Animated stamp */}
        <div
          className="relative mb-5"
          style={{
            opacity: showStamp ? 1 : 0,
            transform: showStamp ? 'scale(1)' : 'scale(0.6)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="w-20 h-20 rounded-full border-[3px] border-[#2d8a52] flex items-center justify-center bg-white shadow-md">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16L13 23L26 9" stroke="#2d8a52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-1">預約已確認</h1>
        <p className="text-sm text-[#2d8a52] font-medium mb-6">我們期待在 {dateStr} 見到您</p>

        {/* Receipt */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Receipt header */}
          <div className="bg-[#8b6748] px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#d4b896] tracking-[0.2em] uppercase font-medium">FASCIA 法夏</p>
              <p className="text-white font-semibold text-base mt-0.5">預約確認單</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#d4b896]">確認編號</p>
              <p className="text-white font-mono text-sm font-bold tracking-wider">{bookingNo}</p>
            </div>
          </div>

          {/* Ticket notch divider */}
          <div className="relative h-4 bg-white">
            <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-[#faf7f2]" />
            <div className="absolute -right-3 top-1 w-6 h-6 rounded-full bg-[#faf7f2]" />
            <div className="absolute inset-x-4 top-3 border-t-2 border-dashed border-gray-100" />
          </div>

          {/* Booking details */}
          <div className="px-6 pt-1 pb-5 space-y-3.5">
            <DetailRow icon="📅" label="日期時間" value={`${dateStr}　${selectedTime || ""}`} valueClass="text-[#8b6748] font-semibold" />
            <DetailRow icon="📍" label="門市地點" value={selectedStore?.name || "—"} />
            <DetailRow icon="👤" label="專屬技師" value={selectedTeacher ? `${selectedTeacher.name} ${selectedTeacher.level}` : "—"} />
            <DetailRow icon="✨" label="服務項目" value={displayServices.map(s => s.name).join("、") + (hasAddon ? " ＋加購20分" : "") || "—"} />
            {notes && <DetailRow icon="📝" label="備註" value={notes} />}
          </div>

          {/* Notch divider before price */}
          <div className="relative h-4 bg-white mx-0">
            <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-[#faf7f2]" />
            <div className="absolute -right-3 top-1 w-6 h-6 rounded-full bg-[#faf7f2]" />
            <div className="absolute inset-x-4 top-3 border-t-2 border-dashed border-gray-100" />
          </div>

          {/* Price */}
          <div className="px-6 pt-2 pb-5 flex justify-between items-center">
            <span className="text-sm text-gray-500">費用總計</span>
            <span className="text-2xl font-bold text-[#8b6748]">${getTotalPrice().toLocaleString()}</span>
          </div>

          {/* LINE notification */}
          <div className="mx-4 mb-4 bg-[#f0faf4] border border-[#06C755]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#06C755" className="flex-shrink-0">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            <div>
              <p className="text-xs font-medium text-[#1a7a45]">LINE 通知已發送</p>
              <p className="text-xs text-gray-500 mt-0.5">請留意 FASCIA 法夏的訊息</p>
            </div>
          </div>
        </div>

        {/* Milestone card */}
        {milestone && (
          <div className="w-full max-w-sm mt-4 bg-gradient-to-br from-[#8b6748] to-[#b8956a] rounded-2xl px-5 py-4 shadow-md">
            <p className="text-[10px] tracking-[0.2em] text-[#d4b896] uppercase font-medium mb-1">調理里程碑</p>
            <p className="text-sm text-white leading-relaxed">{milestone.msg}</p>
          </div>
        )}

        {/* Post-care */}
        <div className="w-full max-w-sm mt-4 bg-white rounded-2xl px-5 py-4 border border-[#e8ddd2]">
          <p className="text-xs font-semibold text-[#8b6748] mb-1.5">調理後照護提醒</p>
          <p className="text-xs text-gray-500 leading-relaxed">調理結束後 24–72 小時多補充水分、充分休息，讓筋膜充分修復。</p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm mt-6 space-y-3" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { resetBooking(); router.push("/booking/store"); }}
            className="w-full py-4 bg-[#8b6748] text-white text-base font-medium rounded-2xl shadow-md active:scale-[0.97] transition-all"
          >
            再次預約
          </button>
          <button
            onClick={() => { resetBooking(); router.push("/"); }}
            className="w-full py-3 text-sm text-gray-400"
          >
            返回首頁
          </button>
        </div>

      </div>
    </div>
  );
}
