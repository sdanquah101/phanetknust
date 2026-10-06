"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { CODE_RE, normalizeCode } from "@/lib/queries";

/** Adds a testimony via rpc submit_testimony (which also marks the request answered). */
export async function submitTestimonyAction(formData: FormData) {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  const body = String(formData.get("body") ?? "").trim();

  const back = (error: string) => `/share?code=${encodeURIComponent(code)}&error=${encodeURIComponent(error)}#testify`;

  if (!CODE_RE.test(code)) redirect(`/share?error=${encodeURIComponent("Enter the code you received, like PW-ABC123.")}`);
  if (body.length < 10) redirect(back("Tell us a little more — at least 10 characters."));
  if (body.length > 3000) redirect(back("Keep your testimony under 3,000 characters."));

  let ok = false;
  let message = "We couldn't save your testimony just now. Please try again.";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_testimony", { p_code: code, p_body: body });
    if (error) {
      if (/could not find/i.test(error.message)) message = "We couldn't find that code. Check it and try again.";
      throw error;
    }
    ok = Boolean(data);
  } catch (e) {
    console.error("submit_testimony failed", e);
  }
  if (!ok) redirect(back(message));

  revalidatePath("/");
  revalidatePath("/testimonies");
  redirect("/testimonies?ok=1");
}
