export type StaffLevel = "技師職人" | "技術長";

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
  storeIds: string[];
  photoPlaceholder: string;
  tagline: string;
  bio: string;
  specialties: string[];
  yearsExp: number;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  priceRegular: Record<StaffLevel, number>;
  priceMember: Record<StaffLevel, number>;
  description: string;
  category: "fascia" | "training" | "addon";
  isAddon?: boolean;
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
  {
    id: "teacher1",
    name: "陳雅婷",
    level: "技術長",
    storeIds: ["xiaoJudan", "daan"],
    photoPlaceholder: "/placeholders/teacher1.jpg",
    tagline: "專注深層筋膜結構調整，還原身體最自然的排列",
    bio: "擁有超過10年的筋膜調理經驗，專精於結構整合與深層肌筋膜鬆解。曾赴日本、德國研修最新筋膜療法技術，以精準的觸感評估找出身體失衡根源。",
    specialties: ["深層筋膜鬆解", "脊椎結構整合", "骨盆矯正"],
    yearsExp: 10,
  },
  {
    id: "teacher2",
    name: "林俊宏",
    level: "技術長",
    storeIds: ["daan"],
    photoPlaceholder: "/placeholders/teacher2.jpg",
    tagline: "運動傷害復原專家，協助您重拾身體的活動自由",
    bio: "前職業運動員出身，深刻理解身體結構與運動表現的關聯。結合運動科學與筋膜調理，為各類運動傷害提供精準的恢復方案。",
    specialties: ["運動傷害恢復", "姿勢矯正", "結構訓練"],
    yearsExp: 8,
  },
  {
    id: "teacher3",
    name: "王思涵",
    level: "技師職人",
    storeIds: ["xiaoJudan"],
    photoPlaceholder: "/placeholders/teacher3.jpg",
    tagline: "以溫柔而有力的手法，帶領您體驗筋膜鬆解的深度放鬆",
    bio: "畢業於台灣體育運動大學，持有多項國際認證筋膜療法執照。擅長透過細膩的手法感知，逐步引導筋膜回到最佳狀態。",
    specialties: ["全身筋膜調理", "頭頸部調整", "慢性疲勞舒緩"],
    yearsExp: 5,
  },
  {
    id: "teacher4",
    name: "張美玲",
    level: "技師職人",
    storeIds: ["xiaoJudan", "daan"],
    photoPlaceholder: "/placeholders/teacher4.jpg",
    tagline: "讓每一次療程都成為您與身體深度對話的時刻",
    bio: "專注於整體性筋膜評估與調理，相信身體具有自我修復的能力。透過系統性的筋膜鬆解，協助客戶建立對自身身體的全新認識。",
    specialties: ["整體筋膜評估", "腰背部調理", "壓力管理"],
    yearsExp: 6,
  },
];

// ─── Services ──────────────────────────────────────────────────────────────
export const services: Service[] = [
  {
    id: "premium-120",
    name: "頂級筋膜結構整合",
    duration: 120,
    priceRegular: { "技師職人": 3800, "技術長": 4500 },
    priceMember: { "技師職人": 3000, "技術長": 3800 },
    description:
      "完整的全身筋膜結構評估與深層整合療程。從足部到頭部系統性調整，適合長期姿勢問題或首次深度體驗。",
    category: "fascia",
  },
  {
    id: "refined-90",
    name: "精緻筋膜調理 90分",
    duration: 90,
    priceRegular: { "技師職人": 3200, "技術長": 3800 },
    priceMember: { "技師職人": 2500, "技術長": 3200 },
    description:
      "針對特定部位進行深度筋膜鬆解，搭配全身淺層調理。適合有特定痠痛部位或定期保養需求。",
    category: "fascia",
  },
  {
    id: "refined-60",
    name: "精緻筋膜調理 60分",
    duration: 60,
    priceRegular: { "技師職人": 2500, "技術長": 3000 },
    priceMember: { "技師職人": 2000, "技術長": 2500 },
    description:
      "聚焦單一重點部位的精準筋膜調理。忙碌現代人的快速保養首選，高效率釋放緊繃。",
    category: "fascia",
  },
  {
    id: "training-50",
    name: "一對一智能結構訓練",
    duration: 50,
    priceRegular: { "技師職人": 2500, "技術長": 2500 },
    priceMember: { "技師職人": 2500, "技術長": 2500 },
    description:
      "個人化結構矯正訓練課程，由技師帶領進行針對性的核心與姿勢訓練，鞏固筋膜調理成效。",
    category: "training",
  },
  {
    id: "addon-20",
    name: "加購延長 +20分",
    duration: 20,
    priceRegular: { "技師職人": 600, "技術長": 600 },
    priceMember: { "技師職人": 600, "技術長": 600 },
    description: "於主療程後加購20分鐘，針對特別需要加強的部位深度處理。",
    category: "addon",
    isAddon: true,
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
  const endHour = 20;
  const intervalMinutes = 10;

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
