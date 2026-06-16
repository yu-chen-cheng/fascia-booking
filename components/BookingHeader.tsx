"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface BookingHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
}

const STEPS = [
  "登入",
  "基本資料",
  "同意書",
  "選擇門市",
  "選擇技師",
  "選擇服務",
  "選擇時間",
  "備註",
  "確認",
];

export default function BookingHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  step,
  totalSteps = 9,
}: BookingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const progress = step !== undefined ? ((step) / totalSteps) * 100 : undefined;

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e8ddd2]">
      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#8b6748] to-[#7a9e8e] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Top row */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="返回"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.5 16.5L6 10l6.5-6.5" />
              </svg>
            </button>
          )}

          <div className="flex-1">
            {/* Brand */}
            <p className="text-[10px] tracking-[0.2em] text-[#8b6748] uppercase font-medium">
              FASCIA 法夏
            </p>
            <h1 className="text-lg font-semibold text-[#1a1a1a] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Step indicator */}
          {step !== undefined && (
            <div className="text-right">
              <span className="text-xs text-gray-400">
                {step}/{totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Step dots */}
        {step !== undefined && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {STEPS.map((s, i) => (
              <div
                key={i}
                title={s}
                className={`flex-shrink-0 h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 < step
                    ? "w-4 bg-[#8b6748]"
                    : i + 1 === step
                    ? "w-6 bg-[#8b6748]"
                    : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
