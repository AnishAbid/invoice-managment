import Link from "next/link";
import { ReceiptText } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-emerald-950">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-800 text-white shadow-sm">
              <ReceiptText className="size-4.5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Ledgerly</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#why"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/70 transition hover:text-emerald-950 sm:inline"
            >
              Why Ledgerly
            </a>
            <a
              href="#how"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/70 transition hover:text-emerald-950 sm:inline"
            >
              How it helps
            </a>
            <Link
              href="/receipts"
              className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/80 transition hover:bg-emerald-950/5"
            >
              Open app
            </Link>
            <Link href="/receipts/new" className="btn-primary shadow-sm">
              Generate
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-emerald-900/10 bg-[#eef5f0] py-8 text-center text-sm text-emerald-950/60">
        <p className="font-display text-base font-medium text-emerald-950">
          Ledgerly
        </p>
        <p className="mt-1 text-xs">Receipts stay on this device — nothing leaves your browser.</p>
      </footer>
    </>
  );
}
