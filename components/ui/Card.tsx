import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  selected = false,
  hoverable = false,
}: CardProps) {
  const base = "bg-white rounded-2xl p-5 transition-all duration-200";
  const selectedCls = selected
    ? "ring-2 ring-[#b8956a] shadow-md"
    : "ring-1 ring-gray-100 shadow-sm";
  const hoverCls =
    hoverable || onClick
      ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
      : "";

  return (
    <div
      className={`${base} ${selectedCls} ${hoverCls} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
