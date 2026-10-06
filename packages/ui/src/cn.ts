export type ClassValue = string | number | null | undefined | false | ClassValue[];
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const i of inputs) {
    if (!i) continue;
    if (Array.isArray(i)) {
      const n = cn(...i);
      if (n) out.push(n);
    } else out.push(String(i));
  }
  return out.join(" ");
}
