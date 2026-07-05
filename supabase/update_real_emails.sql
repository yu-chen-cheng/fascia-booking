-- 更新真實信箱與修正跨分店設定
-- 執行前請確認 staff_profiles 表已存在

-- 小巨蛋店
UPDATE staff_profiles SET email = 'daphne19941127@gmail.com' WHERE name = '宥彤';
UPDATE staff_profiles SET email = 'cbj52000000@gmail.com'    WHERE name = 'Jimbo';
UPDATE staff_profiles SET email = 'bc0099077@gmail.com'       WHERE name = '韓韓';
UPDATE staff_profiles SET email = 'jameschangmc@gmail.com'    WHERE name = '大吉';
UPDATE staff_profiles SET email = 'qwe28030@gmail.com'        WHERE name = 'Jojo';

-- 大安店
UPDATE staff_profiles SET email = 'raincy1224@gmail.com'      WHERE name = 'Miffy';
UPDATE staff_profiles SET email = 'wenny970415@gmail.com'     WHERE name = '雯儀';

-- 板橋店
UPDATE staff_profiles SET email = 'yichun9366@gmail.com'      WHERE name = 'Lily';
UPDATE staff_profiles SET email = 'minghao0131@gmail.com'     WHERE name = '溯源';

-- 跨分店：阿鐵（大安＋板橋 技術長）
UPDATE staff_profiles
  SET email = 'iduaagr@gmail.com', branch_id = NULL
  WHERE name = '阿鐵';

-- 跨分店：Cindy（大安職人、板橋店長）→ 以店長身份跨店
UPDATE staff_profiles
  SET email = 'cindy79930@gmail.com', branch_id = NULL, role = '店長'
  WHERE name = 'Cindy';

-- 跨分店：R3（大安＋板橋）
UPDATE staff_profiles
  SET email = 'Roylai686@gmail.com', branch_id = NULL
  WHERE name = 'R3';

-- 設定初始密碼（全員統一 fascia2024，之後可各自修改）
UPDATE staff_profiles SET password = 'fascia2024' WHERE password IS NULL OR password = '';
