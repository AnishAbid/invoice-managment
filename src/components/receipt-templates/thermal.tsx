import { discountLabel, prepare, type TemplateProps } from "./shared";

/** 80 mm till-roll slip: narrow, monospace, dashed rules. */
export function ThermalTemplate({ data, ref }: TemplateProps) {
  const { rtl, dir, tr, date, money, lineTotal, items, subtotal, discount, tax, total } = prepare(data);
  const rule = "my-2.5 border-t border-dashed border-[#334155]";

  return (
    <div
      ref={ref}
      dir={dir}
      className={`mx-auto w-full max-w-[320px] bg-white px-5 py-6 text-[12px] text-[#111827] ${rtl ? "urdu" : "font-mono"}`}
      style={{ lineHeight: rtl ? 2 : 1.45 }}
    >
      <div className="text-center">
        <div className={`text-[16px] font-bold break-words ${rtl ? "" : "uppercase"}`}>{data.vendor.name || "—"}</div>
        {data.vendor.address && <div className="whitespace-pre-line">{data.vendor.address}</div>}
        {data.vendor.phone && (
          <div>
            {tr("phone")}: <span dir="ltr">{data.vendor.phone}</span>
          </div>
        )}
      </div>

      <div className={rule} />
      <div className={`text-center font-bold ${rtl ? "" : "tracking-[0.3em] uppercase"}`}>{tr("receipt")}</div>
      <div className={rule} />

      <Line label={tr("receiptNo")} value={<span dir="ltr">{data.receiptNumber}</span>} />
      <Line label={tr("date")} value={date} />
      {data.customer.name && <Line label={tr("billedTo")} value={data.customer.name} />}

      <div className={rule} />

      {items.length === 0 && <div className="py-2 text-center">—</div>}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id}>
            <div className="break-words">{item.description}</div>
            <div className="flex justify-between gap-2 text-[#374151]">
              <span dir="ltr">
                {item.quantity} x {money(item.unitPrice)}
              </span>
              <span dir="ltr" className="font-semibold text-[#111827]">
                {money(lineTotal(item))}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={rule} />
      <Line label={tr("subtotal")} value={<span dir="ltr">{money(subtotal)}</span>} />
      {discount > 0 && <Line label={discountLabel(data, tr)} value={<span dir="ltr">− {money(discount)}</span>} />}
      {tax > 0 && <Line label={`${tr("tax")} (${data.taxPercent}%)`} value={<span dir="ltr">{money(tax)}</span>} />}
      <div className="my-2 border-t-2 border-double border-[#111827]" />
      <div className="flex justify-between gap-2 text-[16px] font-bold">
        <span className={rtl ? "" : "uppercase"}>{tr("total")}</span>
        <span dir="ltr">{money(total)}</span>
      </div>
      <div className="my-2 border-t-2 border-double border-[#111827]" />
      <Line label={tr("paymentMethod")} value={tr(data.paymentMethod)} />

      {data.notes?.trim() && (
        <>
          <div className={rule} />
          <div className="whitespace-pre-line">{data.notes}</div>
        </>
      )}

      <div className={rule} />
      <div className="text-center font-semibold">{rtl ? tr("thankYou") : `*** ${tr("thankYou").toUpperCase()} ***`}</div>
      <div className="mt-3 text-center text-[9px] text-[#6b7280]">{tr("selfGenerated")}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#374151]">{label}</span>
      <span className="text-end font-medium break-words">{value}</span>
    </div>
  );
}
