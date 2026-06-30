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

export default function BookingHeader({
  title,
  showBack = true,
  onBack,
}: BookingHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-[#faf7f2] border-b border-[#e8ddd2]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8"
            aria-label="返回"
          >
            <svg
              width="18"
              height="18"
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
        <div>
          <p className="text-[10px] tracking-[0.2em] text-[#8b6748] uppercase font-medium leading-none">
            FASCIA 法夏
          </p>
          <h1 className="text-base font-semibold text-[#1c1c1c] leading-tight">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
