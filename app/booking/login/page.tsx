"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import {
  initLiff,
  isLiffLoggedIn,
  liffLogin,
  getLiffProfile,
} from "@/lib/liff";

const LIFF_URL = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setLoggedIn, setConsentSigned } = useBooking();

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [isLocalhost, setIsLocalhost] = useState(false);

  // On mount: detect localhost and auto-handle already-logged-in LIFF users
  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setIsLocalhost(isLocal);

    if (!isLocal) {
      // Try to silently initialise LIFF and redirect if already logged in
      (async () => {
        setStatus("loading");
        const ok = await initLiff();
        if (!ok) { setStatus("idle"); return; }

        if (isLiffLoggedIn()) {
          await handlePostLogin();
        } else {
          setStatus("idle");
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Called after LIFF login is confirmed – look up user and route */
  const handlePostLogin = async () => {
    const profile = await getLiffProfile();
    if (!profile) { setStatus("error"); return; }

    setLoggedIn(true);

    // Check if user has previously registered (localStorage flag)
    const previouslyRegistered =
      localStorage.getItem("fascia_registration_done") === "true";

    if (previouslyRegistered) {
      const savedName = localStorage.getItem("fascia_user_name") || profile.displayName;
      const savedPhone = localStorage.getItem("fascia_user_phone") || "";
      setUser({
        id: profile.userId,
        name: savedName,
        phone: savedPhone,
        email: "",
        birthday: "",
        isNewUser: false,
        isMember: false,
        storedValue: 0,
        totalSpent: 0,
        consentSigned: true,
        vouchers: [],
        bookingHistory: [],
      });
      setConsentSigned(true);
      router.push("/booking/store");
    } else {
      // New user – pass LINE display name via sessionStorage for register page
      sessionStorage.setItem("liff_display_name", profile.displayName);
      sessionStorage.setItem("liff_user_id", profile.userId);
      if (profile.pictureUrl) {
        sessionStorage.setItem("liff_picture_url", profile.pictureUrl);
      }
      router.push("/booking/register");
    }
  };

  const handleLineLoginClick = async () => {
    setStatus("loading");
    const ok = await initLiff();
    if (!ok) { setStatus("error"); return; }

    if (isLiffLoggedIn()) {
      await handlePostLogin();
    } else {
      liffLogin(); // redirects to LINE OAuth
    }
  };

  // ── Localhost test mode ────────────────────────────────────────────────────
  const handleTestModeLogin = (isNew: boolean) => {
    setLoggedIn(true);
    if (isNew) {
      sessionStorage.setItem("liff_display_name", "測試用戶");
      sessionStorage.setItem("liff_user_id", "test_user_001");
      router.push("/booking/register");
    } else {
      setUser({
        id: "test_user_001",
        name: "Allen 測試",
        phone: "0912345678",
        email: "",
        birthday: "1990-01-01",
        isNewUser: false,
        isMember: false,
        storedValue: 0,
        totalSpent: 0,
        consentSigned: true,
        vouchers: [],
        bookingHistory: [],
      });
      setConsentSigned(true);
      router.push("/booking/store");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="登入"
        subtitle="使用 LINE 帳號快速登入"
        showBack={true}
        onBack={() => router.push("/")}
        step={1}
      />

      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Brand section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#b8956a] to-[#d4b896] flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-xl font-light text-white">法</span>
          </div>
          <h2 className="text-xl font-medium text-[#1a1a1a] mb-2">歡迎回來</h2>
          <p className="text-sm text-gray-500">請使用 LINE 帳號登入以繼續預約</p>
        </div>

        {/* Benefits */}
        <div className="bg-[#f5f0e8] rounded-2xl p-5 mb-8">
          <h3 className="text-xs tracking-[0.15em] text-[#b8956a] font-medium uppercase mb-3">
            會員專屬權益
          </h3>
          <div className="space-y-2">
            {[
              "首次預約享會員優惠價格",
              "儲值 $15,000 解鎖長期會員優惠",
              "LINE 即時預約確認通知",
              "專屬療程記錄管理",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#b8956a] flex-shrink-0" />
                <span className="text-sm text-gray-600">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-auto">
          {status === "error" && (
            <p className="text-center text-red-500 text-sm">
              LINE 登入發生錯誤，請稍後再試。
            </p>
          )}

          {/* LINE Login Button */}
          <button
            onClick={handleLineLoginClick}
            disabled={status === "loading"}
            className="w-full py-4 bg-[#06C755] text-white text-base font-medium rounded-2xl flex items-center justify-center gap-3 shadow-md shadow-[#06C755]/20 hover:bg-[#05b84d] transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                正在連接 LINE…
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                使用 LINE 登入
              </>
            )}
          </button>

          {/* Localhost dev mode */}
          {isLocalhost && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-xs text-amber-700 font-medium text-center">
                開發模式（localhost）– 模擬 LINE 登入
              </p>
              <button
                onClick={() => handleTestModeLogin(false)}
                className="w-full py-3 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-all"
              >
                模擬舊用戶登入
              </button>
              <button
                onClick={() => handleTestModeLogin(true)}
                className="w-full py-3 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-all"
              >
                模擬新用戶登入
              </button>
            </div>
          )}

          {/* Share LIFF URL hint */}
          <p className="text-xs text-center text-gray-400 mt-1">
            或直接開啟：{" "}
            <a href={LIFF_URL} className="underline text-[#06C755]" target="_blank" rel="noreferrer">
              {LIFF_URL}
            </a>
          </p>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4 px-4">
          登入即表示您同意我們的服務條款及隱私權政策
        </p>
      </div>
    </div>
  );
}
