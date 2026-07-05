-- ══════════════════════════════════════════════════
-- 抽成費率設定
-- 承攬制：技師每場次的固定抽成金額
-- 僱傭制：每場次的基本工資加給（40人次/60分鐘起算）
-- ══════════════════════════════════════════════════

-- 清除舊資料
DELETE FROM commission_rates;

-- ──────────────────────────────────────────────────
-- 承攬制 (commission_type = '承攬制')
-- ──────────────────────────────────────────────────

-- 基礎筋膜放鬆 60分鐘
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('準師',     'basic-60', '承攬制', 650),
  ('初階職人', 'basic-60', '承攬制', 650),
  ('進階職人', 'basic-60', '承攬制', 750),
  ('資深職人', 'basic-60', '承攬制', 850),
  ('技術長',   'basic-60', '承攬制', 1100);

-- 精緻筋膜調理 90分鐘
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('準師',     'refined-90', '承攬制', 800),
  ('初階職人', 'refined-90', '承攬制', 800),
  ('進階職人', 'refined-90', '承攬制', 950),
  ('資深職人', 'refined-90', '承攬制', 1100),
  ('技術長',   'refined-90', '承攬制', 1400);

-- 頂級筋膜結構整合 120分鐘
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('準師',     'premium-120', '承攬制', 950),
  ('初階職人', 'premium-120', '承攬制', 950),
  ('進階職人', 'premium-120', '承攬制', 1100),
  ('資深職人', 'premium-120', '承攬制', 1300),
  ('技術長',   'premium-120', '承攬制', 1700);

-- 智能訓練 50分鐘
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('準師',     'training-smart', '承攬制', 600),
  ('初階職人', 'training-smart', '承攬制', 600),
  ('進階職人', 'training-smart', '承攬制', 700),
  ('資深職人', 'training-smart', '承攬制', 800),
  ('技術長',   'training-smart', '承攬制', 900);

-- 加購 +15分
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('準師',     'addon-15', '承攬制', 200),
  ('初階職人', 'addon-15', '承攬制', 200),
  ('進階職人', 'addon-15', '承攬制', 200),
  ('資深職人', 'addon-15', '承攬制', 200),
  ('技術長',   'addon-15', '承攬制', 250);

-- ──────────────────────────────────────────────────
-- 僱傭制 (commission_type = '僱傭制')
-- 每 60分鐘人次的基本加給（40人次起算）
-- ──────────────────────────────────────────────────

-- 基本場次加給（依 60 分鐘計算）
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('初階職人', 'basic-60', '僱傭制', 200),
  ('進階職人', 'basic-60', '僱傭制', 300),
  ('資深職人', 'basic-60', '僱傭制', 400),
  ('技術長',   'basic-60', '僱傭制', 500);

-- 加購 +15分 加給
INSERT INTO commission_rates (level, service_type, commission_type, amount) VALUES
  ('初階職人', 'addon-15', '僱傭制', 50),
  ('進階職人', 'addon-15', '僱傭制', 75),
  ('資深職人', 'addon-15', '僱傭制', 100),
  ('技術長',   'addon-15', '僱傭制', 120);
