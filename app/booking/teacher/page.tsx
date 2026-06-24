"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import { teachers, Teacher, monthlyBookingCounts } from "@/lib/mockData";
import BookingHeader from "@/components/BookingHeader";

const LEVEL_COLORS: Record<string, string> = {
  "技術長": "bg-amber-50 text-amber-700 border-amber-200",
  "技師職人": "bg-[#f0f7f4] text-[#7a9e8e] border-[#a8c4b8]",
  "準技師": "bg-purple-50 text-purple-600 border-purple-200",
  "實習技師": "bg-gray-50 text-gray-500 border-gray-200",
};

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

// ── 症狀 → 技師 對應表（從自傳分析）─────────────────────────
const SYMPTOM_TEACHER_MAP: Record<string, string[]> = {
  "頭肩頸": ["youtong", "jimbo", "hanhan", "daji", "lily", "jojo", "r3", "atai", "miffy", "cindy", "wenyi"],
  "下背酸痛": ["jimbo", "shuoyuan", "daji", "r3", "atai", "miffy", "cindy", "wenyi"],
  "上肢": ["youtong", "jimbo", "hanhan", "daji", "jojo", "r3", "miffy", "cindy", "wenyi"],
  "下肢": ["youtong", "jimbo", "shuoyuan", "daji", "r3", "atai", "miffy", "cindy", "wenyi"],
  "足底": ["youtong", "atai"],
};

const SYMPTOMS = ["頭肩頸", "下背酸痛", "上肢", "下肢", "足底"] as const;
type Symptom = typeof SYMPTOMS[number];

const SYMPTOM_ICONS: Record<Symptom, string> = {
  "頭肩頸": "⊙",
  "下背酸痛": "⊕",
  "上肢": "⊗",
  "下肢": "⊘",
  "足底": "⊛",
};

export default function TeacherPage() {
  const router = useRouter();
  const { state, setSelectedTeacher } = useBooking();
  const [selected, setSelected] = useState<Teacher | null>(state.selectedTeacher);
  const [bioOpen, setBioOpen] = useState<string | null>(null);
  const [showStaffOnly, setShowStaffOnly] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [filterGender, setFilterGender] = useState<"all" | "female" | "male">("all");
  const [filterSenior, setFilterSenior] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);

  const toggleSymptom = (s: Symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // ── 演算法：依症狀計算每位技師的匹配分數 ─────────────────
  const getSymptomMatchScore = (teacher: Teacher): number => {
    if (selectedSymptoms.length === 0) return 0;
    return selectedSymptoms.filter((s) =>
      SYMPTOM_TEACHER_MAP[s]?.includes(teacher.id)
    ).length;
  };

  const LEVEL_WEIGHT: Record<string, number> = {
    "技術長": 3.0,
    "技師職人": 1.8,
    "準技師": 0.8,
    "實習技師": 0.4,
  };

  // 負荷均衡：預約越少分數越高
  const loadScore = (t: Teacher) =>
    100 - (monthlyBookingCounts[t.id] ?? 0) * (LEVEL_WEIGHT[t.level] ?? 1);

  const sortedTeachers = teachers
    .filter((t) =>
      (!state.selectedStore || t.storeIds.includes(state.selectedStore.id)) &&
      (showStaffOnly ? true : !t.staffOnly) &&
      (filterGender === "all" || t.gender === filterGender) &&
      (!filterSenior || t.level === "技術長" || t.level === "技師職人")
    )
    .sort((a, b) => {
      if (selectedSymptoms.length > 0) {
        const scoreA = getSymptomMatchScore(a);
        const scoreB = getSymptomMatchScore(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        // 同分：負荷少的優先
        return loadScore(b) - loadScore(a);
      }
      // 無症狀：原本的預約量排序
      return (monthlyBookingCounts[b.id] ?? 0) * (LEVEL_WEIGHT[b.level] ?? 1)
        - (monthlyBookingCounts[a.id] ?? 0) * (LEVEL_WEIGHT[a.level] ?? 1);
    });

  // 分成推薦 vs 其他
  const recommendedTeachers =
    selectedSymptoms.length > 0
      ? sortedTeachers.filter((t) => getSymptomMatchScore(t) === selectedSymptoms.length)
      : [];
  const otherTeachers =
    selectedSymptoms.length > 0
      ? sortedTeachers.filter((t) => getSymptomMatchScore(t) < selectedSymptoms.length)
      : sortedTeachers;

  const handleTitleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) { setShowStaffOnly(true); setTapCount(0); }
  };

  const TeacherCard = ({ teacher, isRecommended = false }: { teacher: Teacher; isRecommended?: boolean }) => {
    const theme = GENDER_THEME[teacher.gender];
    const matchScore = getSymptomMatchScore(teacher);

    return (
      <div
        onClick={() => setBioOpen(teacher.id)}
        className={`w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] ${theme.card} ring-1 ${
          isRecommended ? "ring-[#b8956a] shadow-md shadow-[#b8956a]/10" : theme.ring + " shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4 px-4 py-4">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${theme.avatar} flex items-center justify-center shadow-sm flex-shrink-0 relative`}>
            <span className={`text-white font-light ${teacher.avatarText.length > 2 ? "text-xs" : "text-base"}`}>
              {teacher.avatarText}
            </span>
            {isRecommended && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#b8956a] flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">✓</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-semibold text-[#1a1a1a]">{teacher.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLORS[teacher.level] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {teacher.level}
              </span>
              {teacher.subtitle && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f0e8] text-[#b8956a] border border-[#d4b896] font-medium">{teacher.subtitle}</span>
              )}
              {teacher.staffOnly && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-medium">內部</span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-snug">{teacher.tagline}</p>
            {selectedSymptoms.length > 0 && matchScore > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedSymptoms
                  .filter((s) => SYMPTOM_TEACHER_MAP[s]?.includes(teacher.id))
                  .map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-[#b8956a]/10 text-[#8b6748] rounded-full">
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-300 flex-shrink-0">
            <path d="M7 13l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
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

      {/* 症狀選擇器 */}
      <div className="bg-white border-b border-[#e8ddd2] px-5 pt-4 pb-4">
        <p className="text-xs text-[#b8956a] font-medium tracking-wider uppercase mb-3">
          今天哪裡不舒服？（可多選）
        </p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const active = selectedSymptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "bg-[#b8956a] text-white border-[#b8956a] shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#b8956a] hover:text-[#b8956a]"
                }`}
              >
                <span className="text-sm">{SYMPTOM_ICONS[s]}</span>
                {s}
              </button>
            );
          })}
          {selectedSymptoms.length > 0 && (
            <button
              onClick={() => setSelectedSymptoms([])}
              className="px-3 py-1.5 rounded-full text-xs text-gray-400 border border-gray-100 hover:text-gray-600 transition-colors"
            >
              清除
            </button>
          )}
        </div>
        {selectedSymptoms.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            根據您的狀況，以下技師最適合您 ↓
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="px-5 pt-3 pb-1 flex gap-2">
        <button
          onClick={() => setFilterGender(filterGender === "female" ? "all" : "female")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterGender === "female" ? "bg-[#f4b8c8] text-white border-[#e8889e]" : "bg-white text-gray-500 border-gray-200"}`}
        >
          👩 女生技師
        </button>
        <button
          onClick={() => setFilterGender(filterGender === "male" ? "all" : "male")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterGender === "male" ? "bg-[#90b8e8] text-white border-[#5a8fc4]" : "bg-white text-gray-500 border-gray-200"}`}
        >
          👨 男生技師
        </button>
        <button
          onClick={() => setFilterSenior(s => !s)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSenior ? "bg-[#8b6748] text-white border-[#8b6748]" : "bg-white text-gray-500 border-gray-200"}`}
        >
          ✦ 資深技師
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4">
        {/* 推薦區塊 */}
        {recommendedTeachers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs tracking-[0.15em] text-[#b8956a] uppercase font-medium">推薦技師</span>
              <div className="flex-1 h-px bg-[#e8ddd2]" />
            </div>
            <div className="space-y-3">
              {recommendedTeachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} isRecommended />
              ))}
            </div>
          </div>
        )}

        {/* 其他技師 */}
        {otherTeachers.length > 0 && (
          <div>
            {selectedSymptoms.length > 0 && recommendedTeachers.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs tracking-[0.15em] text-gray-400 uppercase font-medium">其他技師</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
            <div className="space-y-3">
              {otherTeachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </div>
          </div>
        )}

        {sortedTeachers.length === 0 && (
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
            className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const t = teachers.find((t) => t.id === bioOpen)!;
              const theme = GENDER_THEME[t.gender];
              const matchScore = getSymptomMatchScore(t);
              const isFullMatch = selectedSymptoms.length > 0 && matchScore === selectedSymptoms.length;
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
                    <button
                      onClick={() => setBioOpen(null)}
                      className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  {isFullMatch && (
                    <div className="bg-[#f5f0e8] rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                      <span className="text-[#b8956a]">✓</span>
                      <p className="text-xs text-[#8b6748] font-medium">
                        符合您選擇的所有症狀：{selectedSymptoms.join("、")}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${theme.avatar} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <span className={`text-white font-light ${t.avatarText.length > 2 ? "text-sm" : "text-xl"}`}>{t.avatarText}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">{t.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLORS[t.level] || ""}`}>
                          {t.level}
                        </span>
                        {t.subtitle && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#f5f0e8] text-[#b8956a] border border-[#d4b896] font-medium">{t.subtitle}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">{t.bio}</p>

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
                    <p className="text-xs text-gray-400 mb-4">執業經驗 {t.yearsExp} 年</p>
                  )}

                  <button
                    onClick={() => {
                      setSelected(t);
                      setSelectedTeacher(t);
                      setBioOpen(null);
                      setTimeout(() => router.push("/booking/service"), 150);
                    }}
                    className="w-full py-3.5 bg-[#b8956a] text-white rounded-xl font-medium hover:bg-[#a07d58] transition-colors"
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
