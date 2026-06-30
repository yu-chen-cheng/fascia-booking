import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/auth  →  登入驗證
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "請輸入信箱與密碼" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, email, name, role, level, employment_type, branch_id, base_salary, position_allowance, session_threshold, is_active")
    .eq("email", email.toLowerCase().trim())
    .eq("password", password)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "信箱或密碼錯誤" }, { status: 401 });
  }

  // 查詢分店名稱
  let branchName = "";
  if (data.branch_id) {
    const { data: branch } = await supabase
      .from("branches")
      .select("name")
      .eq("id", data.branch_id)
      .single();
    branchName = branch?.name ?? "";
  }

  return NextResponse.json({
    staff: {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      level: data.level,
      employmentType: data.employment_type,
      branchId: data.branch_id,
      branchName,
      baseSalary: data.base_salary,
      positionAllowance: data.position_allowance,
      sessionThreshold: data.session_threshold,
    },
  });
}

// PUT /api/admin/auth  →  修改密碼
export async function PUT(req: NextRequest) {
  const { email, oldPassword, newPassword } = await req.json();
  if (!email || !oldPassword || !newPassword) {
    return NextResponse.json({ error: "參數不完整" }, { status: 400 });
  }

  // 驗證舊密碼
  const { data: existing } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("email", email)
    .eq("password", oldPassword)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "舊密碼錯誤" }, { status: 401 });
  }

  await supabase.from("staff_profiles").update({ password: newPassword }).eq("email", email);
  return NextResponse.json({ ok: true });
}
