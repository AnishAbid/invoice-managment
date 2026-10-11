import { discountLabel, prepare, type TemplateProps } from "./shared";

const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

/** Serif type on cream paper inside a double-rule frame, with a PAID stamp. */
export function ElegantTemplate({ data, ref }: TemplateProps) {
  const { rtl, dir, tr, date, money, lineTotal, items, subtotal, discount, tax, total } = prepare(data);
  const small = rtl ? "text-[12px]" : "text-[11px] tracking-[0.2em] uppercase";

  return (
    <div
      ref={ref}
      dir={dir}
      className={`mx-auto w-full max-w-[720px] bg-[#fdfbf6] p-5 text-[13px] text-[#292524] sm:p-6 ${rtl ? "urdu" : ""}`}
      style={{ lineHeight: rtl ? 2 : 1.6, ...(rtl ? {} : SERIF) }}
    >
      <div className="border-4 border-double border-[#a8865a] px-7 py-8 sm:px-10">
        {/* Header */}
        <div className="text-center">
          <div className={`text-[24px] break-words text-[#1c1917] ${rtl ? "font-bold" : "tracking-[0.08em]"}`}>
            {data.vendor.name || "—"}
          </div>
          {data.vendor.address && <div className="mt-1 whitespace-pre-line text-[#57534e]">{data.vendor.address}</div>}
          {data.vendor.phone && (
            <div className="text-[#57534e]">
              <span dir="ltr">{data.vendor.phone}</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-3 text-[#a8865a]">
            <span className="h-px w-16 bg-[#a8865a]" />
            <span className="text-[10px]">◆</span>
            <span className="h-px w-16 bg-[#a8865a]" />
          </div>
          <div className={`mt-3 text-[18px] text-[#78350f] ${rtl ? "" : "italic"}`}>{tr("paymentReceipt")}</div>
        </div>

        {/* Meta */}
        <div className="mt-7 grid grid-cols-3 gap-4 border-y border-[#e7dcc8] py-4 text-center">
          <Meta label={tr("receiptNo")} small={small}>
            <span dir="ltr">{data.receiptNumber}</span>
          </Meta>
          <Meta label={tr("date")} small={small}>
            {date}
          </Meta>
          <Meta label={tr("paymentMethod")} small={small}>
            {tr(data.paymentMethod)}
          </Meta>
        </div>

        <div className="mt-6">
          <div className={`text-[#a8865a] ${small}`}>{tr("billedTo")}</div>
          <div className="mt-1 text-[15px] break-words">{data.customer.name || "—"}</div>
          {data.customer.address && <div className="whitespace-pre-line text-[#57534e]">{data.customer.address}</div>}
          {data.customer.phone && (
            <div className="text-[#57534e]">
              {tr("phone")}: <span dir="ltr">{data.customer.phone}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className={`border-b border-[#a8865a] text-[#78350f] ${small}`}>
              <th className="py-2 text-start font-normal">{tr("description")}</th>
              <th className="w-14 py-2 text-center font-normal">{tr("qty")}</th>
              <th className="w-28 py-2 text-end font-normal">{tr("rate")}</th>
              <th className="w-32 py-2 text-end font-normal">{tr("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="border-b border-[#e7dcc8] py-6 text-center text-[#a8a29e]">—</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#e7dcc8] align-top">
                <td className="py-2.5 pe-3 break-words">{item.description}</td>
                <td className="py-2.5 text-center">
                  <span dir="ltr">{item.quantity}</span>
                </td>
                <td className="py-2.5 text-end whitespace-nowrap">
                  <span dir="ltr">{money(item.unitPrice)}</span>
                </td>
                <td className="py-2.5 text-end whitespace-nowrap">
                  <span dir="ltr">{money(lineTotal(item))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + stamp */}
        <div className="mt-5 flex items-center justify-between gap-6">
          <div className="flex flex-1 justify-center">
            <div
              className={`rounded-md border-[3px] border-double border-[#b91c1c] px-5 py-1 text-[22px] font-bold text-[#b91c1c] ${rtl ? "" : "tracking-[0.25em] uppercase"}`}
              style={{ transform: "rotate(-12deg)", opacity: 0.8 }}
            >
              {tr("paid")}
            </div>
          </div>
          <div className="w-full max-w-[260px] space-y-1">
            <Row label={tr("subtotal")} value={money(subtotal)} />
            {discount > 0 && <Row label={discountLabel(data, tr)} value={`− ${money(discount)}`} />}
            {tax > 0 && <Row label={`${tr("tax")} (${data.taxPercent}%)`} value={money(tax)} />}
            <div className="mt-2 flex items-center justify-between border-y-2 border-double border-[#a8865a] py-2 text-[17px] text-[#1c1917]">
              <span>{tr("total")}</span>
              <span dir="ltr" className="font-bold">
                {money(total)}
              </span>
            </div>
          </div>
        </div>

        {data.notes?.trim() && (
          <div className="mt-7">
            <div className={`text-[#a8865a] ${small}`}>{tr("notes")}</div>
            <div className={`mt-1 whitespace-pre-line text-[#44403c] ${rtl ? "" : "italic"}`}>{data.notes}</div>
          </div>
        )}

        <div className="mt-12 flex items-end justify-between gap-6">
          <div className={`text-[#57534e] ${rtl ? "" : "italic"}`}>{tr("thankYou")}</div>
          <div className="w-44 border-t border-[#78716c] pt-1 text-center text-[11px] text-[#78716c]">{tr("signature")}</div>
        </div>
      </div>
      <div className="mt-3 text-center text-[10px] text-[#a8a29e]">{tr("selfGenerated")}</div>
    </div>
  );
}

function Meta({ label, small, children }: { label: string; small: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className={`text-[#a8865a] ${small}`}>{label}</div>
      <div className="mt-1 break-words">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[#57534e]">
      <span>{label}</span>
      <span dir="ltr" className="text-[#1c1917]">
        {value}
      </span>
    </div>
  );
}
