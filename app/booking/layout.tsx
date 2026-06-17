import { BookingProvider } from "@/lib/bookingContext";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <div className="bg-[#fafaf8] flex flex-col" style={{ minHeight: "100dvh" }}>
        <div className="flex-1 max-w-lg mx-auto w-full flex flex-col">
          {children}
        </div>
      </div>
    </BookingProvider>
  );
}
