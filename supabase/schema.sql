-- ============================================================
-- FASCIA 法夏 筋膜預訂系統 · Supabase 資料庫 Schema
-- 請在 Supabase → SQL Editor 貼上此檔全文執行
-- ============================================================

-- ── 1. 客戶資料 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id     TEXT UNIQUE,                          -- LINE userId
  name             TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  birthday         TEXT,
  membership_level TEXT NOT NULL DEFAULT 'general'
                   CHECK (membership_level IN ('general','bronze','platinum','gold')),
  stored_value     INTEGER NOT NULL DEFAULT 0,           -- 儲值餘額（元）
  total_spent      INTEGER NOT NULL DEFAULT 0,           -- 累積消費（元）
  consent_signed   BOOLEAN NOT NULL DEFAULT FALSE,
  is_foreign       BOOLEAN NOT NULL DEFAULT FALSE,       -- 外國客人（無LINE）
  notes            TEXT,                                 -- 後台備註
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. 預約紀錄 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  store_id        TEXT NOT NULL,                         -- 'xiaoJudan' | 'daan'
  service_id      TEXT NOT NULL,                         -- 'basic-60' | 'refined-90' etc.
  staff_id        TEXT NOT NULL,                         -- teacher id
  date            DATE NOT NULL,
  time_slot       TEXT NOT NULL,                         -- '10:00'
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed','cancelled','completed')),
  symptoms        TEXT[],                                -- ['頭肩頸','下背酸痛']
  addon_id        TEXT,                                  -- 加購延長 service id
  notes           TEXT,
  total_price     INTEGER NOT NULL DEFAULT 0,
  is_manual       BOOLEAN NOT NULL DEFAULT FALSE,        -- 後台手動建立
  review_sent     BOOLEAN NOT NULL DEFAULT FALSE,        -- 評價通知是否已發送
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 票券夾 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
               CHECK (type IN ('discount_200','structure_training','frequency_check')),
  amount       INTEGER NOT NULL DEFAULT 0,               -- 折抵金額
  description  TEXT,                                     -- 票券說明
  source       TEXT,                                     -- 'google_review' | 'topup_15k' | 'topup_30k'
  expire_at    TIMESTAMPTZ,
  used_at      TIMESTAMPTZ,
  used_booking_id UUID REFERENCES bookings(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. 儲值紀錄 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topup_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL,                      -- 儲值金額
  payment_method  TEXT NOT NULL
                  CHECK (payment_method IN ('transfer','credit_card')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','rejected')),
  transfer_ref    TEXT,                                  -- 匯款帳號後5碼
  bonus_vouchers  JSONB,                                 -- 贈送的票券清單
  confirmed_at    TIMESTAMPTZ,
  confirmed_by    TEXT,                                  -- 後台操作人員
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. 評價紀錄 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL UNIQUE REFERENCES bookings(id),
  customer_id      UUID NOT NULL REFERENCES customers(id),
  pain_score       INTEGER CHECK (pain_score BETWEEN 0 AND 10),  -- 酸痛解決程度
  satisfaction     INTEGER CHECK (satisfaction BETWEEN 1 AND 5), -- 整體滿意度
  symptoms_treated TEXT[],                               -- 當次處理的症狀
  google_reviewed  BOOLEAN DEFAULT FALSE,                -- 是否點擊 Google 評價
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. 產品推薦點擊紀錄 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  booking_id   UUID REFERENCES bookings(id),
  product_id   TEXT NOT NULL,                            -- 'F001' | 'S002' etc.
  product_name TEXT NOT NULL,
  symptoms     TEXT[],                                   -- 推薦原因（症狀）
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 自動更新 updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 自動升級會員等級 ────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_upgrade_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_spent >= 50000 THEN
    NEW.membership_level = 'gold';
  ELSIF NEW.total_spent >= 30000 THEN
    NEW.membership_level = 'platinum';
  ELSIF NEW.stored_value >= 15000 OR NEW.total_spent >= 15000 THEN
    NEW.membership_level = 'bronze';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER membership_auto_upgrade
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION auto_upgrade_membership();

-- ── Row Level Security ─────────────────────────────────────
-- 讓前台（anon 金鑰）可以讀寫自己的資料

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;

-- customers: anon 可 upsert/select（依 line_user_id）
CREATE POLICY "anon can upsert customers" ON customers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- bookings: anon 可 insert/select
CREATE POLICY "anon can manage bookings" ON bookings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- vouchers: anon 可 select/insert
CREATE POLICY "anon can manage vouchers" ON vouchers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- topup_records: anon 可 insert/select
CREATE POLICY "anon can manage topup" ON topup_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- reviews: anon 可 insert/select
CREATE POLICY "anon can manage reviews" ON reviews
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- product_inquiries: anon 可 insert
CREATE POLICY "anon can insert product_inquiries" ON product_inquiries
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 常用 Index ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_topup_records_status ON topup_records(status);
