export type BookingStatus = "待確認" | "已確認" | "已完成" | "已取消";
export type ExpenseCategory = "房租" | "水電" | "薪水費" | "耗材" | "其他";
export type EmploymentType = "承攬制" | "僱傭制";

export interface FixedExpenseTemplate {
  id: string;
  storeId: string; // "all" = 全館
  category: ExpenseCategory;
  name: string;
  amount: number;
}

export interface MonthlyExpense {
  id: string;
  month: string; // "2026-06"
  storeId: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  confirmed: boolean;
  isFixed: boolean; // 是否為固定費用自動帶入
  note?: string;
}
export type InternalLevel = "實習技師" | "準技師" | "初階老師" | "進階老師" | "資深老師" | "技術長";
export type DisplayLevel = "技師職人" | "技術長" | "準技師" | "實習技師";
export type MemberTier = "一般會員" | "黃金會員" | "白金會員";
export type PaymentMethod = "現金" | "電子支付" | "轉帳" | "信用卡" | "儲值金";

export interface AdminStore {
  id: string;
  name: string;
}

export interface AdminStaff {
  id: string;
  name: string;
  internalLevel: InternalLevel;
  displayLevel: DisplayLevel;
  storeId: string;
  employmentType: EmploymentType;
  baseSalary: number;          // 僱傭制底薪（承攬制填 0）
  commissionPerSession: number; // 每筆固定抽成金額
  positionAllowance: number;   // 每月職位加給（僱傭制才有）
  username: string;
  allowedServiceIds: string[]; // which service IDs this staff can perform
}

export interface AdminService {
  id: string;
  name: string;
  duration: number;
  // 技師職人定價
  priceRegular: number;
  priceMember: number;
  // 技術長定價
  priceSeniorRegular: number;
  priceSeniorMember: number;
  // 準技師定價
  priceJuniorRegular: number;
  priceJuniorMember: number;
  // 實習技師定價
  priceInternRegular: number;
  priceInternMember: number;
  // 特殊定價
  priceVendor: number;   // 特約廠商價
  priceFriend: number;   // 親友價
  enabled: boolean;
  onlineBookable: boolean; // 是否開放網路預約
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  memberTier: MemberTier;
  storedValue: number;
  isExisting: boolean;
  consentSigned: boolean;
  joinDate: string;
}

export interface AdminBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  staffId: string;
  staffName: string;
  storeId: string;
  storeName: string;
  date: string;
  time: string;
  price: number;
  status: BookingStatus;
  bufferMinutes: number;
  notes: string;
  paymentMethod: PaymentMethod;
}

// 固定費用範本（每月自動帶入，不含薪水 — 薪水由員工資料自動計算）
export const FIXED_EXPENSE_TEMPLATES: FixedExpenseTemplate[] = [
  { id: "FT01", storeId: "ST01", category: "房租", name: "小巨蛋店 房租", amount: 80000 },
  { id: "FT02", storeId: "ST02", category: "房租", name: "大安店 房租", amount: 65000 },
  { id: "FT03", storeId: "ST01", category: "水電", name: "小巨蛋店 水電費", amount: 8000 },
  { id: "FT04", storeId: "ST02", category: "水電", name: "大安店 水電費", amount: 6500 },
];

// 本月費用記錄（含固定 + 臨時，薪水費另計）
export const MONTHLY_EXPENSES: MonthlyExpense[] = [
  { id: "ME01", month: "2026-06", storeId: "ST01", category: "房租", name: "小巨蛋店 房租", amount: 80000, confirmed: false, isFixed: true },
  { id: "ME02", month: "2026-06", storeId: "ST02", category: "房租", name: "大安店 房租", amount: 65000, confirmed: false, isFixed: true },
  { id: "ME03", month: "2026-06", storeId: "ST01", category: "水電", name: "小巨蛋店 水電費", amount: 8000, confirmed: false, isFixed: true },
  { id: "ME04", month: "2026-06", storeId: "ST02", category: "水電", name: "大安店 水電費", amount: 6500, confirmed: false, isFixed: true },
  { id: "ME05", month: "2026-05", storeId: "ST01", category: "房租", name: "小巨蛋店 房租", amount: 80000, confirmed: true, isFixed: true },
  { id: "ME06", month: "2026-05", storeId: "ST02", category: "房租", name: "大安店 房租", amount: 65000, confirmed: true, isFixed: true },
  { id: "ME07", month: "2026-05", storeId: "ST01", category: "水電", name: "小巨蛋店 水電費", amount: 7800, confirmed: true, isFixed: true },
  { id: "ME08", month: "2026-05", storeId: "ST02", category: "水電", name: "大安店 水電費", amount: 6200, confirmed: true, isFixed: true },
  { id: "ME09", month: "2026-05", storeId: "ST01", category: "耗材", name: "精油補貨", amount: 4500, confirmed: true, isFixed: false },
];

export const ADMIN_STORES: AdminStore[] = [
  { id: "ST01", name: "小巨蛋店" },
  { id: "ST02", name: "大安店" },
];

export const ADMIN_STAFF: AdminStaff[] = [
  // 小巨蛋店
  { id: "S001", name: "宥彤老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST01", employmentType: "僱傭制", baseSalary: 45000, commissionPerSession: 1200, positionAllowance: 5000, username: "youtong", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  { id: "S002", name: "Jimbo老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 900, positionAllowance: 3000, username: "jimbo", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S003", name: "韓韓老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "hanhan", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S004", name: "朔源老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "shuoyuan", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S005", name: "大吉老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "daji", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S006", name: "Lily老師", internalLevel: "準技師", displayLevel: "準技師", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 500, positionAllowance: 0, username: "lily", allowedServiceIds: ["SV01","SV06"] },
  { id: "S007", name: "Jojo老師", internalLevel: "實習技師", displayLevel: "實習技師", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 300, positionAllowance: 0, username: "jojo", allowedServiceIds: ["SV01"] },
  { id: "S008", name: "R3老師", internalLevel: "實習技師", displayLevel: "實習技師", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 300, positionAllowance: 0, username: "r3", allowedServiceIds: ["SV01"] },
  { id: "S009", name: "宇辰老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST01", employmentType: "僱傭制", baseSalary: 0, commissionPerSession: 0, positionAllowance: 0, username: "manager", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  // 大安店
  { id: "S010", name: "阿鐵老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST02", employmentType: "僱傭制", baseSalary: 45000, commissionPerSession: 1200, positionAllowance: 5000, username: "atai", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  { id: "S011", name: "Miffy老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 900, positionAllowance: 3000, username: "miffy", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S012", name: "Cindy老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "cindy", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S013", name: "雯儀老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "wenyi", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
];

export const ADMIN_SERVICES: AdminService[] = [
  { id: "SV01", name: "基礎筋膜放鬆", duration: 60, priceRegular: 2500, priceMember: 2000, priceSeniorRegular: 3000, priceSeniorMember: 2500, priceJuniorRegular: 2000, priceJuniorMember: 1600, priceInternRegular: 1500, priceInternMember: 1200, priceVendor: 2000, priceFriend: 1500, enabled: true, onlineBookable: true },
  { id: "SV02", name: "精緻筋膜調理", duration: 90, priceRegular: 3200, priceMember: 2500, priceSeniorRegular: 3800, priceSeniorMember: 3200, priceJuniorRegular: 2500, priceJuniorMember: 2000, priceInternRegular: 2000, priceInternMember: 1600, priceVendor: 2800, priceFriend: 2200, enabled: true, onlineBookable: true },
  { id: "SV03", name: "頂級筋膜結構整合", duration: 120, priceRegular: 3800, priceMember: 3000, priceSeniorRegular: 4500, priceSeniorMember: 3800, priceJuniorRegular: 3000, priceJuniorMember: 2500, priceInternRegular: 2500, priceInternMember: 2000, priceVendor: 3500, priceFriend: 2800, enabled: true, onlineBookable: true },
  { id: "SV04", name: "一對一功能式訓練", duration: 50, priceRegular: 2500, priceMember: 2500, priceSeniorRegular: 2500, priceSeniorMember: 2500, priceJuniorRegular: 2500, priceJuniorMember: 2500, priceInternRegular: 2500, priceInternMember: 2500, priceVendor: 2500, priceFriend: 2500, enabled: true, onlineBookable: true },
  { id: "SV05", name: "頻率檢測", duration: 40, priceRegular: 2500, priceMember: 2500, priceSeniorRegular: 2500, priceSeniorMember: 2500, priceJuniorRegular: 2500, priceJuniorMember: 2500, priceInternRegular: 2500, priceInternMember: 2500, priceVendor: 2500, priceFriend: 2500, enabled: true, onlineBookable: false },
  { id: "SV06", name: "加購延長 +20分", duration: 20, priceRegular: 600, priceMember: 600, priceSeniorRegular: 600, priceSeniorMember: 600, priceJuniorRegular: 600, priceJuniorMember: 600, priceInternRegular: 600, priceInternMember: 600, priceVendor: 600, priceFriend: 600, enabled: true, onlineBookable: true },
];

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  { id: "C001", name: "李雅文", phone: "0912-345-678", email: "yawi@example.com", memberTier: "黃金會員", storedValue: 12000, isExisting: true, consentSigned: true, joinDate: "2024-03-15" },
  { id: "C002", name: "張志豪", phone: "0923-456-789", email: "zhihao@example.com", memberTier: "一般會員", storedValue: 3000, isExisting: false, consentSigned: true, joinDate: "2025-01-20" },
  { id: "C003", name: "林美華", phone: "0934-567-890", email: "meihua@example.com", memberTier: "白金會員", storedValue: 28000, isExisting: true, consentSigned: true, joinDate: "2023-08-10" },
  { id: "C004", name: "陳建宇", phone: "0945-678-901", email: "jianyu@example.com", memberTier: "一般會員", storedValue: 0, isExisting: false, consentSigned: false, joinDate: "2025-05-30" },
  { id: "C005", name: "王淑芬", phone: "0956-789-012", email: "shufen@example.com", memberTier: "黃金會員", storedValue: 8500, isExisting: true, consentSigned: true, joinDate: "2024-07-22" },
  { id: "C006", name: "劉宗翰", phone: "0967-890-123", email: "zonghan@example.com", memberTier: "一般會員", storedValue: 1500, isExisting: false, consentSigned: true, joinDate: "2025-04-12" },
  { id: "C007", name: "吳佳穎", phone: "0978-901-234", email: "jiaying@example.com", memberTier: "白金會員", storedValue: 45000, isExisting: true, consentSigned: true, joinDate: "2022-12-01" },
];

export const ADMIN_BOOKINGS: AdminBooking[] = [
  { id: "B001", customerId: "C001", customerName: "李雅文", customerPhone: "0912-345-678", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-13", time: "10:00", price: 2500, status: "已確認", bufferMinutes: 5, notes: "客戶肩頸較緊", paymentMethod: "儲值金" },
  { id: "B002", customerId: "C003", customerName: "林美華", customerPhone: "0934-567-890", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-13", time: "14:00", price: 3800, status: "已確認", bufferMinutes: 10, notes: "", paymentMethod: "信用卡" },
  { id: "B003", customerId: "C005", customerName: "王淑芬", customerPhone: "0956-789-012", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S003", staffName: "林志偉", storeId: "ST02", storeName: "大安店", date: "2026-06-13", time: "11:00", price: 4900, status: "待確認", bufferMinutes: 5, notes: "第一次來", paymentMethod: "現金" },
  { id: "B004", customerId: "C002", customerName: "張志豪", customerPhone: "0923-456-789", serviceId: "SV04", serviceName: "局部筋膜放鬆", duration: 50, staffId: "S004", staffName: "黃雅琪", storeId: "ST02", storeName: "大安店", date: "2026-06-14", time: "09:00", price: 1600, status: "待確認", bufferMinutes: 5, notes: "", paymentMethod: "電子支付" },
  { id: "B005", customerId: "C007", customerName: "吳佳穎", customerPhone: "0978-901-234", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-14", time: "16:00", price: 3800, status: "已確認", bufferMinutes: 15, notes: "VIP客戶", paymentMethod: "信用卡" },
  { id: "B006", customerId: "C006", customerName: "劉宗翰", customerPhone: "0967-890-123", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S005", staffName: "張建宏", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-12", time: "15:00", price: 2800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "現金" },
  { id: "B007", customerId: "C004", customerName: "陳建宇", customerPhone: "0945-678-901", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-11", time: "13:00", price: 2800, status: "已取消", bufferMinutes: 5, notes: "客戶臨時取消", paymentMethod: "現金" },
  { id: "B008", customerId: "C001", customerName: "李雅文", customerPhone: "0912-345-678", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S003", staffName: "林志偉", storeId: "ST02", storeName: "大安店", date: "2026-06-15", time: "10:00", price: 4900, status: "待確認", bufferMinutes: 5, notes: "", paymentMethod: "儲值金" },
  { id: "B009", customerId: "C003", customerName: "林美華", customerPhone: "0934-567-890", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S004", staffName: "黃雅琪", storeId: "ST02", storeName: "大安店", date: "2026-06-10", time: "11:00", price: 2500, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "電子支付" },
  { id: "B010", customerId: "C007", customerName: "吳佳穎", customerPhone: "0978-901-234", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-09", time: "14:00", price: 4900, status: "已完成", bufferMinutes: 10, notes: "VIP", paymentMethod: "轉帳" },
  { id: "B011", customerId: "C005", customerName: "王淑芬", customerPhone: "0956-789-012", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-08", time: "10:00", price: 3800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "儲值金" },
  { id: "B012", customerId: "C002", customerName: "張志豪", customerPhone: "0923-456-789", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S005", staffName: "張建宏", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-07", time: "14:00", price: 2800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "現金" },
];
