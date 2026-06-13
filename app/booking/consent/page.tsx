"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

export default function ConsentPage() {
  const router = useRouter();
  const { state, setConsentSigned } = useBooking();
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (atBottom) setScrolledToBottom(true);
  };

  const handleConfirm = () => {
    setConsentSigned(true);
    router.push("/booking/store");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="療程同意書"
        subtitle="請仔細閱讀以下內容"
        onBack={() => router.back()}
        step={3}
      />

      <div className="flex-1 flex flex-col px-6 py-4">
        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="text-center mb-3">
            <p className="text-xs text-gray-400 animate-pulse">請向下捲動閱讀完整內容</p>
          </div>
        )}

        {/* Consent content */}
        <div
          className="flex-1 bg-white rounded-2xl p-5 overflow-y-auto border border-gray-100 shadow-sm"
          style={{ maxHeight: "calc(100vh - 280px)" }}
          onScroll={handleScroll}
        >
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">
            FASCIA 法夏・筋膜結構美學<br />
            客戶知情同意書
          </h2>

          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">一、服務說明</h3>
              <p>本工作室提供專業筋膜調理與結構整合服務，包含徒手筋膜鬆解、結構評估及個人化訓練指導。所有療程均由受過專業訓練的技師執行。</p>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">二、風險告知</h3>
              <p>筋膜調理療程為非侵入性手法，一般而言安全性高。然而，部分客戶在療程後可能出現以下暫時性反應：</p>
              <ul className="mt-2 space-y-1 pl-4">
                <li>• 局部肌肉痠痛感（通常於24-48小時內消退）</li>
                <li>• 輕微紅腫或敏感反應</li>
                <li>• 短暫疲倦感或排毒反應</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">三、禁忌症說明</h3>
              <p>如您有以下情況，請於預約前告知本工作室，技師將評估療程適宜性：</p>
              <ul className="mt-2 space-y-1 pl-4">
                <li>• 懷孕期間</li>
                <li>• 急性炎症或感染</li>
                <li>• 血液凝固異常或服用抗凝血藥物</li>
                <li>• 骨折或急性撕裂傷</li>
                <li>• 惡性腫瘤</li>
                <li>• 皮膚開放性傷口</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">四、客戶責任</h3>
              <p>本人確認已如實告知技師個人健康狀況、過往病史及任何可能影響療程的相關信息。如因隱瞞病史導致不良反應，本工作室不負相關責任。</p>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">五、隱私保護</h3>
              <p>本工作室依個人資料保護法規定，妥善保管您的個人資料與療程記錄，非經您的同意不得對外提供第三方使用。</p>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">六、取消與退費政策</h3>
              <p>預約確認後如需取消或更改，請於療程開始前24小時前通知。未依規定取消者，將酌收50%服務費用。</p>
            </section>

            <section>
              <h3 className="font-medium text-[#1a1a1a] mb-2">七、照片及影像</h3>
              <p>除非獲得您的明確書面同意，本工作室不會拍攝或記錄您的療程過程或個人形象用於商業用途。</p>
            </section>

            <div className="bg-[#f5f0e8] rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-500">
                ※ 本同意書適用於法夏旗下所有門市之所有療程服務。如有疑問，歡迎於療程前向技師詢問。
              </p>
            </div>
          </div>
        </div>

        {/* Agree checkbox */}
        <div className="mt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors mt-0.5 ${
                agreed
                  ? "bg-[#b8956a] border-[#b8956a]"
                  : "border-gray-300 bg-white"
              }`}
            >
              {agreed && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-600 leading-relaxed">
              本人已詳細閱讀並完全理解上述同意書內容，同意接受相關服務條款及規範。
            </span>
          </label>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100">
        <Button
          fullWidth
          size="lg"
          onClick={handleConfirm}
          disabled={!agreed}
        >
          確認同意，繼續預約
        </Button>
      </div>
    </div>
  );
}
