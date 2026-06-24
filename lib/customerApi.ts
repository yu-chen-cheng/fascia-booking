// Supabase API helpers for customer-facing operations
import { supabase } from "./supabase";

// ── 建立或更新客戶資料 ─────────────────────────────────────
export async function upsertCustomer(params: {
  lineUserId: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  consentSigned?: boolean;
}) {
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        line_user_id: params.lineUserId,
        name: params.name,
        phone: params.phone,
        email: params.email ?? null,
        birthday: params.birthday ?? null,
        consent_signed: params.consentSigned ?? false,
      },
      { onConflict: "line_user_id" }
    )
    .select()
    .single();
  if (error) { console.error("upsertCustomer error", error); return null; }
  return data;
}

// ── 建立預約 ──────────────────────────────────────────────
export async function createBooking(params: {
  customerId: string;
  storeId: string;
  serviceId: string;
  staffId: string;
  date: string;          // 'YYYY-MM-DD'
  timeSlot: string;      // 'HH:mm'
  symptoms?: string[];
  addonId?: string;
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
      symptoms: params.symptoms ?? [],
      addon_id: params.addonId ?? null,
      notes: params.notes ?? null,
      total_price: params.totalPrice,
      status: "confirmed",
    })
    .select()
    .single();
  if (error) { console.error("createBooking error", error); return null; }
  return data;
}

// ── 取得客戶資料（含票券）────────────────────────────────
export async function getCustomerByLineId(lineUserId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("line_user_id", lineUserId)
    .single();
  if (error) return null;
  return data;
}

// ── 取得客戶票券 ──────────────────────────────────────────
export async function getCustomerVouchers(customerId: string) {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// ── 取得預約紀錄 ──────────────────────────────────────────
export async function getCustomerBookings(customerId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", customerId)
    .order("date", { ascending: false });
  if (error) return [];
  return data;
}

// ── 取消預約 ──────────────────────────────────────────────
export async function cancelBooking(bookingId: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  return !error;
}

// ── 建立儲值申請 ──────────────────────────────────────────
export async function createTopupRecord(params: {
  customerId: string;
  amount: number;
  paymentMethod: "transfer" | "credit_card";
  transferRef?: string;
}) {
  const bonusVouchers =
    params.amount >= 30000
      ? { structure_training: 2500, frequency_check: 2500 }
      : params.amount >= 15000
      ? { structure_training: 2500 }
      : null;

  const { data, error } = await supabase
    .from("topup_records")
    .insert({
      customer_id: params.customerId,
      amount: params.amount,
      payment_method: params.paymentMethod,
      transfer_ref: params.transferRef ?? null,
      bonus_vouchers: bonusVouchers,
      status: "pending",
    })
    .select()
    .single();
  if (error) return null;
  return data;
}

// ── 檢查是否需要發評價通知（首次調理完成後）────────────────
export async function shouldSendReview(customerId: string): Promise<boolean> {
  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);
  return (count ?? 0) === 0;
}

// ── 提交評價 ──────────────────────────────────────────────
export async function submitReview(params: {
  bookingId: string;
  customerId: string;
  painScore: number;
  satisfaction: number;
  symptomsTreated: string[];
  googleReviewed: boolean;
}) {
  const { error: reviewError } = await supabase.from("reviews").insert({
    booking_id: params.bookingId,
    customer_id: params.customerId,
    pain_score: params.painScore,
    satisfaction: params.satisfaction,
    symptoms_treated: params.symptomsTreated,
    google_reviewed: params.googleReviewed,
  });
  if (reviewError) return false;

  // 發放 $200 Google 評價折價券
  if (params.googleReviewed) {
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);
    await supabase.from("vouchers").insert({
      customer_id: params.customerId,
      type: "discount_200",
      amount: 200,
      description: "感謝您的 Google 評價！",
      source: "google_review",
      expire_at: expireAt.toISOString(),
    });
  }
  return true;
}
