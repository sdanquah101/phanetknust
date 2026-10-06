"use server";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export type AuthState = { error?: string; message?: string } | undefined;

function safeNext(v: FormDataEntryValue | null, fallback = "/") {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "Enter your email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(next);
}

export async function magicLinkAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  const origin = String(formData.get("origin") ?? "");
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) return { error: error.message };
  return { message: "Check your inbox for a sign-in link." };
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const next = safeNext(formData.get("next"));
  const origin = String(formData.get("origin") ?? "");
  if (!email || !password || !full_name) return { error: "Name, email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) return { error: error.message };
  if (data.session) redirect(next);
  return { message: "Account created. Check your inbox to confirm your email, then sign in." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
