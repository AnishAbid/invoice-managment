import Link from "next/link";
import { ArrowRight, FilePlus2, Languages, Lock, Printer, Upload } from "lucide-react";
import { ReceiptHeroVisual } from "@/components/landing/receipt-hero-visual";

export default function LandingPage() {
  return (
    <div className="landing-page overflow-x-clip">
      {/* Hero — one composition: brand, headline, support, CTAs, dominant receipt visual */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="landing-atmosphere absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-10 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-20 lg:pt-20">
          <div className="landing-rise max-w-xl">
            <p className="font-display text-4xl font-semibold tracking-tight text-emerald-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Ledgerly
            </p>
            <h1 className="mt-5 font-display text-2xl font-medium leading-snug tracking-tight text-emerald-950/90 sm:text-3xl">
              Every payment, on record.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-950/65 sm:text-lg">
              Upload paper slips or generate clean bilingual receipts when the shop never gave you one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/receipts/new" className="btn-primary px-5 py-2.5 text-base shadow-sm">
                Generate a receipt
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/upload" className="btn-secondary border-emerald-900/15 bg-white/70 px-5 py-2.5 text-base backdrop-blur">
                <Upload className="size-4" />
                Upload a slip
              </Link>
            </div>
          </div>

          <div className="landing-rise-delayed relative flex justify-center lg:justify-end">
            <ReceiptHeroVisual />
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section id="why" className="scroll-mt-8 border-t border-emerald-900/8 bg-[#f4f8f5] px-4 py-20 sm:px-6 sm:py-28">
        <div className="landing-reveal mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium uppercase tracking-[0.18em] text-emerald-800/70">
            Why it matters
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
            Paper vanishes. Your proof shouldn&apos;t.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-emerald-950/65 sm:text-lg">
            Vendors forget slips. Photos get buried in the camera roll. Ledgerly gathers every receipt — generated or
            uploaded — so returns, reimbursements, and tax season aren&apos;t a scavenger hunt.
          </p>
        </div>
      </section>

      {/* How it helps */}
      <section id="how" className="scroll-mt-8 bg-white px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal max-w-2xl">
            <p className="font-display text-sm font-medium uppercase tracking-[0.18em] text-emerald-800/70">
              How it helps
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
              Generate, capture, keep.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-emerald-950/65 sm:text-lg">
              Three ways Ledgerly covers the gap between a purchase and a usable record.
            </p>
          </div>

          <ol className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
            <Capability
              step="01"
              icon={<FilePlus2 className="size-5" />}
              title="Generate when shops don't"
              body="Enter vendor, items, and totals. Print or download a polished slip in English or Urdu."
            />
            <Capability
              step="02"
              icon={<Upload className="size-5" />}
              title="Upload what you already have"
              body="Drop a photo or PDF of a paper bill so every payment lives in one private library."
            />
            <Capability
              step="03"
              icon={<Printer className="size-5" />}
              title="Templates that print clean"
              body="Classic, thermal, memo, and more — pick a layout that matches the shop or your books."
            />
          </ol>
        </div>
      </section>

      {/* Trust / private */}
      <section className="border-y border-emerald-900/8 bg-[#eef5f0] px-4 py-16 sm:px-6 sm:py-20">
        <div className="landing-reveal mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-white">
            <Lock className="size-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              Private by design
            </h2>
            <p className="mt-2 text-base leading-relaxed text-emerald-950/65">
              Receipts stay in this browser with IndexedDB — no account cloud, no surprise uploads. Your money trail
              stays yours.
            </p>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="landing-reveal mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row-reverse sm:items-center sm:gap-10">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Languages className="size-6" />
          </div>
          <div className="sm:text-right">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              Built for English &amp; Urdu
            </h2>
            <p className="mt-2 text-base leading-relaxed text-emerald-950/65">
              Switch direction and script when you generate — so the slip matches the customer, the shop, or your
              records.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="landing-atmosphere-soft absolute inset-0" aria-hidden />
        <div className="landing-reveal relative mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
            Start with one receipt
          </h2>
          <p className="mt-4 text-base text-emerald-950/65 sm:text-lg">
            Open the app, generate a slip, or upload the photo you just took.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/receipts/new" className="btn-primary px-5 py-2.5 text-base shadow-sm">
              Generate a receipt
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/receipts" className="btn-secondary border-emerald-900/15 bg-white/80 px-5 py-2.5 text-base">
              View your receipts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Capability({
  step,
  icon,
  title,
  body,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="landing-reveal relative">
      <div className="flex items-center gap-3 text-emerald-800">
        <span className="font-display text-sm font-semibold tracking-[0.14em] text-emerald-800/50">{step}</span>
        <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800">{icon}</span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-emerald-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-emerald-950/60 sm:text-[15px]">{body}</p>
    </li>
  );
}
