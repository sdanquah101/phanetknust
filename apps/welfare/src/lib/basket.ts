/** Basket lives in localStorage so members can shop without an account. */
export const BASKET_KEY = "phanet-welfare-basket";
export type Basket = Record<string, number>;

export function readBasket(): Basket {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BASKET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Basket = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isInteger(n) && n > 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeBasket(b: Basket) {
  if (typeof window === "undefined") return;
  try {
    const clean: Basket = {};
    for (const [k, v] of Object.entries(b)) if (v > 0) clean[k] = v;
    window.localStorage.setItem(BASKET_KEY, JSON.stringify(clean));
  } catch {
    /* storage unavailable */
  }
}

export function clearBasket() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BASKET_KEY);
  } catch {
    /* ignore */
  }
}

export function basketCount(b: Basket) {
  return Object.values(b).reduce((s, n) => s + n, 0);
}
