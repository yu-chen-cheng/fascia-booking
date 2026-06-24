// Auto-generated types for Supabase database
// FASCIA 法夏 筋膜預訂系統

export type MembershipLevel = "general" | "bronze" | "platinum" | "gold";
export type BookingStatus = "confirmed" | "cancelled" | "completed";
export type VoucherType = "discount_200" | "structure_training" | "frequency_check";
export type PaymentMethod = "transfer" | "credit_card";
export type TopupStatus = "pending" | "confirmed" | "rejected";

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          line_user_id: string | null;
          name: string;
          phone: string | null;
          email: string | null;
          birthday: string | null;
          membership_level: MembershipLevel;
          stored_value: number;
          total_spent: number;
          consent_signed: boolean;
          is_foreign: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          store_id: string;
          service_id: string;
          staff_id: string;
          date: string;
          time_slot: string;
          status: BookingStatus;
          symptoms: string[] | null;
          addon_id: string | null;
          notes: string | null;
          total_price: number;
          is_manual: boolean;
          review_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      vouchers: {
        Row: {
          id: string;
          customer_id: string;
          type: VoucherType;
          amount: number;
          description: string | null;
          source: string | null;
          expire_at: string | null;
          used_at: string | null;
          used_booking_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vouchers"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vouchers"]["Insert"]>;
      };
      topup_records: {
        Row: {
          id: string;
          customer_id: string;
          amount: number;
          payment_method: PaymentMethod;
          status: TopupStatus;
          transfer_ref: string | null;
          bonus_vouchers: Record<string, unknown> | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["topup_records"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["topup_records"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          pain_score: number | null;
          satisfaction: number | null;
          symptoms_treated: string[] | null;
          google_reviewed: boolean;
          submitted_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "submitted_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      product_inquiries: {
        Row: {
          id: string;
          customer_id: string;
          booking_id: string | null;
          product_id: string;
          product_name: string;
          symptoms: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_inquiries"]["Row"], "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_inquiries"]["Insert"]>;
      };
    };
  };
}
