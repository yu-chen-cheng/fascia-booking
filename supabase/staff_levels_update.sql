-- 更新各技師等級

UPDATE staff_profiles SET level = '技術長'   WHERE name IN ('宥彤', '阿鐵');
UPDATE staff_profiles SET level = '資深職人' WHERE name IN ('韓韓', 'Cindy', 'Miffy');
UPDATE staff_profiles SET level = '進階職人' WHERE name IN ('雯儀');
UPDATE staff_profiles SET level = '初階職人' WHERE name IN ('大吉', '溯源', 'R3', 'Lily', 'Jimbo', 'Jojo');

-- 更新宇辰（業主/管理者）
UPDATE staff_profiles SET level = '技術長', role = '管理者', branch_id = 'ST01'
  WHERE email = 'xtey176@gmail.com';

-- 新增慧茹（會計）— 若已存在請調整 email
INSERT INTO staff_profiles (name, email, role, level, employment_type, branch_id)
VALUES ('慧茹', 'happyday49960@gmail.com', '會計', '進階職人', '僱傭制', NULL)
ON CONFLICT (email) DO UPDATE SET role = '會計', branch_id = NULL;
