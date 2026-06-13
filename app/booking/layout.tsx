import { BookingProvider } from "@/lib/bookingContext";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <div className="min-h-screen bg-[#fafaf8] flex flex-col">
        <div className="flex-1 max-w-lg mx-auto w-full">
          {children}
        </div>
      </div>
    </BookingProvider>
  );
}
