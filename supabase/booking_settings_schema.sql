-- 網路預約開放設定
CREATE TABLE IF NOT EXISTS staff_booking_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  is_open         BOOLEAN NOT NULL DEFAULT true,
  publish_day     INT NOT NULL DEFAULT 25,        -- 每月幾號公開
  publish_months  INT NOT NULL DEFAULT 2,         -- 公開未來幾個月
  publish_time    TIME NOT NULL DEFAULT '12:00',  -- 幾點公開（分店共用）
  min_before_mins INT NOT NULL DEFAULT 0,         -- 最晚幾分鐘前可預約（0=不限）
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

-- 每日可預約時段（覆蓋預設全天開放；空 = 使用預設）
CREATE TABLE IF NOT EXISTS staff_available_slots (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id  UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  slots     TEXT[] NOT NULL DEFAULT '{}',   -- e.g. {"10:00","10:30","11:00",...}
  UNIQUE(staff_id, date)
);

-- RLS: 管理者可讀寫
ALTER TABLE staff_booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_available_slots  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_rw_booking_settings" ON staff_booking_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_rw_available_slots"  ON staff_available_slots  FOR ALL TO anon USING (true) WITH CHECK (true);
