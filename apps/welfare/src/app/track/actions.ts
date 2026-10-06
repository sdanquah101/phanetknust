"use server";
import { redirect } from "next/navigation";

export async function trackAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) redirect("/track?error=" + encodeURIComponent("Enter your request code."));
  redirect(`/request/${encodeURIComponent(code)}`);
}
