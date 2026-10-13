import "server-only";
import { headers } from "next/headers";
import { cookieDomain } from "./env";

/**
 * The origin of the current request, worked out on the server. Used to build the links
 * in sign-in and sign-up emails, so the address in those emails can never be supplied
 * by the browser. In production the host must belong to NEXT_PUBLIC_COOKIE_DOMAIN.
 */
export async function requestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/.test(host)) return null;
  const hostname = host.replace(/:\d+$/, "");
  const domain = cookieDomain()?.replace(/^\./, "").toLowerCase();
  if (domain && hostname !== domain && !hostname.endsWith(`.${domain}`)) return null;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const proto = local ? "http" : "https";
  return `${proto}://${host}`;
}
