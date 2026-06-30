-- 將「明星職人」更名為「技術長」
-- 先移除 CHECK 限制，更新資料，再加回新限制

ALTER TABLE staff_profiles DROP CONSTRAINT IF EXISTS staff_profiles_level_check;
ALTER TABLE commission_rates DROP CONSTRAINT IF EXISTS commission_rates_level_check;

UPDATE staff_profiles SET level = '技術長' WHERE level = '明星職人';
UPDATE commission_rates SET level = '技術長' WHERE level = '明星職人';

ALTER TABLE staff_profiles ADD CONSTRAINT staff_profiles_level_check
  CHECK (level IN ('準師', '初階職人', '進階職人', '資深職人', '技術長'));

-- commission_rates 的 level 欄位沒有 CHECK 限制，所以不需要重新加
