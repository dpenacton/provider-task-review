import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Flat fee the reviewing provider earns per visit. */
export const PROVIDER_FEE = 15;

/** ISO timestamp -> "Aug 12, 2026 4:10 PM" for anything a provider reads. */
export function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
  });
}

export function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function deltaLabel(n: number) {
  if (Math.abs(n) < 0.005) return null;
  const abs = money(Math.abs(n));
  return n > 0 ? `Patient charged ${abs}` : `Refund ${abs}`;
}
