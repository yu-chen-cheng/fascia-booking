-- 設定各分店技師
-- 小巨蛋 ST01：宥彤、韓韓、Jimbo、大吉、Jojo、宇辰（業主）
-- 大安 ST02：阿鐵、Cindy、Miffy、雯儀
-- 板橋 ST03：溯源、Lily、R3、Cindy（跨店）

-- 注意：依照 name 欄位更新，若有重複名字請自行調整

UPDATE staff_profiles SET branch_id = 'ST01' WHERE name IN ('宥彤', '韓韓', 'Jimbo', '大吉', 'Jojo');
UPDATE staff_profiles SET branch_id = 'ST02' WHERE name IN ('阿鐵', 'Miffy', '雯儀');
UPDATE staff_profiles SET branch_id = 'ST03' WHERE name IN ('溯源', 'Lily', 'R3');

-- Cindy 跨店（大安 + 板橋）：branch_id 設為 NULL（跨店），或選一家主店
-- 方案A：設為 NULL（跨店，會出現在全部分店）
-- UPDATE staff_profiles SET branch_id = NULL WHERE name = 'Cindy';

-- 方案B：設為大安（主店），板橋需要另外在 staff_branches 多對多表記錄
-- 目前系統用 branch_id 單欄位，先設為 NULL 讓她出現在兩家店
UPDATE staff_profiles SET branch_id = NULL WHERE name = 'Cindy';

-- 業主（宇辰）—— 若已在 DB，設為 ST01 小巨蛋，並確認 level、role
UPDATE staff_profiles SET branch_id = 'ST01', level = '技術長', role = '管理者' WHERE email = 'xtey176@gmail.com';
