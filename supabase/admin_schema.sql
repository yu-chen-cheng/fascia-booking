-- ============================================================
-- FASCIA 法夏 後台系統 - 資料庫擴充 Schema
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================================

-- 1. 分店
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lat FLOAT,
  lng FLOAT,
  checkin_radius_meters INT DEFAULT 100
);

INSERT INTO branches (id, name, address, lat, lng) VALUES
  ('ST01', '小巨蛋店', '台北市松山區南京東路四段133巷4弄15號1樓', 25.0507, 121.5569),
  ('ST02', '大安店',   '台北市大安區信義路四段30巷7弄1號1樓',    25.0297, 121.5479),
  ('ST03', '板橋店',   '新北市板橋區仁化街27號1樓',              25.0115, 121.4609)
ON CONFLICT (id) DO NOTHING;

-- 2. 員工資料（含登入密碼，後台自行管理）
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'fascia2024',  -- 管理者新增時設定，員工首次登入後可更改
  name TEXT NOT NULL,
  branch_id TEXT REFERENCES branches(id),
  role TEXT NOT NULL DEFAULT '員工' CHECK (role IN ('管理者', '店長', '員工')),
  level TEXT NOT NULL DEFAULT '初階職人' CHECK (level IN ('準師', '初階職人', '進階職人', '資深職人', '明星職人')),
  employment_type TEXT NOT NULL DEFAULT '承攬制' CHECK (employment_type IN ('承攬制', '僱傭制')),
  base_salary INT DEFAULT 0,
  position_allowance INT DEFAULT 0,
  session_threshold INT DEFAULT 40,  -- 僱傭制：滿幾人次後開始計抽成
  is_active BOOLEAN DEFAULT true,
  hired_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入管理者帳號（你的帳號）
INSERT INTO staff_profiles (email, password, name, role, level, employment_type)
VALUES ('xtey176@gmail.com', 'fascia2024', '鄭宇辰', '管理者', '明星職人', '承攬制')
ON CONFLICT (email) DO NOTHING;

-- 3. 抽成費率表
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('承攬制', '僱傭制')),
  level TEXT NOT NULL,
  service_key TEXT NOT NULL,  -- '50min','60min','90min','120min','40min','plus15min','product'
  amount INT NOT NULL,
  UNIQUE(employment_type, level, service_key)
);

-- 承攬制費率
INSERT INTO commission_rates (employment_type, level, service_key, amount) VALUES
  -- 準師
  ('承攬制','準師','50min',600), ('承攬制','準師','60min',650),
  ('承攬制','準師','90min',800), ('承攬制','準師','120min',950),
  ('承攬制','準師','40min',500), ('承攬制','準師','plus15min',200),
  ('承攬制','準師','product',100),
  -- 初階職人（同準師）
  ('承攬制','初階職人','50min',600), ('承攬制','初階職人','60min',650),
  ('承攬制','初階職人','90min',800), ('承攬制','初階職人','120min',950),
  ('承攬制','初階職人','40min',500), ('承攬制','初階職人','plus15min',200),
  ('承攬制','初階職人','product',100),
  -- 進階職人
  ('承攬制','進階職人','50min',700), ('承攬制','進階職人','60min',750),
  ('承攬制','進階職人','90min',950), ('承攬制','進階職人','120min',1100),
  ('承攬制','進階職人','40min',500), ('承攬制','進階職人','plus15min',200),
  ('承攬制','進階職人','product',100),
  -- 資深職人
  ('承攬制','資深職人','50min',800), ('承攬制','資深職人','60min',850),
  ('承攬制','資深職人','90min',1100), ('承攬制','資深職人','120min',1300),
  ('承攬制','資深職人','40min',500), ('承攬制','資深職人','plus15min',200),
  ('承攬制','資深職人','product',100),
  -- 明星職人
  ('承攬制','明星職人','50min',900), ('承攬制','明星職人','60min',1100),
  ('承攬制','明星職人','90min',1400), ('承攬制','明星職人','120min',1700),
  ('承攬制','明星職人','40min',500), ('承攬制','明星職人','plus15min',250),
  ('承攬制','明星職人','product',100)
ON CONFLICT (employment_type, level, service_key) DO NOTHING;

-- 僱傭制費率（滿40人次後每筆服務的獎金）
INSERT INTO commission_rates (employment_type, level, service_key, amount) VALUES
  ('僱傭制','準師','60min',200), ('僱傭制','準師','plus15min',50), ('僱傭制','準師','product',100),
  ('僱傭制','初階職人','60min',200), ('僱傭制','初階職人','plus15min',50), ('僱傭制','初階職人','product',100),
  ('僱傭制','進階職人','60min',300), ('僱傭制','進階職人','plus15min',75), ('僱傭制','進階職人','product',100),
  ('僱傭制','資深職人','60min',400), ('僱傭制','資深職人','plus15min',100), ('僱傭制','資深職人','product',100),
  ('僱傭制','明星職人','60min',500), ('僱傭制','明星職人','plus15min',120), ('僱傭制','明星職人','product',100)
ON CONFLICT (employment_type, level, service_key) DO NOTHING;

-- 4. 排班
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
  date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('早班','晚班','全班','病假','事假','進修','自訂')),
  start_time TIME,
  end_time TIME,
  custom_label TEXT,
  blocks_booking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 打卡紀錄
CREATE TABLE IF NOT EXISTS clock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id),
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  standard_hours FLOAT DEFAULT 8.0,
  overtime_hours FLOAT DEFAULT 0,
  overtime_pay INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- 6. 單次結帳單（每位客人）
CREATE TABLE IF NOT EXISTS service_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,  -- 對應 bookings.id（選填）
  staff_id UUID REFERENCES staff_profiles(id),
  branch_id TEXT REFERENCES branches(id),
  customer_id UUID,  -- 對應 customers.id
  customer_name TEXT,
  service_key TEXT,
  service_name TEXT,
  service_duration INT,
  total_amount INT NOT NULL DEFAULT 0,
  -- 付款方式拆分
  cash INT DEFAULT 0,
  stored_value INT DEFAULT 0,
  e_payment INT DEFAULT 0,
  credit_card INT DEFAULT 0,
  bank_transfer INT DEFAULT 0,
  voucher INT DEFAULT 0,         -- 墨攻券
  partner INT DEFAULT 0,         -- 特約廠商
  sponsored INT DEFAULT 0,       -- 贊助
  -- 加購
  addon_plus15min BOOLEAN DEFAULT false,
  addon_products JSONB DEFAULT '[]',  -- [{name, price}]
  -- 抽成（自動計算）
  staff_commission INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 每日結帳（打烊班上傳）
CREATE TABLE IF NOT EXISTS daily_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT REFERENCES branches(id),
  date DATE NOT NULL,
  submitted_by UUID REFERENCES staff_profiles(id),
  -- 今日現金結算
  cash_amount INT DEFAULT 0,           -- 今日現金收款
  petty_cash INT DEFAULT 3000,         -- 零用金
  reserve_cash INT DEFAULT 3000,       -- 備用金
  laundry_fee INT DEFAULT 0,           -- 洗衣費（手動輸入日期）
  laundry_date DATE,
  miscellaneous INT DEFAULT 0,         -- 雜資（耗材）
  miscellaneous_note TEXT,
  -- 系統回推（自動計算）
  total_cash_received INT DEFAULT 0,
  total_stored_value INT DEFAULT 0,
  total_e_payment INT DEFAULT 0,
  total_credit_card INT DEFAULT 0,
  total_transfer INT DEFAULT 0,
  total_voucher INT DEFAULT 0,
  total_partner INT DEFAULT 0,
  total_sponsored INT DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id, date)
);

-- 8. 庫存
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,  -- 對應 products.id
  product_name TEXT NOT NULL,
  branch_id TEXT REFERENCES branches(id),
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, branch_id)
);

-- 9. 調撥申請
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  product_name TEXT,
  from_branch_id TEXT REFERENCES branches(id),
  to_branch_id TEXT REFERENCES branches(id),
  quantity INT NOT NULL,
  requested_by UUID REFERENCES staff_profiles(id),
  confirmed_by UUID REFERENCES staff_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- 10. Web Push 訂閱（技師接收預約通知）
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS 設定（開放 anon key 存取，由應用層控管角色）
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_branches"            ON branches            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_staff_profiles"      ON staff_profiles      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_commission_rates"    ON commission_rates    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_schedules"           ON schedules           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_clock_records"       ON clock_records       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_service_checkouts"   ON service_checkouts   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_daily_checkouts"     ON daily_checkouts     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_inventory"           ON inventory           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_inventory_transfers" ON inventory_transfers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_push_subscriptions"  ON push_subscriptions  FOR ALL TO anon USING (true) WITH CHECK (true);
