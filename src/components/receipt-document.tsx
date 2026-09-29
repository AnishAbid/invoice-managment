import { forwardRef } from "react";
import { computeTotals, formatDate, formatMoney, t } from "@/lib/receipt";
import type { GeneratedReceiptData, Party } from "@/lib/types";

/**
 * The printable receipt. Uses inline hex colours only so html2canvas output
 * matches the on-screen and printed version exactly.
 */
export const ReceiptDocument = forwardRef<HTMLDivElement, { data: GeneratedReceiptData }>(
  function ReceiptDocument({ data }, ref) {
    const L = data.language;
    const rtl = L === "ur";
    const { subtotal, discount, tax, total } = computeTotals(data);
    const money = (n: number) => formatMoney(n, data.currency, L);
    // Letter-spacing breaks Urdu letter joining, so caps styling is English-only
    const caps = rtl ? "text-[12px]" : "text-[11px] tracking-wider uppercase";
    const items = data.items.filter((i) => i.description.trim() || i.unitPrice);

    return (
      <div
        ref={ref}
        dir={rtl ? "rtl" : "ltr"}
        className={`mx-auto w-full max-w-[720px] bg-white p-8 text-[13px] text-[#0f172a] sm:p-10 ${rtl ? "urdu" : "font-sans"}`}
        style={{ lineHeight: rtl ? 2 : 1.5 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-[#047857] pb-5">
          <div className="min-w-0">
            <div className="text-xl font-bold break-words text-[#0f172a]">
              {data.vendor.name || "—"}
            </div>
            {data.vendor.address && (
              <div className="mt-1 whitespace-pre-line text-[#475569]">{data.vendor.address}</div>
            )}
            {data.vendor.phone && (
              <div className="text-[#475569]">
                {t(L, "phone")}: <span dir="ltr">{data.vendor.phone}</span>
              </div>
            )}
          </div>
          <div className={`shrink-0 ${rtl ? "text-left" : "text-right"}`}>
            <div className={`text-2xl font-bold text-[#047857] ${rtl ? "" : "tracking-wide uppercase"}`}>
              {t(L, "receipt")}
            </div>
            <div className="mt-2 text-[#475569]">
              {t(L, "receiptNo")}:{" "}
              <span dir="ltr" className="font-mono font-semibold text-[#0f172a]">
                {data.receiptNumber}
              </span>
            </div>
            <div className="text-[#475569]">
              {t(L, "date")}: <span className="font-semibold text-[#0f172a]">{formatDate(data.date, L)}</span>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 py-5">
          <PartyBlock title={t(L, "billedTo")} party={data.customer} lang={L} />
          <div className={rtl ? "text-left" : "text-right"}>
            <div className={`font-semibold text-[#64748b] ${caps}`}>
              {t(L, "paymentMethod")}
            </div>
            <div className="mt-1 inline-block rounded-full bg-[#ecfdf5] px-3 py-0.5 font-semibold text-[#047857]">
              {t(L, data.paymentMethod)}
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full border-collapse">
          <thead>
            <tr className={`bg-[#f1f5f9] text-[#475569] ${caps}`}>
              <th className="w-8 px-3 py-2 text-start font-semibold">#</th>
              <th className="px-3 py-2 text-start font-semibold">{t(L, "description")}</th>
              <th className="w-16 px-3 py-2 text-center font-semibold">{t(L, "qty")}</th>
              <th className="w-28 px-3 py-2 text-end font-semibold">{t(L, "rate")}</th>
              <th className="w-32 px-3 py-2 text-end font-semibold">{t(L, "amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="border-b border-[#e2e8f0] px-3 py-6 text-center text-[#94a3b8]">
                  —
                </td>
              </tr>
            )}
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-[#e2e8f0] align-top">
                <td className="px-3 py-2 text-[#64748b]">{idx + 1}</td>
                <td className="px-3 py-2 break-words">{item.description}</td>
                <td className="px-3 py-2 text-center">
                  <span dir="ltr">{item.quantity}</span>
                </td>
                <td className="px-3 py-2 text-end whitespace-nowrap">
                  <span dir="ltr">{money(item.unitPrice)}</span>
                </td>
                <td className="px-3 py-2 text-end font-medium whitespace-nowrap">
                  <span dir="ltr">{money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-[280px] space-y-1.5">
            <Row label={t(L, "subtotal")} value={money(subtotal)} />
            {discount > 0 && (
              <Row
                label={`${t(L, "discount")}${data.discountType === "percent" ? ` (${data.discountValue}%)` : ""}`}
                value={`− ${money(discount)}`}
              />
            )}
            {tax > 0 && <Row label={`${t(L, "tax")} (${data.taxPercent}%)`} value={money(tax)} />}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-[#047857] px-3 py-2 text-base font-bold text-white">
              <span>{t(L, "total")}</span>
              <span dir="ltr">{money(total)}</span>
            </div>
          </div>
        </div>

        {data.notes?.trim() && (
          <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <div className={`font-semibold text-[#64748b] ${caps}`}>{t(L, "notes")}</div>
            <div className="mt-1 whitespace-pre-line">{data.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="text-[#475569]">{t(L, "thankYou")}</div>
          <div className="w-44 border-t border-[#94a3b8] pt-1 text-center text-[11px] text-[#64748b]">
            {t(L, "signature")}
          </div>
        </div>
        <div className="mt-6 border-t border-dashed border-[#cbd5e1] pt-3 text-center text-[10px] text-[#94a3b8]">
          {t(L, "selfGenerated")}
        </div>
      </div>
    );
  },
);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 text-[#475569]">
      <span>{label}</span>
      <span dir="ltr" className="font-medium text-[#0f172a]">
        {value}
      </span>
    </div>
  );
}

function PartyBlock({ title, party, lang }: { title: string; party: Party; lang: "en" | "ur" }) {
  const caps = lang === "ur" ? "text-[12px]" : "text-[11px] tracking-wider uppercase";
  return (
    <div className="min-w-0">
      <div className={`font-semibold text-[#64748b] ${caps}`}>{title}</div>
      <div className="mt-1 font-semibold break-words">{party.name || "—"}</div>
      {party.address && <div className="whitespace-pre-line text-[#475569]">{party.address}</div>}
      {party.phone && (
        <div className="text-[#475569]">
          {t(lang, "phone")}: <span dir="ltr">{party.phone}</span>
        </div>
      )}
    </div>
  );
}
