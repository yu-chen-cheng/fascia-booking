-- 協作管理：各成員的操作/功能權限
CREATE TABLE IF NOT EXISTS staff_permissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id              UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  can_view_phone        BOOLEAN NOT NULL DEFAULT false,
  can_checkout          BOOLEAN NOT NULL DEFAULT true,
  can_branch_settings   BOOLEAN NOT NULL DEFAULT false,
  can_plan_management   BOOLEAN NOT NULL DEFAULT false,
  can_member_management BOOLEAN NOT NULL DEFAULT false,
  can_inventory         BOOLEAN NOT NULL DEFAULT false,
  can_reports           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

-- 店員能管理哪些服務人員的關聯表
CREATE TABLE IF NOT EXISTS staff_managed_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  staff_id   UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manager_id, staff_id)
);

-- RLS
ALTER TABLE staff_permissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_managed_links  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_rw_permissions"    ON staff_permissions    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_rw_managed_links"  ON staff_managed_links  FOR ALL TO anon USING (true) WITH CHECK (true);
