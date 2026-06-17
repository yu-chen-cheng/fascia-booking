export type StaffLevel = "技師職人" | "技術長" | "準技師" | "實習技師";

export interface Store {
  id: string;
  name: string;
  address: string;
  mapEmbedUrl: string;
  phone: string;
  hours: string;
  comingSoon?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  level: StaffLevel;
  gender: "male" | "female";
  storeIds: string[];
  photoPlaceholder: string;
  tagline: string;
  bio: string;
  specialties: string[];
  yearsExp: number;
  allowedServiceIds: string[]; // service IDs this teacher can perform
  staffOnly?: boolean; // hidden from regular client booking flow
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  priceRegular: Record<string, number>; // keyed by StaffLevel
  priceMember: Record<string, number>;
  description: string;
  category: "fascia" | "training" | "addon";
  isAddon?: boolean;
  onlineBookable: boolean; // whether shown in online booking
}

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

// ─── Stores ────────────────────────────────────────────────────────────────
export const stores: Store[] = [
  {
    id: "xiaoJudan",
    name: "小巨蛋店",
    address: "台北市松山區南京東路四段133巷4弄15號1樓",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.2!2d121.5538!3d25.0521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z5piO5YyX5biC5p6X5bGx5Y2A5Y2X5Lqs5p2x6KGX5ZCI5q615Lu95ZCI5L2N5q615Lu9MTMz5Y2X4bm05byg77yR5Lu95qC55Y-w!5e0!3m2!1szh-TW!2stw!4v1234567890",
    phone: "02-XXXX-XXXX",
    hours: "每週一至週日 10:00–22:00",
  },
  {
    id: "daan",
    name: "大安店",
    address: "台北市大安區信義路四段30巷7弄1號1樓",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.0!2d121.5433!3d25.0330!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z5piO5YyX5biC5aSn5a6J5Y2A5L-h5YqJ6Lev5ZubDTMw5Y2X77yH5byg77yR5Lu95Y-w!5e0!3m2!1szh-TW!2stw!4v1234567891",
    phone: "02-XXXX-XXXX",
    hours: "每週一至週日 10:00–22:00",
  },
  {
    id: "banqiao",
    name: "板橋店",
    address: "新北市板橋區（即將開幕）",
    mapEmbedUrl: "",
    phone: "",
    hours: "",
    comingSoon: true,
  },
];

// ─── Teachers ──────────────────────────────────────────────────────────────
export const teachers: Teacher[] = [
  // ── 小巨蛋店 ──────────────────────────────
  {
    id: "youtong",
    name: "宥彤老師",
    level: "技術長",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "深層筋膜結構整合專家，還原身體最自然的排列",
    bio: "技術長，擅長深層筋膜結構調整與頻率檢測評估。",
    specialties: ["深層筋膜鬆解", "結構整合", "頻率檢測"],
    yearsExp: 5,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
  },
  {
    id: "jimbo",
    name: "Jimbo老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "以專業手法帶領您體驗筋膜放鬆的深度舒緩",
    bio: "小巨蛋店店長，豐富的筋膜調理經驗。",
    specialties: ["全身筋膜調理", "深層放鬆", "慢性疲勞舒緩"],
    yearsExp: 4,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "hanhan",
    name: "韓韓老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "細膩感知，精準找出身體緊繃根源",
    bio: "擅長全身筋膜評估與肩頸部位調理。",
    specialties: ["肩頸調理", "全身筋膜評估", "放鬆舒緩"],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "shuoyuan",
    name: "朔源老師",
    level: "技師職人",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "從根源調整，讓身體重回平衡",
    bio: "專注於筋膜結構根源性調整。",
    specialties: ["深層調整", "腰背部調理", "姿勢矯正"],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "daji",
    name: "大吉老師",
    level: "技師職人",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "有力而穩定的手法，為您帶來深層放鬆",
    bio: "擅長深層筋膜施壓與全身調理。",
    specialties: ["深層施壓", "全身調理", "運動後恢復"],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "lily",
    name: "Lily老師",
    level: "準技師",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "用心學習，全力為您提供舒適調理體驗",
    bio: "準技師，持續精進筋膜調理技術。",
    specialties: ["基礎筋膜放鬆", "全身調理"],
    yearsExp: 1,
    allowedServiceIds: ["basic-60", "addon-20"],
  },
  {
    id: "jojo",
    name: "Jojo老師",
    level: "實習技師",
    gender: "female",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "以學習的心，帶給您溫柔的調理體驗",
    bio: "實習技師，在資深老師指導下進行調理。",
    specialties: ["基礎筋膜放鬆"],
    yearsExp: 0,
    allowedServiceIds: ["basic-60"],
  },
  {
    id: "r3",
    name: "R3老師",
    level: "實習技師",
    gender: "male",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "",
    tagline: "認真學習每一個手法，為您帶來最好的體驗",
    bio: "實習技師，在資深老師指導下進行調理。",
    specialties: ["基礎筋膜放鬆"],
    yearsExp: 0,
    allowedServiceIds: ["basic-60"],
  },
  // ── 大安店 ──────────────────────────────
  {
    id: "atai",
    name: "阿鐵老師",
    level: "技術長",
    gender: "male",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "運動科學結合筋膜療法，協助您重拾身體活動自由",
    bio: "大安店技術長，專精於結構整合與功能式訓練。",
    specialties: ["運動傷害恢復", "姿勢矯正", "功能式訓練"],
    yearsExp: 8,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
  },
  {
    id: "miffy",
    name: "Miffy老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "溫柔而精準，讓每次調理都成為身心療癒的時刻",
    bio: "大安店店長，豐富的筋膜調理與客戶服務經驗。",
    specialties: ["全身筋膜調理", "頭頸部調整", "慢性疲勞"],
    yearsExp: 5,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "cindy",
    name: "Cindy老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "系統性評估，找出您身體真正需要的調整",
    bio: "擅長整體筋膜評估與腰背部調理。",
    specialties: ["整體筋膜評估", "腰背部調理", "壓力管理"],
    yearsExp: 4,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  {
    id: "wenyi",
    name: "雯儀老師",
    level: "技師職人",
    gender: "female",
    storeIds: ["daan"],
    photoPlaceholder: "",
    tagline: "細心聆聽身體的需求，給予最合適的調理",
    bio: "擅長深層放鬆與姿勢改善調理。",
    specialties: ["深層放鬆", "姿勢改善", "全身調理"],
    yearsExp: 3,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "addon-20"],
  },
  // ── 僅限內部使用（staffOnly）──────────────
  {
    id: "yuchen",
    name: "宇辰老師",
    level: "技術長",
    gender: "male",
    storeIds: ["xiaoJudan", "daan"],
    photoPlaceholder: "",
    tagline: "FASCIA 法夏創辦人，筋膜結構美學的推動者",
    bio: "創辦人，全館技術指導，專精於筋膜結構整合與功能式訓練。",
    specialties: ["筋膜結構整合", "功能式訓練", "頻率檢測"],
    yearsExp: 10,
    allowedServiceIds: ["premium-120", "refined-90", "basic-60", "training-50", "frequency-40", "addon-20"],
    staffOnly: true,
  },
];

// ─── Services ──────────────────────────────────────────────────────────────
export const services: Service[] = [
  {
    id: "premium-120",
    name: "頂級筋膜結構整合",
    duration: 120,
    priceRegular: { "技師職人": 3800, "技術長": 4500, "準技師": 3000, "實習技師": 2500 },
    priceMember:  { "技師職人": 3000, "技術長": 3800, "準技師": 2500, "實習技師": 2000 },
    description: "完整的全身筋膜結構評估與深層整合療程。從足部到頭部系統性調整，適合長期姿勢問題或首次深度體驗。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "refined-90",
    name: "精緻筋膜調理",
    duration: 90,
    priceRegular: { "技師職人": 3200, "技術長": 3800, "準技師": 2500, "實習技師": 2000 },
    priceMember:  { "技師職人": 2500, "技術長": 3200, "準技師": 2000, "實習技師": 1600 },
    description: "針對特定部位進行深度筋膜鬆解，搭配全身淺層調理。適合有特定痠痛部位或定期保養需求。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "basic-60",
    name: "基礎筋膜放鬆",
    duration: 60,
    priceRegular: { "技師職人": 2500, "技術長": 3000, "準技師": 2000, "實習技師": 1500 },
    priceMember:  { "技師職人": 2000, "技術長": 2500, "準技師": 1600, "實習技師": 1200 },
    description: "聚焦單一重點部位的精準筋膜調理。忙碌現代人的快速保養首選，高效率釋放緊繃。",
    category: "fascia",
    onlineBookable: true,
  },
  {
    id: "training-50",
    name: "一對一功能式訓練",
    duration: 50,
    priceRegular: { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    priceMember:  { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    description: "個人化結構矯正訓練課程，由技師帶領進行針對性的核心與姿勢訓練，鞏固筋膜調理成效。",
    category: "training",
    onlineBookable: true,
  },
  {
    id: "frequency-40",
    name: "頻率檢測",
    duration: 40,
    priceRegular: { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    priceMember:  { "技師職人": 2500, "技術長": 2500, "準技師": 2500, "實習技師": 2500 },
    description: "專業頻率檢測評估，了解身體筋膜狀態。",
    category: "fascia",
    onlineBookable: false,
  },
  {
    id: "addon-20",
    name: "加購延長 +20分",
    duration: 20,
    priceRegular: { "技師職人": 600, "技術長": 600, "準技師": 600, "實習技師": 600 },
    priceMember:  { "技師職人": 600, "技術長": 600, "準技師": 600, "實習技師": 600 },
    description: "於主療程後加購20分鐘，針對特別需要加強的部位深度處理。",
    category: "addon",
    isAddon: true,
    onlineBookable: true,
  },
];

// ─── Membership Tiers ──────────────────────────────────────────────────────
export const membershipTiers = [
  {
    amount: 15000,
    label: "會員",
    benefits: ["享會員優惠價格"],
    vouchers: [] as string[],
  },
  {
    amount: 30000,
    label: "進階會員",
    benefits: ["享會員優惠價格", "結構訓練券 × 1"],
    vouchers: ["結構訓練券 × 1"],
  },
  {
    amount: 50000,
    label: "頂級會員",
    benefits: ["享會員優惠價格", "結構訓練券 × 1", "頻率檢測券 × 1"],
    vouchers: ["結構訓練券 × 1", "頻率檢測券 × 1"],
  },
];

// ─── Mock User ─────────────────────────────────────────────────────────────
// Default new user state: $0 balance, no consent, no tier
export const mockUser = {
  id: "user001",
  name: "王小明",
  phone: "0912-345-678",
  email: "user@example.com",
  birthday: "1990-05-15",
  isNewUser: true,
  isMember: false,
  storedValue: 0,
  totalSpent: 0,
  consentSigned: false,
  vouchers: [] as string[],
  bookingHistory: [] as Array<{ id: string; date: string; store: string; teacher: string; service: string; amount: number }>,
};

// ─── Available Time Slots Generator ────────────────────────────────────────
export function generateTimeSlots(date: Date, duration: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 10;
  const endHour = 22;
  const intervalMinutes = 30; // 整點與半點

  // Simulate some unavailable slots based on date
  const dayOfWeek = date.getDay();
  const unavailableHours = dayOfWeek === 0 ? [] : [11, 13, 15, 18]; // Sunday open, others have some blocks

  // Check if the selected date is today; if so, filter out past slots (with 30-min buffer)
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const bufferMinutes = 30;
  const cutoffTotalMins = isToday
    ? (now.getHours() - startHour) * 60 + now.getMinutes() + bufferMinutes
    : -Infinity;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      // Check if enough time remains before closing
      const totalMinsFromStart = (hour - startHour) * 60 + min;
      const closingMins = (endHour - startHour) * 60;
      if (totalMinsFromStart + duration > closingMins) break;

      // Skip past time slots for today (gray out by marking unavailable)
      if (totalMinsFromStart < cutoffTotalMins) {
        // Don't add past slots at all — they should not be selectable
        continue;
      }

      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      // Mock availability
      const isUnavailable =
        unavailableHours.includes(hour) ||
        (hour === 14 && min < 30) ||
        (dayOfWeek === 1); // Monday closed

      slots.push({
        time: timeStr,
        available: !isUnavailable,
      });
    }
  }

  return slots;
}
