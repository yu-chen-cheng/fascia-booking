"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { teachers, Teacher } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";

const LEVEL_COLORS: Record<string, string> = {
  "技術長": "bg-amber-50 text-amber-700 border-amber-200",
  "技師職人": "bg-[#f0f7f4] text-[#7a9e8e] border-[#a8c4b8]",
  "準技師": "bg-purple-50 text-purple-600 border-purple-200",
  "實習技師": "bg-gray-50 text-gray-500 border-gray-200",
};

// Gender color themes
const GENDER_THEME = {
  female: {
    card: "bg-[#fff5f7]",
    avatar: "from-[#f4b8c8] to-[#e8889e]",
    ring: "ring-[#f4b8c8]",
    ringSelected: "ring-[#e8889e]",
  },
  male: {
    card: "bg-[#f0f6ff]",
    avatar: "from-[#90b8e8] to-[#5a8fc4]",
    ring: "ring-[#b8d4f4]",
    ringSelected: "ring-[#5a8fc4]",
  },
};

export default function TeacherPage() {
  const router = useRouter();
  const { state, setSelectedTeacher } = useBooking();
  const [selected, setSelected] = useState<Teacher | null>(state.selectedTeacher);
  const [bioOpen, setBioOpen] = useState<string | null>(null);
  const [showStaffOnly, setShowStaffOnly] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const storeTeachers = teachers.filter(
    (t) => (!state.selectedStore || t.storeIds.includes(state.selectedStore.id))
      && (showStaffOnly ? true : !t.staffOnly)
  );

  // Hidden tap target to reveal staffOnly teachers (tap title 5 times)
  const handleTitleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setShowStaffOnly(true);
      setTapCount(0);
    }
  };

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <div onClick={handleTitleTap}>
        <BookingHeader
          title="選擇技師"
          subtitle={state.selectedStore ? `${state.selectedStore.name} 的技師` : ""}
          onBack={() => router.back()}
          step={5}
        />
      </div>

      <div className="flex-1 px-5 py-4 space-y-3">
        {storeTeachers.map((teacher) => {
          const theme = GENDER_THEME[teacher.gender];
          const isSelected = selected?.id === teacher.id;

          return (
            <div
              key={teacher.id}
              onClick={() => setBioOpen(teacher.id)}
              className={`w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] ${theme.card} ring-1 ${theme.ring} shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center gap-4 px-4 py-4">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${theme.avatar} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <span className="text-xl text-white font-light">
                    {teacher.name.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">{teacher.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLORS[teacher.level] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {teacher.level}
                    </span>
                    {teacher.staffOnly && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-medium">內部</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-snug">{teacher.tagline}</p>
                </div>

                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-300 flex-shrink-0">
                  <path d="M7 13l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          );
        })}

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
              const theme = GENDER_THEME[t.gender];
              return (
                <>
                  <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${theme.avatar} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <span className="text-2xl text-white font-light">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.name}</h3>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium mt-1 ${LEVEL_COLORS[t.level] || ""}`}>
                        {t.level}
                      </span>
                    </div>
                  </div>

                  {/* Bio text */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">{t.bio}</p>

                  {/* Specialties */}
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

                  {/* Certifications */}
                  {t.certifications.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium mb-2">專業研習與認證</h4>
                      <ul className="space-y-1.5">
                        {t.certifications.map((cert) => (
                          <li key={cert} className="flex items-start gap-2">
                            <span className="text-[#b8956a] mt-0.5 flex-shrink-0">·</span>
                            <span className="text-xs text-gray-500 leading-snug">{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {t.yearsExp > 0 && (
                    <p className="text-xs text-gray-400">執業經驗 {t.yearsExp} 年</p>
                  )}

                  <button
                    onClick={() => {
                      setSelected(t);
                      setSelectedTeacher(t);
                      setBioOpen(null);
                      setTimeout(() => router.push("/booking/service"), 150);
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

    </div>
    </>
  );
}
