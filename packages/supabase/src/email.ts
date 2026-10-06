import "server-only";

/** Minimal Resend sender. No-ops (and logs) when RESEND_API_KEY is missing. */
export async function sendEmail(args: { to: string; subject: string; html: string; text?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "PHANET KNUST <hello@phaneteers.com>";
  if (!key) {
    console.info("[email skipped: RESEND_API_KEY unset]", args.subject, "→", args.to);
    return { ok: false, skipped: true as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [args.to], subject: args.subject, html: args.html, text: args.text }),
  });
  return { ok: res.ok, skipped: false as const };
}
