// Supabase API helpers for admin operations
import { supabase } from "./supabase";

// ── 取得所有預約（後台用）────────────────────────────────────
export async function getAdminBookings(params?: {
  storeId?: string;
  date?: string;       // 'YYYY-MM-DD'
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from("bookings")
    .select(`
      *,
      customers (id, name, phone, line_user_id, membership_level, stored_value),
      staff:staff_id (id, name)
    `)
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (params?.storeId) query = query.eq("store_id", params.storeId);
  if (params?.date) query = query.eq("date", params.date);
  if (params?.startDate) query = query.gte("date", params.startDate);
  if (params?.endDate) query = query.lte("date", params.endDate);

  const { data, error } = await query;
  if (error) { console.error("getAdminBookings error", error); return []; }
  return data ?? [];
}

// ── 更新預約狀態 ──────────────────────────────────────────────
export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled" | "no_show",
  paymentMethod?: string
) {
  const update: Record<string, unknown> = { status };
  if (paymentMethod) update.payment_method = paymentMethod;

  const { error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId);
  return !error;
}

// ── 更新預約備註 ──────────────────────────────────────────────
export async function updateBookingNotes(bookingId: string, notes: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ notes })
    .eq("id", bookingId);
  return !error;
}

// ── 取得所有客戶（後台用）────────────────────────────────────
export async function getAdminCustomers(search?: string) {
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) { console.error("getAdminCustomers error", error); return []; }
  return data ?? [];
}

// ── 更新客戶資料（後台）──────────────────────────────────────
export async function updateCustomer(customerId: string, params: {
  name?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  membershipLevel?: "general" | "member" | "gold" | "platinum";
  storedValue?: number;
  totalSpent?: number;
  bodyNotes?: string;
}) {
  const update: Record<string, unknown> = {};
  if (params.name !== undefined) update.name = params.name;
  if (params.phone !== undefined) update.phone = params.phone;
  if (params.email !== undefined) update.email = params.email;
  if (params.birthday !== undefined) update.birthday = params.birthday;
  if (params.membershipLevel !== undefined) update.membership_level = params.membershipLevel;
  if (params.storedValue !== undefined) update.stored_value = params.storedValue;
  if (params.totalSpent !== undefined) update.total_spent = params.totalSpent;
  if (params.bodyNotes !== undefined) update.body_notes = params.bodyNotes;

  const { error } = await supabase
    .from("customers")
    .update(update)
    .eq("id", customerId);
  return !error;
}

// ── 取得儲值申請待審清單 ──────────────────────────────────────
export async function getPendingTopups() {
  const { data, error } = await supabase
    .from("topup_records")
    .select(`*, customers (id, name, phone)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

// ── 確認儲值（後台審核）──────────────────────────────────────
export async function approveTopup(topupId: string, customerId: string, amount: number) {
  // 1. 標記儲值為 approved
  const { error: e1 } = await supabase
    .from("topup_records")
    .update({ status: "approved" })
    .eq("id", topupId);
  if (e1) return false;

  // 2. 增加客戶儲值金
  const { data: customer } = await supabase
    .from("customers")
    .select("stored_value")
    .eq("id", customerId)
    .single();

  const current = customer?.stored_value ?? 0;
  const { error: e2 } = await supabase
    .from("customers")
    .update({ stored_value: current + amount })
    .eq("id", customerId);

  return !e2;
}

// ── 手動新增預約（後台臨時預約）──────────────────────────────
export async function createAdminBooking(params: {
  customerId: string;
  storeId: string;
  serviceId: string;
  staffId: string;
  date: string;
  timeSlot: string;
  notes?: string;
  totalPrice: number;
}) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: params.customerId,
      store_id: params.storeId,
      service_id: params.serviceId,
      staff_id: params.staffId,
      date: params.date,
      time_slot: params.timeSlot,
      notes: params.notes ?? null,
      total_price: params.totalPrice,
      status: "confirmed",
      symptoms: [],
    })
    .select()
    .single();
  if (error) return null;
  return data;
}
