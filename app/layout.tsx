import type { Metadata, Viewport } from "next";
import { Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-noto-serif-tc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FASCIA 法夏・筋膜結構美學",
  description: "專業筋膜調理預約系統",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${notoSerifTC.variable} h-full`}>
      <body className="min-h-full bg-[#fafaf8] text-[#1a1a1a]">{children}</body>
    </html>
  );
}
