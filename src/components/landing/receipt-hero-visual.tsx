/** Dominant product visual for the marketing hero — a stylized printed receipt. */
export function ReceiptHeroVisual() {
  return (
    <div className="landing-float relative mx-auto w-full max-w-[340px] sm:max-w-[400px]" aria-hidden>
      <div className="absolute -inset-8 rounded-[2rem] bg-emerald-700/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-sm bg-[#fbfaf7] shadow-[0_28px_60px_-20px_rgba(6,78,59,0.35),0_8px_16px_-8px_rgba(15,23,42,0.18)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-3 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, #04785722 6px, #04785722 8px)",
          }}
        />
        <div className="border-b border-dashed border-emerald-800/20 px-6 pb-5 pt-7 text-center">
          <div className="font-display text-lg font-semibold tracking-tight text-emerald-900">Karachi Mart</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Shop 14, Tariq Road
            <br />
            Tel · 021-0000000
          </div>
          <div className="mt-4 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
            Receipt
          </div>
        </div>
        <div className="space-y-3 px-6 py-5 text-[12px]">
          <div className="flex justify-between text-slate-500">
            <span>No. KM-1042</span>
            <span>12 Mar 2026</span>
          </div>
          <div className="space-y-2 border-y border-slate-200/80 py-3">
            <Row item="Basmati rice 5kg" amount="Rs 1,850" />
            <Row item="Cooking oil 1L" amount="Rs 620" />
            <Row item="Tea bags" amount="Rs 340" />
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>Rs 2,810</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span>Rs 140</span>
          </div>
          <div className="flex items-end justify-between border-t border-emerald-800/15 pt-3">
            <span className="font-display text-sm font-semibold text-emerald-950">Paid</span>
            <span className="font-display text-xl font-semibold tracking-tight text-emerald-800">Rs 2,950</span>
          </div>
          <div className="urdu pt-2 text-center text-[13px] text-slate-500">شکریہ — Thanks for shopping</div>
        </div>
        <div
          className="h-4 w-full"
          style={{
            background:
              "linear-gradient(135deg, #fbfaf7 25%, transparent 25%) -8px 0 / 16px 16px, linear-gradient(225deg, #fbfaf7 25%, transparent 25%) -8px 0 / 16px 16px, linear-gradient(315deg, #fbfaf7 25%, transparent 25%) 0 0 / 16px 16px, linear-gradient(45deg, #fbfaf7 25%, transparent 25%) 0 0 / 16px 16px",
            backgroundColor: "transparent",
            maskImage: "linear-gradient(to bottom, black 40%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

function Row({ item, amount }: { item: string; amount: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-slate-700">{item}</span>
      <span className="shrink-0 font-mono text-[11px] text-slate-800">{amount}</span>
    </div>
  );
}
