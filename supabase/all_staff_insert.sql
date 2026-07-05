-- 插入所有技師/員工資料
-- 執行前請確認 staff_profiles 表已存在
-- 安全：ON CONFLICT DO UPDATE，可重複執行

INSERT INTO staff_profiles (name, email, role, level, employment_type, branch_id, is_active)
VALUES
  -- 小巨蛋店 ST01
  ('宥彤',  'youtong@fascia.com', '員工', '技術長',   '承攬制', 'ST01', true),
  ('Jimbo', 'jimbo@fascia.com',   '店長', '初階職人', '僱傭制', 'ST01', true),
  ('韓韓',  'hanhan@fascia.com',  '員工', '資深職人', '承攬制', 'ST01', true),
  ('大吉',  'daji@fascia.com',    '員工', '初階職人', '承攬制', 'ST01', true),
  ('Jojo',  'jojo@fascia.com',    '員工', '初階職人', '承攬制', 'ST01', true),

  -- 大安店 ST02
  ('阿鐵',  'atai@fascia.com',    '員工', '技術長',   '承攬制', 'ST02', true),
  ('Miffy', 'miffy@fascia.com',   '店長', '資深職人', '僱傭制', 'ST02', true),
  ('雯儀',  'wenyi@fascia.com',   '員工', '進階職人', '承攬制', 'ST02', true),

  -- 板橋店 ST03
  ('溯源',  'shuoyuan@fascia.com','員工', '初階職人', '承攬制', 'ST03', true),
  ('Lily',  'lily@fascia.com',    '員工', '初階職人', '承攬制', 'ST03', true),
  ('R3',    'r3@fascia.com',      '員工', '初階職人', '承攬制', 'ST03', true),

  -- 跨分店 (branch_id = NULL)
  ('Cindy', 'cindy@fascia.com',   '員工', '資深職人', '承攬制', NULL,   true),

  -- 管理層
  ('宇辰',  'xtey176@gmail.com',  '管理者','技術長',  '承攬制', 'ST01', true),
  ('慧茹',  'happyday49960@gmail.com', '會計', '進階職人', '僱傭制', NULL, true)

ON CONFLICT (email) DO UPDATE SET
  name            = EXCLUDED.name,
  role            = EXCLUDED.role,
  level           = EXCLUDED.level,
  employment_type = EXCLUDED.employment_type,
  branch_id       = EXCLUDED.branch_id,
  is_active       = EXCLUDED.is_active;
