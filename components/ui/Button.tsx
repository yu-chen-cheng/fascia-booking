"use client";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#b8956a] text-white hover:bg-[#a07d58] shadow-sm",
    secondary:
      "bg-[#7a9e8e] text-white hover:bg-[#6a8e7e] shadow-sm",
    ghost:
      "bg-transparent text-[#b8956a] hover:bg-[#f5f0e8]",
    outline:
      "border border-[#b8956a] text-[#b8956a] hover:bg-[#f5f0e8] bg-transparent",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[36px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
