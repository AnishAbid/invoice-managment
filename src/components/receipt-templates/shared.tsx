import type { Ref } from "react";
import { computeTotals, formatDate, formatMoney, t } from "@/lib/receipt";
import type { GeneratedReceiptData } from "@/lib/types";

/**
 * Every template renders the same data. Templates use inline hex colours only
 * so html2canvas output matches the on-screen and printed version exactly.
 */
export interface TemplateProps {
  data: GeneratedReceiptData;
  ref?: Ref<HTMLDivElement>;
}

/** Values every template needs, derived once from the receipt data. */
export function prepare(data: GeneratedReceiptData) {
  const L = data.language;
  const rtl = L === "ur";
  return {
    L,
    rtl,
    dir: rtl ? ("rtl" as const) : ("ltr" as const),
    tr: (key: string) => t(L, key),
    date: formatDate(data.date, L),
    money: (n: number) => formatMoney(n, data.currency, L),
    lineTotal: (i: { quantity: number; unitPrice: number }) => (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    // Letter-spacing breaks Urdu letter joining, so caps styling is English-only
    caps: rtl ? "text-[12px]" : "text-[11px] tracking-wider uppercase",
    items: data.items.filter((i) => i.description.trim() || i.unitPrice),
    ...computeTotals(data),
  };
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "—";
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();
}

/** Discount label with the percentage when relevant, e.g. "Discount (10%)". */
export function discountLabel(data: GeneratedReceiptData, tr: (k: string) => string) {
  return `${tr("discount")}${data.discountType === "percent" ? ` (${data.discountValue}%)` : ""}`;
}
