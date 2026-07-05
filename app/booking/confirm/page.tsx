"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import { publicLevel } from "@/lib/mockData";
import Button from "@/components/ui/Button";
import { getCustomerByLineId, createBooking, upsertCustomer } from "@/lib/customerApi";
import { sendBookingConfirmation } from "@/lib/lineNotify";

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

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!state.isLoggedIn || !state.user) {
      sessionStorage.setItem("fascia_return_to", "/booking/confirm");
      router.replace("/booking/login");
    }
  }, [state.isLoggedIn, state.user, router]);

  const [notesOpen, setNotesOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [localNotes, setLocalNotes] = useState(state.notes || "");
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);

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
  const voucherDiscount = selectedVoucher ? parseVoucherAmount(selectedVoucher) : 0;
  const finalPrice = Math.max(0, totalPrice - voucherDiscount);

  function parseVoucherAmount(voucher: string): number {
    const match = voucher.match(/\$([0-9,]+)/);
    if (!match) return 0;
    return parseInt(match[1].replace(",", ""), 10);
  }

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

  const handleConfirm = async () => {
    setNotes(localNotes);
    setSubmitting(true);

    // 寫入 Supabase
    if (user && selectedStore && selectedTeacher && selectedDate && selectedTime) {
      let customer = await getCustomerByLineId(user.id);
      // 若客戶資料不存在，先自動建立
      if (!customer && user.id && user.name) {
        const upserted = await upsertCustomer({
          lineUserId: user.id,
          name: user.name,
          phone: user.phone || "",
          email: user.email || undefined,
          birthday: user.birthday || undefined,
          consentSigned: true,
        });
        customer = upserted;
      }
      if (customer) {
        const serviceId = servicesToShow[0]?.id ?? "";
        const addonId = hasAddon ? "addon-20" : undefined;
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
        const booking = await createBooking({
          customerId: customer.id,
          storeId: selectedStore.id,
          serviceId,
          staffId: selectedTeacher.id,
          date: dateStr,
          timeSlot: selectedTime,
          notes: localNotes || undefined,
          addonId,
          totalPrice: finalPrice,
        });

        if (!booking) {
          setSubmitting(false);
          alert("預約建立失敗，請稍後再試或聯繫門市。");
          return;
        }

        // 傳送 LINE 預約確認通知（優先用 OA userId，否則用 LIFF userId）
        const notifyUserId = customer.oa_user_id || user.id;
        if (notifyUserId) {
          await sendBookingConfirmation({
            lineUserId: notifyUserId,
            customerName: user.name,
            storeName: selectedStore.name,
            staffName: `${selectedTeacher.name} ${publicLevel(selectedTeacher.level)}`,
            serviceName: servicesToShow.map(s => s.name).join("、") + (hasAddon ? " +加購20分" : ""),
            duration: durationTotal,
            date: dateStr,
            timeSlot: selectedTime,
            totalPrice: finalPrice,
          });
        }

        // 傳送 Email 預約確認通知
        if (user.email) {
          const DAYS_CN_EMAIL = ["日", "一", "二", "三", "四", "五", "六"];
          const d = new Date(dateStr + "T00:00:00");
          const dateDisplay = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS_CN_EMAIL[d.getDay()]}）`;
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: user.email,
              subject: `【FASCIA 法夏】預約確認 - ${dateDisplay} ${selectedTime}`,
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;padding:24px;border-radius:16px;">
                  <div style="background:#8b6748;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px;">
                    <p style="color:#d4b896;font-size:12px;letter-spacing:2px;margin:0">FASCIA 法夏</p>
                    <h1 style="color:#fff;font-size:20px;margin:8px 0 0">預約確認通知</h1>
                  </div>
                  <p style="color:#1c1c1c;font-size:14px;">親愛的 ${user.name} 您好，您的預約已確認！</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;border-bottom:1px solid #e8ddd2">日期時間</td><td style="padding:10px 0;font-size:13px;font-weight:600;color:#8b6748;text-align:right;border-bottom:1px solid #e8ddd2">${dateDisplay}　${selectedTime}</td></tr>
                    <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;border-bottom:1px solid #e8ddd2">門市</td><td style="padding:10px 0;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #e8ddd2">${selectedStore.name}</td></tr>
                    <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;border-bottom:1px solid #e8ddd2">技師</td><td style="padding:10px 0;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #e8ddd2">${selectedTeacher.name} ${publicLevel(selectedTeacher.level)}</td></tr>
                    <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;border-bottom:1px solid #e8ddd2">服務</td><td style="padding:10px 0;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #e8ddd2">${servicesToShow.map(s => s.name).join("、")}${hasAddon ? " +加購20分" : ""}</td></tr>
                    <tr><td style="padding:10px 0;color:#8a7a6e;font-size:13px;">費用</td><td style="padding:10px 0;font-size:16px;font-weight:700;color:#8b6748;text-align:right;">NT$${finalPrice.toLocaleString()}</td></tr>
                  </table>
                  <p style="font-size:12px;color:#8a7a6e;line-height:1.6;">如需更改或取消，請於調理前 24 小時聯繫我們。<br>感謝您選擇 FASCIA 法夏・筋膜結構美學。</p>
                </div>
              `,
            }),
          }).catch(() => {}); // Email 失敗不影響預約流程
        }

        // 儲存到 localStorage，避免 LIFF 跳頁後 context 清空
        localStorage.setItem("fascia_last_booking", JSON.stringify({
          storeName: selectedStore.name,
          teacherName: selectedTeacher.name,
          teacherLevel: selectedTeacher.level,
          serviceNames: servicesToShow.map(s => s.name),
          hasAddon,
          date: dateStr,
          timeSlot: selectedTime,
          totalPrice: finalPrice,
          customerName: user.name,
          notes: localNotes || "",
        }));
      } else {
        setSubmitting(false);
        alert("無法取得客戶資料，請重新登入後再試。");
        return;
      }
    } else {
      setSubmitting(false);
      alert("預約資料不完整，請重新選擇。");
      return;
    }

    setSubmitting(false);
    router.replace("/booking/success");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="確認預約"
        subtitle="請確認以下預約資訊"
        onBack={() => router.push("/booking/datetime")}
        step={9}
      />

      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Summary card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-3">
            預約明細
          </h3>
          <Row label="門市" value={selectedStore?.name || "—"} />
          <Row label="技師" value={selectedTeacher ? `${selectedTeacher.name} ${publicLevel(selectedTeacher.level)}` : "—"} />
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
              {voucherDiscount > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-amber-700">折價券</span>
                  <span className="text-sm font-medium text-amber-700">-${voucherDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-100 mt-2 pt-3 flex justify-between items-center">
                <span className="text-base font-semibold text-[#1a1a1a]">總計</span>
                <span className="text-xl font-bold text-[#b8956a]">${finalPrice.toLocaleString()}</span>
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
          <Row label="手機" value={user?.phone || "（未填寫）"} />
        </div>

        {/* Voucher section */}
        {user?.vouchers && user.vouchers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <button
              onClick={() => setVoucherOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <span className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium">使用折價券（選填）</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8956a" strokeWidth="1.5" style={{ transform: voucherOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {voucherOpen && (
              <div className="px-5 pb-5 space-y-2">
                {user.vouchers.map(v => (
                  <button
                    key={v}
                    onClick={() => setSelectedVoucher(selectedVoucher === v ? null : v)}
                    className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-colors ${selectedVoucher === v ? "bg-[#8b6748]/5 border-[#8b6748] text-[#8b6748] font-medium" : "bg-[#faf7f2] border-[#e8ddd2] text-[#1c1c1c]"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Member tier progress */}
        {(() => {
          const spent = user?.totalSpent ?? 0;
          const afterThis = spent + totalPrice;
          const TIERS = [
            { threshold: 15000, label: "法夏會員", color: "bg-[#8b6748]" },
            { threshold: 30000, label: "黃金會員", color: "bg-amber-500" },
            { threshold: 50000, label: "白金會員", color: "bg-slate-500" },
          ];
          const nextTier = TIERS.find(t => afterThis < t.threshold);
          if (!nextTier) return null;
          const prevThreshold = TIERS[TIERS.indexOf(nextTier) - 1]?.threshold ?? 0;
          const gap = nextTier.threshold - prevThreshold;
          const progress = Math.min(100, Math.round(((afterThis - prevThreshold) / gap) * 100));
          const remaining = nextTier.threshold - afterThis;
          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-[#e8ddd2]">
              <p className="text-xs tracking-[0.12em] text-[#b8956a] uppercase font-medium mb-2">會員升級進度</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a]">距離解鎖 {nextTier.label}</span>
                <span className="text-sm font-semibold text-[#8b6748]">還差 ${remaining.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-[#f5f0e8] rounded-full overflow-hidden">
                <div className={`h-full ${nextTier.color} rounded-full transition-all`} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">累積消費 ${afterThis.toLocaleString()}／目標 ${nextTier.threshold.toLocaleString()}</p>
            </div>
          );
        })()}

        {/* Edit reminder */}
        <div className="bg-[#f5f0e8] rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            確認後，系統將透過 LINE 傳送確認通知。如需更改或取消，請於調理前24小時前聯繫我們。
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-4 bg-[#fafaf8] border-t border-gray-100 space-y-2" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <Button fullWidth size="lg" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "送出中..." : "確認預約"}
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
