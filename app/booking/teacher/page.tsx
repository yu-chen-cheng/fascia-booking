"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { teachers, Teacher } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

const LEVEL_COLORS: Record<string, string> = {
  "技術長": "bg-amber-50 text-amber-700 border-amber-200",
  "技師職人": "bg-sage-50 text-[#7a9e8e] border-[#a8c4b8]",
};

export default function TeacherPage() {
  const router = useRouter();
  const { state, setSelectedTeacher } = useBooking();
  const [selected, setSelected] = useState<Teacher | null>(state.selectedTeacher);
  const [bioOpen, setBioOpen] = useState<string | null>(null);

  const storeTeachers = teachers.filter(
    (t) => !state.selectedStore || t.storeIds.includes(state.selectedStore.id)
  );

  const handleContinue = () => {
    if (!selected) return;
    setSelectedTeacher(selected);
    router.push("/booking/service");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="選擇技師"
        subtitle={state.selectedStore ? `${state.selectedStore.name} 的技師` : ""}
        onBack={() => router.back()}
        step={5}
      />

      <div className="flex-1 px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          {storeTeachers.map((teacher) => (
            <div key={teacher.id}>
              <div
                onClick={() => setSelected(teacher)}
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                  selected?.id === teacher.id
                    ? "ring-2 ring-[#b8956a] shadow-md"
                    : "ring-1 ring-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Photo placeholder */}
                <div className="relative h-36 bg-gradient-to-br from-[#f5f0e8] to-[#e8ddd0] flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4b896] to-[#b8956a] flex items-center justify-center shadow-md">
                    <span className="text-2xl text-white font-light">
                      {teacher.name.charAt(0)}
                    </span>
                  </div>
                  {selected?.id === teacher.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#b8956a] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">{teacher.name}</h3>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLORS[teacher.level] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {teacher.level}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-2 leading-snug line-clamp-2">
                    {teacher.tagline}
                  </p>

                  {/* Bio button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBioOpen(bioOpen === teacher.id ? null : teacher.id);
                    }}
                    className="mt-2 text-[11px] text-[#b8956a] hover:underline"
                  >
                    查看介紹
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {storeTeachers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>此門市目前無可預約技師</p>
          </div>
        )}
      </div>

      {/* Bio Modal */}
      {bioOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setBioOpen(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const t = teachers.find((t) => t.id === bioOpen)!;
              return (
                <>
                  <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4b896] to-[#b8956a] flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-2xl text-white font-light">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.name}</h3>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium mt-1 ${LEVEL_COLORS[t.level] || ""}`}>
                        {t.level}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.bio}</p>

                  <div className="mb-4">
                    <h4 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-2">專長</h4>
                    <div className="flex flex-wrap gap-2">
                      {t.specialties.map((sp) => (
                        <span key={sp} className="px-3 py-1 bg-[#f5f0e8] text-[#b8956a] text-xs rounded-full">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">執業經驗 {t.yearsExp} 年</p>

                  <button
                    onClick={() => {
                      setSelected(t);
                      setBioOpen(null);
                    }}
                    className="w-full mt-4 py-3.5 bg-[#b8956a] text-white rounded-xl font-medium hover:bg-[#a07d58] transition-colors"
                  >
                    選擇 {t.name} 技師
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-[#fafaf8] border-t border-gray-100">
        <Button fullWidth size="lg" onClick={handleContinue} disabled={!selected}>
          {selected ? `確認選擇 ${selected.name}` : "請選擇技師"}
        </Button>
      </div>
    </div>
  );
}
