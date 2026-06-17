"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/bookingContext";
import BookingHeader from "@/components/BookingHeader";
import Button from "@/components/ui/Button";

const SUGGESTIONS = [
  "腰部長期痠痛",
  "肩頸緊繃",
  "久坐辦公室",
  "運動後恢復",
  "姿勢矯正需求",
  "頭痛問題",
];

export default function NotesPage() {
  const router = useRouter();
  const { state, setNotes } = useBooking();
  const [notes, setNotesLocal] = useState(state.notes);
  const [selected, setSelected] = useState<string[]>([]);

  const handleContinue = () => {
    setNotes(notes);
    router.push("/booking/confirm");
  };

  const toggleSuggestion = (s: string) => {
    setSelected((prev) => {
      if (prev.includes(s)) {
        const next = prev.filter((x) => x !== s);
        setNotesLocal(next.join("、"));
        return next;
      } else {
        const next = [...prev, s];
        setNotesLocal(next.join("、"));
        return next;
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BookingHeader
        title="備註"
        subtitle="告訴技師您的需求（選填）"
        onBack={() => router.back()}
        step={8}
      />

      <div className="flex-1 px-6 py-6">
        {/* Quick suggestions */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-3">快速選擇常見需求：</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const isOn = selected.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSuggestion(s)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors active:scale-95 ${
                    isOn
                      ? "bg-[#8b6748] border-[#8b6748] text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#8b6748] hover:text-[#8b6748]"
                  }`}
                >
                  {isOn ? "✓ " : ""}{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text area */}
        <textarea
          value={notes}
          onChange={(e) => setNotesLocal(e.target.value)}
          placeholder="例如：長期肩頸僵硬、近期有輕微腰痛、對精油香氣過敏等... 任何有助於技師了解您需求的資訊都歡迎填寫。"
          rows={6}
          className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-[#1a1a1a] placeholder-gray-400 resize-none outline-none focus:border-[#b8956a] transition-colors leading-relaxed"
        />

        <p className="text-xs text-gray-400 mt-2 text-right">
          {notes.length}/200
        </p>

        {/* Note box */}
        <div className="bg-[#f5f0e8] rounded-xl p-4 mt-4">
          <h4 className="text-xs font-medium text-[#b8956a] mb-2">溫馨提醒</h4>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-[#b8956a] mt-0.5">•</span>
              請於預約當天提前 10 分鐘抵達，以便完成接待及療前諮詢
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#b8956a] mt-0.5">•</span>
              建議穿著舒適寬鬆的衣物前來
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#b8956a] mt-0.5">•</span>
              如有任何不適或健康疑慮，請提前告知技師
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pt-4 bg-[#fafaf8] border-t border-gray-100" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <Button fullWidth size="lg" onClick={handleContinue}>
          下一步：確認預約內容
        </Button>
      </div>
    </div>
  );
}
