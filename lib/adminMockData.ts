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
export type DisplayLevel = "技師職人" | "技術長";
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
  // 特殊定價
  priceVendor: number;   // 特約廠商價
  priceFriend: number;   // 親友價
  enabled: boolean;
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
  { id: "S001", name: "王小明", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST01", employmentType: "僱傭制", baseSalary: 45000, commissionPerSession: 1200, positionAllowance: 5000, username: "manager" },
  { id: "S002", name: "陳美玲", internalLevel: "資深老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "僱傭制", baseSalary: 35000, commissionPerSession: 900, positionAllowance: 3000, username: "staff1" },
  { id: "S003", name: "林志偉", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "staff2" },
  { id: "S004", name: "黃雅琪", internalLevel: "初階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 700, positionAllowance: 0, username: "staff3" },
  { id: "S005", name: "張建宏", internalLevel: "準技師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 500, positionAllowance: 0, username: "staff4" },
];

export const ADMIN_SERVICES: AdminService[] = [
  { id: "SV01", name: "基礎筋膜調理", duration: 60, priceRegular: 2800, priceMember: 2500, priceSeniorRegular: 3200, priceSeniorMember: 2900, priceVendor: 2300, priceFriend: 2000, enabled: true },
  { id: "SV02", name: "深層筋膜結構療程", duration: 90, priceRegular: 4200, priceMember: 3800, priceSeniorRegular: 4800, priceSeniorMember: 4300, priceVendor: 3600, priceFriend: 3200, enabled: true },
  { id: "SV03", name: "全身筋膜舒壓", duration: 120, priceRegular: 5500, priceMember: 4900, priceSeniorRegular: 6200, priceSeniorMember: 5500, priceVendor: 4800, priceFriend: 4200, enabled: true },
  { id: "SV04", name: "局部筋膜放鬆", duration: 50, priceRegular: 1800, priceMember: 1600, priceSeniorRegular: 2200, priceSeniorMember: 1900, priceVendor: 1500, priceFriend: 1300, enabled: true },
  { id: "SV05", name: "頭頸肩筋膜調理", duration: 20, priceRegular: 1200, priceMember: 1000, priceSeniorRegular: 1400, priceSeniorMember: 1200, priceVendor: 1000, priceFriend: 800, enabled: false },
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
