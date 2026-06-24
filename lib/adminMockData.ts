export type BookingStatus = "待確認" | "已確認" | "已完成" | "已取消" | "爽約";
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
export type MemberTier = "一般會員" | "銅會員" | "白金會員" | "黃金會員";
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
  birthday?: string;          // "YYYY-MM-DD"
  totalSpent: number;         // 累計消費
  bodyNotes: string;          // 身體狀況備註（技師用）
  preferredStaffName?: string; // 慣用技師
  vouchers: string[];         // 折價券
  hasLine: boolean;           // 是否綁定 LINE 帳號
}

export interface StoredValueRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  tier: "基本" | "法夏會員" | "黃金會員" | "白金會員";
  gift: string;
  giftExpiry: string;
  giftClaimed: boolean;
  giftExpired: boolean;
}

export const STORED_VALUE_TIERS = [
  { amount: 15000, label: "銅會員", gift: "享儲值會員優惠價", color: "bg-[#b87333]", desc: "全品項9.5折優惠" },
  { amount: 30000, label: "白金會員", gift: "結構訓練一堂", color: "bg-slate-400", desc: "贈品效期90天" },
  { amount: 50000, label: "黃金會員", gift: "頻率檢測一堂 + 結構訓練一堂", color: "bg-amber-500", desc: "贈品效期90天" },
];

export const STORED_VALUE_RECORDS: StoredValueRecord[] = [
  { id: "SV001", customerId: "C001", customerName: "李雅文", date: "2026-04-01", amount: 15000, tier: "法夏會員", gift: "結構訓練體驗一堂", giftExpiry: "2026-06-30", giftClaimed: false, giftExpired: false },
  { id: "SV002", customerId: "C003", customerName: "林美華", date: "2025-12-15", amount: 30000, tier: "黃金會員", gift: "結構訓練一堂 + 頻率檢測", giftExpiry: "2026-03-15", giftClaimed: true, giftExpired: false },
  { id: "SV003", customerId: "C007", customerName: "吳佳穎", date: "2025-09-01", amount: 50000, tier: "白金會員", gift: "頻率檢測 + 結構訓練三堂", giftExpiry: "2025-11-30", giftClaimed: false, giftExpired: true },
];

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
  lineNotified?: boolean; // 是否已發送 LINE 24小時前提醒
}

// ─── Products ──────────────────────────────────────────────────────────────
export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  priceRetail: number;   // 定價
  priceCost: number;     // 成本
  commissionStaff: number; // 員工每售出一件的抽成
  enabled: boolean;
}

export interface ProductSale {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  storeId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  qty: number;
  totalPrice: number;
  commission: number;
  paymentMethod: PaymentMethod;
}

export const ADMIN_PRODUCTS: AdminProduct[] = [
  { id: "P001", name: "筋膜放鬆滾筒", category: "工具", priceRetail: 1200, priceCost: 400, commissionStaff: 150, enabled: true },
  { id: "P002", name: "法夏精油按摩膏", category: "保養品", priceRetail: 980, priceCost: 280, commissionStaff: 120, enabled: true },
  { id: "P003", name: "SISSEL® 坐姿平衡墊", category: "工具", priceRetail: 1800, priceCost: 650, commissionStaff: 200, enabled: true },
  { id: "P004", name: "筋膜球組合", category: "工具", priceRetail: 680, priceCost: 180, commissionStaff: 80, enabled: true },
  { id: "P005", name: "法夏修護精華液", category: "保養品", priceRetail: 1500, priceCost: 420, commissionStaff: 180, enabled: true },
];

export const PRODUCT_SALES: ProductSale[] = [
  { id: "PS001", date: "2026-06-10", staffId: "S001", staffName: "王小明", storeId: "ST01", customerId: "C001", customerName: "李雅文", productId: "P001", productName: "筋膜放鬆滾筒", qty: 1, totalPrice: 1200, commission: 150, paymentMethod: "現金" },
  { id: "PS002", date: "2026-06-11", staffId: "S002", staffName: "陳美玲", storeId: "ST01", customerId: "C003", customerName: "林美華", productId: "P002", productName: "法夏精油按摩膏", qty: 2, totalPrice: 1960, commission: 240, paymentMethod: "電子支付" },
  { id: "PS003", date: "2026-06-12", staffId: "S003", staffName: "林志偉", storeId: "ST02", customerId: "C005", customerName: "王淑芬", productId: "P003", productName: "SISSEL® 坐姿平衡墊", qty: 1, totalPrice: 1800, commission: 200, paymentMethod: "信用卡" },
  { id: "PS004", date: "2026-06-13", staffId: "S001", staffName: "王小明", storeId: "ST01", customerId: "C007", customerName: "吳佳穎", productId: "P005", productName: "法夏修護精華液", qty: 1, totalPrice: 1500, commission: 180, paymentMethod: "儲值金" },
  { id: "PS005", date: "2026-06-13", staffId: "S004", staffName: "黃雅琪", storeId: "ST02", customerId: "C002", customerName: "張志豪", productId: "P004", productName: "筋膜球組合", qty: 1, totalPrice: 680, commission: 80, paymentMethod: "現金" },
];

// ─── Inventory ─────────────────────────────────────────────────────────────
export type ProductBrand = "法夏嚴選" | "Sissel" | "黃金甲";

export interface InventoryProduct {
  id: string;
  name: string;
  brand: ProductBrand;
  price: number;           // 售價
  cost: number;            // 成本（選填，管理者才能看）
  stockST01: number;       // 小巨蛋店庫存
  stockST02: number;       // 大安店庫存
  lowStockThreshold: number; // 低庫存警戒數量
  unit: string;            // 單位，e.g. "個", "瓶", "包"
  enabled: boolean;        // 是否上架銷售
}

export const INVENTORY_PRODUCTS: InventoryProduct[] = [
  // 法夏嚴選（13項）
  { id: "F001", name: "Fascia四寶（含工具包）", brand: "法夏嚴選", price: 3800, cost: 1200, stockST01: 5, stockST02: 3, lowStockThreshold: 3, unit: "組", enabled: true },
  { id: "F002", name: "結締筆", brand: "法夏嚴選", price: 950, cost: 280, stockST01: 12, stockST02: 8, lowStockThreshold: 5, unit: "支", enabled: true },
  { id: "F003", name: "鳥嘴筋膜刀", brand: "法夏嚴選", price: 1650, cost: 500, stockST01: 7, stockST02: 4, lowStockThreshold: 3, unit: "把", enabled: true },
  { id: "F004", name: "消波塊", brand: "法夏嚴選", price: 1000, cost: 300, stockST01: 2, stockST02: 1, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "F005", name: "筋膜球（大）", brand: "法夏嚴選", price: 720, cost: 180, stockST01: 15, stockST02: 10, lowStockThreshold: 5, unit: "顆", enabled: true },
  { id: "F006", name: "筋膜球（中）", brand: "法夏嚴選", price: 650, cost: 150, stockST01: 18, stockST02: 12, lowStockThreshold: 5, unit: "顆", enabled: true },
  { id: "F007", name: "筋膜球（小）", brand: "法夏嚴選", price: 580, cost: 130, stockST01: 14, stockST02: 9, lowStockThreshold: 5, unit: "顆", enabled: true },
  { id: "F008", name: "筋膜圓錐", brand: "法夏嚴選", price: 400, cost: 100, stockST01: 10, stockST02: 7, lowStockThreshold: 4, unit: "個", enabled: true },
  { id: "F009", name: "筋膜錐", brand: "法夏嚴選", price: 450, cost: 110, stockST01: 9, stockST02: 6, lowStockThreshold: 4, unit: "個", enabled: true },
  { id: "F010", name: "筋膜頸椎", brand: "法夏嚴選", price: 350, cost: 90, stockST01: 8, stockST02: 5, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "F011", name: "軟木足底滾筒", brand: "法夏嚴選", price: 880, cost: 260, stockST01: 6, stockST02: 3, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "F012", name: "軟式罐杯", brand: "法夏嚴選", price: 200, cost: 50, stockST01: 20, stockST02: 15, lowStockThreshold: 5, unit: "個", enabled: true },
  { id: "F013", name: "工具包（單買）", brand: "法夏嚴選", price: 1500, cost: 400, stockST01: 4, stockST02: 2, lowStockThreshold: 3, unit: "個", enabled: true },
  // Sissel（16項）
  { id: "S001", name: "Sitfit 坐姿矯正墊（經典款 36cm）", brand: "Sissel", price: 1980, cost: 700, stockST01: 6, stockST02: 4, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "S002", name: "Sitfit-plus 坐姿矯正墊（進階款 37cm）", brand: "Sissel", price: 2380, cost: 850, stockST01: 3, stockST02: 2, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "S003", name: "Sitpro Offichef 坐姿矯正椅（辦公款）", brand: "Sissel", price: 7980, cost: 3000, stockST01: 2, stockST02: 1, lowStockThreshold: 2, unit: "台", enabled: true },
  { id: "S004", name: "Sitpro Zener 坐姿矯正椅（經典款）", brand: "Sissel", price: 5980, cost: 2200, stockST01: 1, stockST02: 1, lowStockThreshold: 2, unit: "台", enabled: true },
  { id: "S005", name: "Sitpro Butterfly 坐姿矯正椅（學生款）", brand: "Sissel", price: 9800, cost: 3800, stockST01: 1, stockST02: 0, lowStockThreshold: 1, unit: "台", enabled: true },
  { id: "S006", name: "Soft-plus 舒柔進階款矯形枕", brand: "Sissel", price: 4980, cost: 1800, stockST01: 4, stockST02: 2, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S007", name: "Deluxe 舒柔豪華款枕頭", brand: "Sissel", price: 5480, cost: 2000, stockST01: 3, stockST02: 1, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S008", name: "Myofascia 筋膜球（大單球 12cm）", brand: "Sissel", price: 880, cost: 300, stockST01: 8, stockST02: 5, lowStockThreshold: 3, unit: "顆", enabled: true },
  { id: "S009", name: "Myofascia 筋膜球（小單球 8cm）", brand: "Sissel", price: 580, cost: 200, stockST01: 10, stockST02: 7, lowStockThreshold: 4, unit: "顆", enabled: true },
  { id: "S010", name: "Myofascia 大花生雙球", brand: "Sissel", price: 1280, cost: 450, stockST01: 5, stockST02: 3, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "S011", name: "Myofascia 小花生雙球", brand: "Sissel", price: 980, cost: 350, stockST01: 6, stockST02: 4, lowStockThreshold: 3, unit: "個", enabled: true },
  { id: "S012", name: "Myofascia 筋絡按摩健身滾輪", brand: "Sissel", price: 1680, cost: 600, stockST01: 4, stockST02: 2, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S013", name: "SPINEFITTER 脊給力健身按摩器", brand: "Sissel", price: 4880, cost: 1800, stockST01: 2, stockST02: 1, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S014", name: "Balancefit Pad 專業平衡訓練墊", brand: "Sissel", price: 2880, cost: 1000, stockST01: 3, stockST02: 2, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S015", name: "Pilates Roller Pro 普拉提專業滾輪", brand: "Sissel", price: 1980, cost: 700, stockST01: 4, stockST02: 2, lowStockThreshold: 2, unit: "個", enabled: true },
  { id: "S016", name: "Fitband Essential 加寬超長彈力帶", brand: "Sissel", price: 350, cost: 100, stockST01: 12, stockST02: 8, lowStockThreshold: 5, unit: "條", enabled: true },
  // 黃金甲（5項）
  { id: "G001", name: "GABA睿智膏", brand: "黃金甲", price: 1680, cost: 550, stockST01: 8, stockST02: 5, lowStockThreshold: 5, unit: "盒", enabled: true },
  { id: "G002", name: "冰晶膠原凍", brand: "黃金甲", price: 2180, cost: 700, stockST01: 6, stockST02: 4, lowStockThreshold: 4, unit: "盒", enabled: true },
  { id: "G003", name: "白藜蘆醇飲", brand: "黃金甲", price: 2180, cost: 720, stockST01: 5, stockST02: 3, lowStockThreshold: 3, unit: "盒", enabled: true },
  { id: "G004", name: "葉黃素果凍", brand: "黃金甲", price: 1380, cost: 450, stockST01: 10, stockST02: 7, lowStockThreshold: 5, unit: "盒", enabled: true },
  { id: "G005", name: "維生素果凍", brand: "黃金甲", price: 990, cost: 320, stockST01: 9, stockST02: 6, lowStockThreshold: 4, unit: "盒", enabled: true },
];

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
  { id: "ST03", name: "板橋店" },
];

// ─── Commission table ─────────────────────────────────────────────────────
// Commission amount per session for each internal level × service combination
// serviceId → InternalLevel → commission amount (NTD)
export type CommissionTable = Record<string, Record<InternalLevel, number>>;

export const DEFAULT_COMMISSION_TABLE: CommissionTable = {
  "SV01": { "實習技師": 250, "準技師": 350, "初階老師": 450, "進階老師": 550, "資深老師": 650, "技術長": 800 },
  "SV02": { "實習技師": 320, "準技師": 450, "初階老師": 580, "進階老師": 700, "資深老師": 830, "技術長": 1020 },
  "SV03": { "實習技師": 380, "準技師": 540, "初階老師": 680, "進階老師": 820, "資深老師": 960, "技術長": 1200 },
  "SV04": { "實習技師": 250, "準技師": 350, "初階老師": 450, "進階老師": 550, "資深老師": 650, "技術長": 800 },
  "SV05": { "實習技師": 250, "準技師": 350, "初階老師": 450, "進階老師": 550, "資深老師": 650, "技術長": 800 },
  "SV06": { "實習技師": 60,  "準技師": 80,  "初階老師": 100, "進階老師": 120, "資深老師": 140, "技術長": 180 },
};

export const ADMIN_STAFF: AdminStaff[] = [
  // 小巨蛋店
  { id: "S001", name: "宥彤老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST01", employmentType: "僱傭制", baseSalary: 45000, commissionPerSession: 1200, positionAllowance: 5000, username: "youtong", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  { id: "S002", name: "Jimbo老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 900, positionAllowance: 3000, username: "jimbo", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S003", name: "韓韓老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "hanhan", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S004", name: "溯源老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST03", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "shuoyuan", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S005", name: "大吉老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "daji", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S006", name: "Lily老師", internalLevel: "準技師", displayLevel: "準技師", storeId: "ST03", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 500, positionAllowance: 0, username: "lily", allowedServiceIds: ["SV01","SV06"] },
  { id: "S007", name: "Jojo老師", internalLevel: "實習技師", displayLevel: "實習技師", storeId: "ST01", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 300, positionAllowance: 0, username: "jojo", allowedServiceIds: ["SV01"] },
  { id: "S008", name: "R3老師", internalLevel: "實習技師", displayLevel: "實習技師", storeId: "ST03", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 300, positionAllowance: 0, username: "r3", allowedServiceIds: ["SV01"] },
  { id: "S009", name: "宇辰老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST01", employmentType: "僱傭制", baseSalary: 0, commissionPerSession: 0, positionAllowance: 0, username: "manager", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  // 大安店
  { id: "S010", name: "阿鐵老師", internalLevel: "技術長", displayLevel: "技術長", storeId: "ST02", employmentType: "僱傭制", baseSalary: 45000, commissionPerSession: 1200, positionAllowance: 5000, username: "atai", allowedServiceIds: ["SV01","SV02","SV03","SV04","SV05","SV06"] },
  { id: "S011", name: "Miffy老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 900, positionAllowance: 3000, username: "miffy", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S012", name: "Cindy老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "cindy", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  { id: "S013", name: "雯儀老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST02", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "wenyi", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
  // 板橋店
  { id: "S014", name: "Cindy老師", internalLevel: "進階老師", displayLevel: "技師職人", storeId: "ST03", employmentType: "承攬制", baseSalary: 0, commissionPerSession: 800, positionAllowance: 0, username: "cindy_bq", allowedServiceIds: ["SV01","SV02","SV03","SV06"] },
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
  { id: "C001", name: "李雅文", phone: "0912-345-678", email: "yawi@example.com", memberTier: "銅會員", storedValue: 12000, isExisting: true, consentSigned: true, joinDate: "2024-03-15", birthday: "1985-03-12", totalSpent: 18500, bodyNotes: "長期腰痠、左肩沾黏，對深壓敏感，需放輕力道", preferredStaffName: "宥彤", vouchers: ["首次儲值優惠券 $500"], hasLine: true },
  { id: "C002", name: "張志豪", phone: "0923-456-789", email: "zhihao@example.com", memberTier: "一般會員", storedValue: 3000, isExisting: false, consentSigned: true, joinDate: "2025-01-20", birthday: "1992-11-05", totalSpent: 4200, bodyNotes: "", preferredStaffName: undefined, vouchers: [], hasLine: false },
  { id: "C003", name: "林美華", phone: "0934-567-890", email: "meihua@example.com", memberTier: "黃金會員", storedValue: 28000, isExisting: true, consentSigned: true, joinDate: "2023-08-10", birthday: "1978-07-22", totalSpent: 56000, bodyNotes: "有脊椎側彎史，頸部曾受傷，請技師調理前確認", preferredStaffName: "Jimbo", vouchers: [], hasLine: true },
  { id: "C004", name: "陳建宇", phone: "0945-678-901", email: "jianyu@example.com", memberTier: "一般會員", storedValue: 0, isExisting: false, consentSigned: false, joinDate: "2025-05-30", birthday: "1998-02-14", totalSpent: 0, bodyNotes: "", preferredStaffName: undefined, vouchers: [], hasLine: false },
  { id: "C005", name: "王淑芬", phone: "0956-789-012", email: "shufen@example.com", memberTier: "銅會員", storedValue: 8500, isExisting: true, consentSigned: true, joinDate: "2024-07-22", birthday: "1983-09-30", totalSpent: 22000, bodyNotes: "足底筋膜炎，右腳踝舊傷，不適合強力踩壓", preferredStaffName: "韓韓", vouchers: [], hasLine: true },
  { id: "C006", name: "劉宗翰", phone: "0967-890-123", email: "zonghan@example.com", memberTier: "一般會員", storedValue: 1500, isExisting: false, consentSigned: true, joinDate: "2025-04-12", birthday: "1990-06-08", totalSpent: 5600, bodyNotes: "", preferredStaffName: undefined, vouchers: [], hasLine: false },
  { id: "C007", name: "吳佳穎", phone: "0978-901-234", email: "jiaying@example.com", memberTier: "黃金會員", storedValue: 45000, isExisting: true, consentSigned: true, joinDate: "2022-12-01", birthday: "1975-12-25", totalSpent: 89000, bodyNotes: "高血壓，請避免頭部倒置動作；偏好深層手法", preferredStaffName: "宥彤", vouchers: ["VIP專屬券 $1,000", "生日優惠券 $300"], hasLine: true },
];

export interface StaffEvent {
  id: string;
  staffId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  title: string; // e.g. "外出", "休假", "會議", "培訓"
  note?: string;
}

export const STAFF_EVENTS: StaffEvent[] = [
  { id: "EV001", staffId: "S002", date: "2026-06-18", startTime: "14:00", endTime: "16:00", title: "外出培訓" },
  { id: "EV002", staffId: "S003", date: "2026-06-18", startTime: "11:00", endTime: "13:00", title: "休假" },
];

export const ADMIN_BOOKINGS: AdminBooking[] = [
  { id: "B001", customerId: "C001", customerName: "李雅文", customerPhone: "0912-345-678", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-13", time: "10:00", price: 2500, status: "已確認", bufferMinutes: 5, notes: "客戶肩頸較緊", paymentMethod: "儲值金", lineNotified: true },
  { id: "B002", customerId: "C003", customerName: "林美華", customerPhone: "0934-567-890", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-13", time: "14:00", price: 3800, status: "已確認", bufferMinutes: 10, notes: "", paymentMethod: "信用卡", lineNotified: true },
  { id: "B003", customerId: "C005", customerName: "王淑芬", customerPhone: "0956-789-012", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S003", staffName: "林志偉", storeId: "ST02", storeName: "大安店", date: "2026-06-13", time: "11:00", price: 4900, status: "待確認", bufferMinutes: 5, notes: "第一次來", paymentMethod: "現金", lineNotified: false },
  { id: "B004", customerId: "C002", customerName: "張志豪", customerPhone: "0923-456-789", serviceId: "SV04", serviceName: "局部筋膜放鬆", duration: 50, staffId: "S004", staffName: "黃雅琪", storeId: "ST02", storeName: "大安店", date: "2026-06-14", time: "09:00", price: 1600, status: "待確認", bufferMinutes: 5, notes: "", paymentMethod: "電子支付" },
  { id: "B005", customerId: "C007", customerName: "吳佳穎", customerPhone: "0978-901-234", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-14", time: "16:00", price: 3800, status: "已確認", bufferMinutes: 15, notes: "VIP客戶", paymentMethod: "信用卡", lineNotified: true },
  { id: "B006", customerId: "C006", customerName: "劉宗翰", customerPhone: "0967-890-123", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S005", staffName: "張建宏", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-12", time: "15:00", price: 2800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "現金" },
  { id: "B007", customerId: "C004", customerName: "陳建宇", customerPhone: "0945-678-901", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-11", time: "13:00", price: 2800, status: "已取消", bufferMinutes: 5, notes: "客戶臨時取消", paymentMethod: "現金" },
  { id: "B008", customerId: "C001", customerName: "李雅文", customerPhone: "0912-345-678", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S003", staffName: "林志偉", storeId: "ST02", storeName: "大安店", date: "2026-06-15", time: "10:00", price: 4900, status: "待確認", bufferMinutes: 5, notes: "", paymentMethod: "儲值金" },
  { id: "B009", customerId: "C003", customerName: "林美華", customerPhone: "0934-567-890", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S004", staffName: "黃雅琪", storeId: "ST02", storeName: "大安店", date: "2026-06-10", time: "11:00", price: 2500, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "電子支付" },
  { id: "B010", customerId: "C007", customerName: "吳佳穎", customerPhone: "0978-901-234", serviceId: "SV03", serviceName: "全身筋膜舒壓", duration: 120, staffId: "S001", staffName: "王小明", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-09", time: "14:00", price: 4900, status: "已完成", bufferMinutes: 10, notes: "VIP", paymentMethod: "轉帳" },
  { id: "B011", customerId: "C005", customerName: "王淑芬", customerPhone: "0956-789-012", serviceId: "SV02", serviceName: "深層筋膜結構療程", duration: 90, staffId: "S002", staffName: "陳美玲", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-08", time: "10:00", price: 3800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "儲值金" },
  { id: "B012", customerId: "C002", customerName: "張志豪", customerPhone: "0923-456-789", serviceId: "SV01", serviceName: "基礎筋膜調理", duration: 60, staffId: "S005", staffName: "張建宏", storeId: "ST01", storeName: "小巨蛋店", date: "2026-06-07", time: "14:00", price: 2800, status: "已完成", bufferMinutes: 5, notes: "", paymentMethod: "現金" },
];
