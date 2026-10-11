import { discountLabel, initials, prepare, type TemplateProps } from "./shared";

/** Full-bleed dark header band with a monogram and amber accents. */
export function BoldTemplate({ data, ref }: TemplateProps) {
  const { rtl, dir, tr, date, money, lineTotal, caps, items, subtotal, discount, tax, total } = prepare(data);

  return (
    <div
      ref={ref}
      dir={dir}
      className={`mx-auto w-full max-w-[720px] bg-white text-[13px] text-[#0f172a] ${rtl ? "urdu" : "font-sans"}`}
      style={{ lineHeight: rtl ? 2 : 1.5 }}
    >
      {/* Band */}
      <div className="flex items-start justify-between gap-6 bg-[#0f172a] px-8 py-7 text-white sm:px-10">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#f59e0b] text-[17px] font-bold text-[#0f172a]">
            {initials(data.vendor.name)}
          </div>
          <div className="min-w-0">
            <div className="text-[19px] font-bold break-words">{data.vendor.name || "—"}</div>
            {data.vendor.address && <div className="whitespace-pre-line text-[#cbd5e1]">{data.vendor.address}</div>}
            {data.vendor.phone && (
              <div className="text-[#cbd5e1]">
                {tr("phone")}: <span dir="ltr">{data.vendor.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div className={`shrink-0 ${rtl ? "text-left" : "text-right"}`}>
          <div className={`text-[26px] leading-none font-extrabold text-[#f59e0b] ${rtl ? "" : "tracking-wider uppercase"}`}>
            {tr("receipt")}
          </div>
          <div className="mt-3 text-[#cbd5e1]">
            # <span dir="ltr" className="font-mono text-white">{data.receiptNumber}</span>
          </div>
          <div className="text-[#cbd5e1]">{date}</div>
        </div>
      </div>
      <div className="h-1.5 bg-[#f59e0b]" />

      <div className="p-8 sm:p-10">
        <div className="grid grid-cols-2 gap-6">
          <div className="min-w-0">
            <div className={`font-bold text-[#b45309] ${caps}`}>{tr("billedTo")}</div>
            <div className="mt-1 text-[15px] font-semibold break-words">{data.customer.name || "—"}</div>
            {data.customer.address && <div className="whitespace-pre-line text-[#475569]">{data.customer.address}</div>}
            {data.customer.phone && (
              <div className="text-[#475569]">
                {tr("phone")}: <span dir="ltr">{data.customer.phone}</span>
              </div>
            )}
          </div>
          <div className={rtl ? "text-left" : "text-right"}>
            <div className={`font-bold text-[#b45309] ${caps}`}>{tr("paymentMethod")}</div>
            <div className="mt-1 inline-block rounded-md border border-[#0f172a] px-3 py-0.5 font-semibold">
              {tr(data.paymentMethod)}
            </div>
          </div>
        </div>

        <table className="mt-7 w-full border-collapse">
          <thead>
            <tr className={`bg-[#0f172a] text-white ${caps}`}>
              <th className="px-3 py-2.5 text-start font-semibold">{tr("description")}</th>
              <th className="w-16 px-3 py-2.5 text-center font-semibold">{tr("qty")}</th>
              <th className="w-28 px-3 py-2.5 text-end font-semibold">{tr("rate")}</th>
              <th className="w-32 px-3 py-2.5 text-end font-semibold">{tr("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#94a3b8]">—</td>
              </tr>
            )}
            {items.map((item, idx) => (
              <tr key={item.id} className={`align-top ${idx % 2 ? "bg-[#f8fafc]" : "bg-white"}`}>
                <td className="px-3 py-2.5 break-words">{item.description}</td>
                <td className="px-3 py-2.5 text-center">
                  <span dir="ltr">{item.quantity}</span>
                </td>
                <td className="px-3 py-2.5 text-end whitespace-nowrap">
                  <span dir="ltr">{money(item.unitPrice)}</span>
                </td>
                <td className="px-3 py-2.5 text-end font-semibold whitespace-nowrap">
                  <span dir="ltr">{money(lineTotal(item))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t-2 border-[#0f172a]" />

        <div className="mt-5 flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            {data.notes?.trim() && (
              <>
                <div className={`font-bold text-[#b45309] ${caps}`}>{tr("notes")}</div>
                <div className="mt-1 whitespace-pre-line text-[#334155]">{data.notes}</div>
              </>
            )}
          </div>
          <div className="w-full max-w-[260px] space-y-1.5">
            <Row label={tr("subtotal")} value={money(subtotal)} />
            {discount > 0 && <Row label={discountLabel(data, tr)} value={`− ${money(discount)}`} />}
            {tax > 0 && <Row label={`${tr("tax")} (${data.taxPercent}%)`} value={money(tax)} />}
            <div className="mt-2 flex items-center justify-between bg-[#f59e0b] px-3 py-2.5 text-base font-extrabold text-[#0f172a]">
              <span>{tr("total")}</span>
              <span dir="ltr">{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-6">
          <div className="font-semibold">{tr("thankYou")}</div>
          <div className="w-44 border-t-2 border-[#0f172a] pt-1 text-center text-[11px] text-[#475569]">{tr("signature")}</div>
        </div>
        <div className="mt-6 text-center text-[10px] text-[#94a3b8]">{tr("selfGenerated")}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 text-[#475569]">
      <span>{label}</span>
      <span dir="ltr" className="font-semibold text-[#0f172a]">
        {value}
      </span>
    </div>
  );
}
