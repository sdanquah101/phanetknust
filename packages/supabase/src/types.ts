/* Row types for the public schema. Keep in sync with supabase/migrations. */
import type { Role } from "./roles";

export type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null; member_id: string | null; created_at: string; updated_at: string };
export type UserRole = { user_id: string; role: Role; granted_by: string | null; granted_at: string };

export type Member = {
  id: string; member_code: string; first_name: string; last_name: string; other_names: string | null;
  gender: "male" | "female" | null; dob: string | null; phone: string | null; whatsapp: string | null; email: string | null;
  photo_path: string | null; programme: string | null; college: string | null; year_of_study: string | null;
  hall: string | null; room: string | null; residence_type: "hall" | "hostel" | "home" | "other" | null;
  hometown: string | null; region: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null;
  membership_status: "active" | "inactive" | "alumni" | "visitor"; joined_at: string | null; baptized: boolean | null;
  department: string | null; leader_id: string | null; user_id: string | null; notes: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};
export type MemberSearchRow = { id: string; member_code: string; full_name: string; photo_path: string | null; hall: string | null; programme: string | null; year_of_study: string | null; leader_id: string | null; phone: string | null };
export const memberName = (m: Pick<Member, "first_name" | "last_name" | "other_names">) => [m.first_name, m.other_names, m.last_name].filter(Boolean).join(" ");

export type Program = { id: string; slug: string; name: string; tagline: string | null; description: string | null; schedule_label: string | null; location: string | null; cover_url: string | null; sort_order: number; is_active: boolean; created_at: string };
export type Event = { id: string; program_id: string | null; title: string; slug: string | null; description: string | null; starts_at: string; ends_at: string | null; location: string | null; cover_url: string | null; is_public: boolean; academic_year: string | null; semester: 1 | 2 | null; created_by: string | null; created_at: string };
export type Attendance = { id: string; event_id: string; member_id: string; marked_by: string | null; method: "usher" | "leader" | "self" | "import"; marked_at: string };
export type SiteSetting = { key: string; value: unknown; updated_at: string };

/* finance */
export type GivingFund = { id: string; slug: string; name: string; description: string | null; target_amount: number | null; is_active: boolean; sort_order: number };
export type Budget = { id: string; title: string; program_id: string | null; event_id: string | null; academic_year: string; semester: 1 | 2 | null; status: "draft" | "active" | "closed"; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
export type BudgetLine = { id: string; budget_id: string; name: string; kind: "income" | "expense"; planned_amount: number; sort_order: number };
export type BudgetSummary = { budget_id: string; title: string; academic_year: string; semester: number | null; status: string; program_id: string | null; event_id: string | null; planned_income: number; planned_expense: number; actual_income: number; actual_expense: number };
export type TxChannel = "momo_mtn" | "telecel_cash" | "card" | "cash" | "bank";
export type Transaction = {
  id: string; kind: "income" | "expense"; category: string; amount: number; channel: TxChannel;
  status: "paid" | "counted" | "pending" | "approved" | "rejected";
  description: string | null; member_id: string | null; payer_name: string | null; payer_email: string | null; payer_phone: string | null;
  reference: string | null; source: "manual" | "paystack" | "import"; program_id: string | null; event_id: string | null;
  budget_id: string | null; budget_line_id: string | null; payee_name: string | null;
  approver_role: "finance_head" | "cec_chair" | "pastor" | null; approved_by: string | null; approved_at: string | null; decision_note: string | null;
  paid_at: string | null; occurred_at: string; recorded_by: string | null; metadata: Record<string, unknown>; created_at: string; updated_at: string;
};
export const CHANNEL_LABELS: Record<TxChannel, string> = { momo_mtn: "MTN MoMo", telecel_cash: "Telecel Cash", card: "Card", cash: "Cash", bank: "Bank" };

/* welfare */
export type WelfareItem = { id: string; name: string; category: string; unit: string; qty_available: number; max_per_request: number; image_url: string | null; is_active: boolean; created_at: string; updated_at: string };
export type WelfareRequest = { id: string; code: string; requester_name: string; phone: string; hall_room: string | null; member_id: string | null; note: string | null; status: "pending" | "approved" | "ready" | "collected" | "declined"; decided_by: string | null; decided_at: string | null; decision_note: string | null; created_at: string };
export type WelfareRequestItem = { request_id: string; item_id: string; qty: number };
export type WelfareStockMovement = { id: string; item_id: string; delta: number; reason: "donation" | "purchase" | "issued" | "adjustment" | "returned"; note: string | null; by_user: string | null; created_at: string };

/* prayer wall */
export type PrayerPublic = { id: string; topic: string; body: string | null; category: string; status: "open" | "answered"; pray_count: number; created_at: string; answered_at: string | null };
export type PrayerRequest = PrayerPublic & { code: string; is_hidden: boolean };
export type TestimonyPublic = { id: string; body: string; created_at: string; topic: string; category: string; request_id: string };
export type Testimony = { id: string; request_id: string; body: string; is_hidden: boolean; created_at: string };

/* academy */
export type Course = { id: string; slug: string; title: string; summary: string | null; description: string | null; cover_url: string | null; format: "video" | "audio" | "mixed"; level: string; instructor: string | null; duration_label: string | null; pass_mark: number; is_published: boolean; sort_order: number; created_by: string | null; created_at: string; updated_at: string };
export type Lesson = { id: string; course_id: string; sort_order: number; title: string; kind: "video" | "audio" | "reading"; youtube_url: string | null; audio_url: string | null; body: string | null; duration_minutes: number | null; created_at: string };
export type Quiz = { id: string; course_id: string; title: string; instructions: string | null };
export type QuizQuestion = { id: string; quiz_id: string; sort_order: number; prompt: string; options: string[]; correct_index: number; explanation: string | null };
export type QuizQuestionPublic = Omit<QuizQuestion, "correct_index" | "explanation">;
export type Enrollment = { user_id: string; course_id: string; enrolled_at: string; completed_at: string | null };
export type LessonProgress = { user_id: string; lesson_id: string; completed_at: string };
export type QuizAttempt = { id: string; user_id: string; quiz_id: string; answers: Record<string, number>; score: number; passed: boolean; created_at: string };
export type Certificate = { id: string; code: string; user_id: string; course_id: string; recipient_name: string; issued_at: string };
export type Resource = { id: string; title: string; kind: "book" | "message" | "audio" | "document"; description: string | null; author: string | null; cover_url: string | null; file_url: string | null; youtube_url: string | null; is_published: boolean; sort_order: number; created_at: string };
export type QuizResult = { attempt_id: string; score: number; passed: boolean; correct: number; total: number; certificate_code: string | null; lessons_done: number; lessons_total: number };

/* shop */
export type Product = { id: string; slug: string; name: string; description: string | null; price: number; image_url: string | null; stock: number; options: string[]; is_active: boolean; sort_order: number; created_at: string };
export type Order = { id: string; order_no: string; buyer_name: string; buyer_email: string; buyer_phone: string; pickup_note: string | null; subtotal: number; status: "pending" | "paid" | "fulfilled" | "cancelled"; paystack_reference: string | null; paid_at: string | null; fulfilled_at: string | null; created_at: string };
export type OrderItem = { id: string; order_id: string; product_id: string; name: string; option: string | null; unit_price: number; qty: number };

/* leaders */
export type Followup = { id: string; sheep_id: string; leader_id: string; kind: "call" | "visit" | "text" | "prayer" | "meeting" | "other"; summary: string; needs: string | null; prayer_points: string | null; next_action: string | null; next_action_date: string | null; occurred_at: string; created_by: string | null; created_at: string };
export type FollowupShare = { followup_id: string; shared_with: string; note: string | null; shared_by: string | null; created_at: string };
export type SheepReport = { id: string; leader_id: string; sheep_id: string; week_start: string; attended: boolean; contacted: boolean; wellbeing: number | null; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
export type TransferRequest = { id: string; sheep_id: string; from_leader: string | null; to_leader: string; reason: string | null; status: "pending" | "approved" | "rejected"; decided_by: string | null; decided_at: string | null; created_by: string | null; created_at: string };
export type LeaderRow = { id: string; full_name: string; member_code: string; department: string | null };

/** Extract a YouTube video id from any share/watch/embed URL. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
export function youtubeThumb(url: string | null | undefined) {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
