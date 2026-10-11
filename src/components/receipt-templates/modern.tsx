import { discountLabel, prepare, type TemplateProps } from "./shared";

/** Minimal, roomy layout that puts the amount paid first. */
export function ModernTemplate({ data, ref }: TemplateProps) {
  const { rtl, dir, tr, date, money, lineTotal, caps, items, subtotal, discount, tax, total } = prepare(data);
  const muted = "text-[#6b7280]";

  return (
    <div
      ref={ref}
      dir={dir}
      className={`mx-auto w-full max-w-[720px] bg-white p-8 text-[13px] text-[#111827] sm:p-12 ${rtl ? "urdu" : "font-sans"}`}
      style={{ lineHeight: rtl ? 2 : 1.55 }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className={`${muted} ${caps}`}>{tr("receipt")}</div>
          <div className="mt-1 text-[26px] leading-tight font-semibold break-words">{data.vendor.name || "—"}</div>
        </div>
        <div className={`shrink-0 font-mono text-[12px] ${muted}`} dir="ltr">
          #{data.receiptNumber}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6 border-y border-[#e5e7eb] py-5">
        <Stat label={tr("amountPaid")} caps={caps}>
          <span dir="ltr" className="text-[18px] font-semibold text-[#4f46e5]">
            {money(total)}
          </span>
        </Stat>
        <Stat label={tr("datePaid")} caps={caps}>
          {date}
        </Stat>
        <Stat label={tr("paymentMethod")} caps={caps}>
          {tr(data.paymentMethod)}
        </Stat>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <PartyInfo label={tr("from")} name={data.vendor.name} phone={data.vendor.phone} address={data.vendor.address} caps={caps} phoneLabel={tr("phone")} />
        <PartyInfo label={tr("billedTo")} name={data.customer.name} phone={data.customer.phone} address={data.customer.address} caps={caps} phoneLabel={tr("phone")} />
      </div>

      <div className={`mt-10 ${muted} ${caps}`}>{tr("summary")}</div>
      <div className="mt-2 rounded-xl bg-[#f9fafb] px-5 py-2">
        {items.length === 0 && <div className={`py-4 text-center ${muted}`}>—</div>}
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 border-b border-[#eef0f3] py-3">
            <div className="min-w-0">
              <div className="break-words">{item.description}</div>
              <div className={`text-[12px] ${muted}`} dir="ltr">
                {item.quantity} × {money(item.unitPrice)}
              </div>
            </div>
            <div className="shrink-0 font-medium" dir="ltr">
              {money(lineTotal(item))}
            </div>
          </div>
        ))}
        <div className="space-y-1.5 py-3">
          <Row label={tr("subtotal")} value={money(subtotal)} />
          {discount > 0 && <Row label={discountLabel(data, tr)} value={`− ${money(discount)}`} />}
          {tax > 0 && <Row label={`${tr("tax")} (${data.taxPercent}%)`} value={money(tax)} />}
        </div>
        <div className="flex items-center justify-between border-t border-[#e5e7eb] py-3 text-[15px] font-semibold">
          <span>{tr("amountPaid")}</span>
          <span dir="ltr">{money(total)}</span>
        </div>
      </div>

      {data.notes?.trim() && (
        <div className="mt-8">
          <div className={`${muted} ${caps}`}>{tr("notes")}</div>
          <div className="mt-1 whitespace-pre-line">{data.notes}</div>
        </div>
      )}

      <div className="mt-12 border-t border-[#e5e7eb] pt-4 text-center">
        <div className={muted}>{tr("thankYou")}</div>
        <div className="mt-2 text-[10px] text-[#9ca3af]">{tr("selfGenerated")}</div>
      </div>
    </div>
  );
}

function Stat({ label, caps, children }: { label: string; caps: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className={`text-[#6b7280] ${caps}`}>{label}</div>
      <div className="mt-1 font-medium break-words">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[#6b7280]">
      <span>{label}</span>
      <span dir="ltr" className="text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function PartyInfo({
  label, name, phone, address, caps, phoneLabel,
}: {
  label: string;
  name: string;
  phone?: string;
  address?: string;
  caps: string;
  phoneLabel: string;
}) {
  return (
    <div className="min-w-0">
      <div className={`text-[#6b7280] ${caps}`}>{label}</div>
      <div className="mt-1 font-medium break-words">{name || "—"}</div>
      {address && <div className="whitespace-pre-line text-[#4b5563]">{address}</div>}
      {phone && (
        <div className="text-[#4b5563]">
          {phoneLabel}: <span dir="ltr">{phone}</span>
        </div>
      )}
    </div>
  );
}
