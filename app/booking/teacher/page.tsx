"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { teachers, Teacher } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";

export default function TeacherPage() {
  const router = useRouter();
  const { state, setSelectedTeacher } = useBooking();
  const [selected, setSelected] = useState<Teacher | "any" | null>(
    state.selectedTeacher === null ? null : state.selectedTeacher
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      !t.staffOnly &&
      (!state.selectedStore || t.storeIds.includes(state.selectedStore.id)) &&
      (!state.selectedService || t.allowedServiceIds.includes(state.selectedService.id))
  );

  const handleSelect = (teacher: Teacher | null) => {
    if (teacher === null) {
      setSelected("any");
      setSelectedTeacher(null);
    } else {
      setSelected(teacher);
      setSelectedTeacher(teacher);
    }
  };

  const handleContinue = () => {
    if (selected === null) return;
    router.push("/booking/service");
  };

  const hasSelected = selected !== null;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <BookingHeader
        title="選擇技師"
        onBack={() => router.back()}
      />

      <div className="flex-1 px-4 py-4 space-y-2">
        {/* No preference option */}
        <button
          onClick={() => handleSelect(null)}
          className={`w-full text-left px-4 py-4 bg-white border rounded-xl transition-colors ${
            selected === "any" ? "border-[#8b6748]" : "border-[#e8ddd2]"
          }`}
        >
          <p className="text-sm font-semibold text-[#1c1c1c]">不指定技師</p>
        </button>

        {filteredTeachers.map((teacher) => {
          const isSelected = selected !== "any" && (selected as Teacher | null)?.id === teacher.id;
          return (
            <button
              key={teacher.id}
              onClick={() => handleSelect(teacher)}
              className={`w-full text-left px-4 py-4 bg-white border rounded-xl transition-colors ${
                isSelected ? "border-[#8b6748]" : "border-[#e8ddd2]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1c1c1c]">{teacher.name}</p>
                <span className="text-xs text-[#8a7a6e] border border-[#e8ddd2] px-2 py-0.5 rounded">
                  {teacher.level}
                </span>
              </div>
            </button>
          );
        })}

        {filteredTeachers.length === 0 && (
          <p className="text-sm text-[#8a7a6e] text-center py-8">此門市目前無可預約技師</p>
        )}
      </div>

      <div className="px-4 py-4 border-t border-[#e8ddd2]">
        <button
          onClick={handleContinue}
          disabled={!hasSelected}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors ${
            hasSelected
              ? "bg-[#8b6748] text-white"
              : "bg-[#e8ddd2] text-[#8a7a6e] cursor-not-allowed"
          }`}
        >
          {hasSelected ? "繼續" : "請選擇技師"}
        </button>
      </div>
    </div>
  );
}
