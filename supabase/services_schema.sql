-- 服務項目表
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,  -- minutes
  category TEXT NOT NULL DEFAULT 'fascia', -- fascia | training | addon
  is_addon BOOLEAN NOT NULL DEFAULT false,
  online_bookable BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 各等級價格表（每個服務 × 每個等級）
CREATE TABLE IF NOT EXISTS service_prices (
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_level TEXT NOT NULL,  -- 準師 | 初階職人 | 進階職人 | 資深職人 | 技術長
  price_regular INTEGER NOT NULL DEFAULT 0,
  price_member  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (service_id, staff_level)
);

-- 技師可執行的服務（多對多）
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- 初始資料
INSERT INTO services (id, name, duration, category, is_addon, online_bookable, sort_order) VALUES
  ('basic-60',      '基礎筋膜放鬆',     60,  'fascia',   false, true,  1),
  ('refined-90',    '精緻筋膜調理',     90,  'fascia',   false, true,  2),
  ('premium-120',   '頂級筋膜結構整合', 120, 'fascia',   false, true,  3),
  ('training-smart','智能訓練',         50,  'training', false, true,  4),
  ('frequency-40',  '頻率檢測',         40,  'fascia',   false, false, 5),
  ('addon-15',         '加購延長 +15分',       15, 'addon', true, true, 6),
  ('addon-gold-sleep', '黃金甲｜舒壓好眠組',  0,  'addon', true, true, 7),
  ('addon-gold-eye',   '黃金甲｜晶亮活力組',  0,  'addon', true, true, 8),
  ('addon-gold-beauty','黃金甲｜逆齡淨化組',  0,  'addon', true, true, 9)
ON CONFLICT (id) DO NOTHING;

-- 價格資料（等級對應：準師/初階職人/進階職人/資深職人/技術長）
INSERT INTO service_prices (service_id, staff_level, price_regular, price_member) VALUES
  ('basic-60', '技術長',   3000, 2500),
  ('basic-60', '資深職人', 2500, 2000),
  ('basic-60', '進階職人', 2000, 1600),
  ('basic-60', '初階職人', 1500, 1200),
  ('basic-60', '準師',     1500, 1200),
  ('refined-90', '技術長',   3800, 3200),
  ('refined-90', '資深職人', 3200, 2500),
  ('refined-90', '進階職人', 2500, 2000),
  ('refined-90', '初階職人', 2000, 1600),
  ('refined-90', '準師',     2000, 1600),
  ('premium-120', '技術長',   4500, 3800),
  ('premium-120', '資深職人', 3800, 3000),
  ('premium-120', '進階職人', 3000, 2500),
  ('premium-120', '初階職人', 2500, 2000),
  ('premium-120', '準師',     2500, 2000),
  ('training-smart', '技術長',   2500, 2000),
  ('training-smart', '資深職人', 2500, 2000),
  ('training-smart', '進階職人', 2500, 2000),
  ('training-smart', '初階職人', 2500, 2000),
  ('training-smart', '準師',     2500, 2000),
  ('frequency-40', '技術長',   2500, 2500),
  ('frequency-40', '資深職人', 2500, 2500),
  ('frequency-40', '進階職人', 2500, 2500),
  ('frequency-40', '初階職人', 2500, 2500),
  ('frequency-40', '準師',     2500, 2500),
  ('addon-15', '技術長',   500, 500),
  ('addon-15', '資深職人', 500, 500),
  ('addon-15', '進階職人', 500, 500),
  ('addon-15', '初階職人', 500, 500),
  ('addon-15', '準師',     500, 500),
  ('addon-gold-sleep', '技術長',   3060, 2640),
  ('addon-gold-sleep', '資深職人', 3060, 2640),
  ('addon-gold-sleep', '進階職人', 3060, 2640),
  ('addon-gold-sleep', '初階職人', 3060, 2640),
  ('addon-gold-sleep', '準師',     3060, 2640),
  ('addon-gold-eye', '技術長',   2370, 2040),
  ('addon-gold-eye', '資深職人', 2370, 2040),
  ('addon-gold-eye', '進階職人', 2370, 2040),
  ('addon-gold-eye', '初階職人', 2370, 2040),
  ('addon-gold-eye', '準師',     2370, 2040),
  ('addon-gold-beauty', '技術長',   4360, 3760),
  ('addon-gold-beauty', '資深職人', 4360, 3760),
  ('addon-gold-beauty', '進階職人', 4360, 3760),
  ('addon-gold-beauty', '初階職人', 4360, 3760),
  ('addon-gold-beauty', '準師',     4360, 3760)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read services" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "anon read service_prices" ON service_prices FOR SELECT TO anon USING (true);
CREATE POLICY "anon read staff_services" ON staff_services FOR SELECT TO anon USING (true);
CREATE POLICY "anon write services" ON services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write service_prices" ON service_prices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon write staff_services" ON staff_services FOR ALL TO anon USING (true) WITH CHECK (true);
