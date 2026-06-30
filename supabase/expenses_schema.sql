-- 費用記錄表（固定成本、耗材、雜支等）
CREATE TABLE IF NOT EXISTS expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT REFERENCES branches(id),
  month TEXT NOT NULL,  -- YYYY-MM
  category TEXT NOT NULL CHECK (category IN ('房租', '水電', '薪水費', '耗材', '其他')),
  amount INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_expense_records" ON expense_records FOR ALL TO anon USING (true) WITH CHECK (true);
