import { amountInWords } from "@/lib/receipt";
import { discountLabel, prepare, type TemplateProps } from "./shared";

const INK = "#1e3a8a";
const MIN_ROWS = 8;

/** Ruled bill-book "cash memo" as used by shops across Pakistan. */
export function MemoTemplate({ data, ref }: TemplateProps) {
  const { rtl, dir, tr, date, money, lineTotal, items, subtotal, discount, tax, total } = prepare(data);
  const cell = "border border-[#1e3a8a] px-2.5 py-1.5";
  const blanks = Math.max(0, MIN_ROWS - items.length);

  return (
    <div
      ref={ref}
      dir={dir}
      className={`mx-auto w-full max-w-[720px] bg-white p-8 text-[13px] sm:p-10 ${rtl ? "urdu" : "font-sans"}`}
      style={{ lineHeight: rtl ? 2 : 1.5, color: INK }}
    >
      <div className="border-2 border-[#1e3a8a] p-5">
        {/* Header */}
        <div className="text-center">
          <div className={`text-[24px] font-extrabold break-words ${rtl ? "" : "uppercase"}`}>{data.vendor.name || "—"}</div>
          {data.vendor.address && <div className="whitespace-pre-line">{data.vendor.address}</div>}
          {data.vendor.phone && (
            <div>
              {tr("phone")}: <span dir="ltr">{data.vendor.phone}</span>
            </div>
          )}
          <div
            className={`mt-3 inline-block rounded-full bg-[#1e3a8a] px-5 py-0.5 text-[13px] font-bold text-white ${rtl ? "" : "tracking-widest uppercase"}`}
          >
            {tr("cashMemo")}
          </div>
        </div>

        {/* Fill-in lines */}
        <div className="mt-5 flex items-end justify-between gap-8">
          <FillLine label={tr("receiptNo")} className="w-[45%]">
            <span dir="ltr" className="font-mono font-semibold whitespace-nowrap text-[#b91c1c]">
              {data.receiptNumber}
            </span>
          </FillLine>
          <FillLine label={tr("date")} className="w-[40%]">
            {date}
          </FillLine>
        </div>
        <FillLine label={tr("ms")} className="mt-3 w-full">
          {[data.customer.name, data.customer.phone].filter(Boolean).join(" · ") || " "}
        </FillLine>

        {/* Grid */}
        <table className="mt-5 w-full border-collapse">
          <thead>
            <tr className="bg-[#dbeafe]">
              <th className={`${cell} w-11 text-center font-bold`}>{tr("sNo")}</th>
              <th className={`${cell} text-start font-bold`}>{tr("description")}</th>
              <th className={`${cell} w-14 text-center font-bold`}>{tr("qty")}</th>
              <th className={`${cell} w-24 text-end font-bold`}>{tr("rate")}</th>
              <th className={`${cell} w-28 text-end font-bold`}>{tr("amount")}</th>
            </tr>
          </thead>
          <tbody className="text-[#0f172a]">
            {items.map((item, idx) => (
              <tr key={item.id} className="align-top">
                <td className={`${cell} text-center`}>{idx + 1}</td>
                <td className={`${cell} break-words`}>{item.description}</td>
                <td className={`${cell} text-center`}>
                  <span dir="ltr">{item.quantity}</span>
                </td>
                <td className={`${cell} text-end whitespace-nowrap`}>
                  <span dir="ltr">{money(item.unitPrice)}</span>
                </td>
                <td className={`${cell} text-end whitespace-nowrap`}>
                  <span dir="ltr">{money(lineTotal(item))}</span>
                </td>
              </tr>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <tr key={`blank-${i}`}>
                {Array.from({ length: 5 }, (_, c) => (
                  <td key={c} className={cell}>
                    &nbsp;
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {(discount > 0 || tax > 0) && (
              <SumRow cell={cell} label={tr("subtotal")} value={money(subtotal)} />
            )}
            {discount > 0 && <SumRow cell={cell} label={discountLabel(data, tr)} value={`− ${money(discount)}`} />}
            {tax > 0 && <SumRow cell={cell} label={`${tr("tax")} (${data.taxPercent}%)`} value={money(tax)} />}
            <tr className="bg-[#1e3a8a] text-white">
              <td colSpan={4} className={`${cell} text-end text-[15px] font-bold ${rtl ? "" : "uppercase"}`}>
                {tr("total")}
              </td>
              <td className={`${cell} text-end text-[15px] font-bold whitespace-nowrap`}>
                <span dir="ltr">{money(total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        {!rtl && (
          <FillLine label={tr("inWords")} className="mt-4 w-full">
            <span className="italic">{amountInWords(total, data.currency)}</span>
          </FillLine>
        )}

        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div>
              {tr("paymentMethod")}: <span className="font-semibold">{tr(data.paymentMethod)}</span>
            </div>
            {data.notes?.trim() && <div className="mt-1 whitespace-pre-line text-[#334155]">{data.notes}</div>}
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="font-semibold">{tr("thankYou")}</div>
          <div className="w-44 border-t border-[#1e3a8a] pt-1 text-center text-[11px]">{tr("signature")}</div>
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-[#94a3b8]">{tr("selfGenerated")}</div>
    </div>
  );
}

function FillLine({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="shrink-0 font-bold">{label}</span>
      <span className="min-w-0 flex-1 border-b border-dotted border-[#1e3a8a] px-1 break-words text-[#0f172a]">
        {children}
      </span>
    </div>
  );
}

function SumRow({ cell, label, value }: { cell: string; label: string; value: string }) {
  return (
    <tr>
      <td colSpan={4} className={`${cell} text-end`}>
        {label}
      </td>
      <td className={`${cell} text-end whitespace-nowrap text-[#0f172a]`}>
        <span dir="ltr">{value}</span>
      </td>
    </tr>
  );
}
