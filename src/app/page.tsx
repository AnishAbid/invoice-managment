"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText, ImageIcon, ReceiptText, Search, Upload } from "lucide-react";
import { listReceipts } from "@/lib/db";
import { formatDate, formatMoney, todayISO } from "@/lib/receipt";
import type { Currency, Receipt } from "@/lib/types";

type Filter = "all" | "generated" | "uploaded";

export default function Dashboard() {
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    listReceipts().then(setReceipts);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (receipts ?? []).filter((r) => {
      if (filter !== "all" && r.kind !== filter) return false;
      if (!q) return true;
      const haystack = [
        r.title,
        r.category,
        r.kind === "generated" ? r.data.receiptNumber : r.file.name,
        r.kind === "generated" ? r.data.customer.name : r.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [receipts, query, filter]);

  const monthTotals = useMemo(() => {
    const prefix = todayISO().slice(0, 7);
    const totals = new Map<Currency, number>();
    for (const r of receipts ?? []) {
      if (r.date.startsWith(prefix)) totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.total);
    }
    return [...totals.entries()];
  }, [receipts]);

  if (receipts === null) return <div className="py-20 text-center text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your receipts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep every payment on record — upload a photo, or generate a digital slip when the shop doesn&apos;t give one.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload" className="btn-secondary">
            <Upload className="size-4" /> Upload
          </Link>
          <Link href="/receipts/new" className="btn-primary">
            <FilePlus2 className="size-4" /> Generate receipt
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total receipts" value={String(receipts.length)} />
        <Stat
          label="Generated / Uploaded"
          value={`${receipts.filter((r) => r.kind === "generated").length} / ${receipts.filter((r) => r.kind === "uploaded").length}`}
        />
        <Stat
          label="Spent this month"
          value={monthTotals.length ? monthTotals.map(([c, v]) => formatMoney(v, c)).join(" · ") : "—"}
        />
      </div>

      {receipts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search vendor, receipt no., category…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">
              {(["all", "generated", "uploaded"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1.5 capitalize transition ${
                    filter === f ? "bg-white font-medium text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {visible.map((r) => (
              <li key={r.id}>
                <Link href={`/receipts/${r.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-slate-50">
                  <KindIcon receipt={r} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-left font-medium" dir="auto">{r.title}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
                      <span>{formatDate(r.date)}</span>
                      <span>·</span>
                      <span className="font-mono">
                        {r.kind === "generated" ? r.data.receiptNumber : r.file.name}
                      </span>
                      {r.category && (
                        <>
                          <span>·</span>
                          <span>{r.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold whitespace-nowrap">{r.total ? formatMoney(r.total, r.currency) : "—"}</div>
                    <div className="text-xs text-slate-500 capitalize">{r.kind}</div>
                  </div>
                </Link>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-500">No receipts match your search.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}

function KindIcon({ receipt }: { receipt: Receipt }) {
  const Icon =
    receipt.kind === "generated" ? ReceiptText : receipt.file.type === "application/pdf" ? FileText : ImageIcon;
  const tone = receipt.kind === "generated" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700";
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}>
      <Icon className="size-5" />
    </span>
  );
}

function EmptyState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/receipts/new" className="card group p-6 transition hover:border-emerald-300 hover:shadow-sm">
        <span className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <FilePlus2 className="size-5" />
        </span>
        <h3 className="mt-4 font-semibold">Generate a digital receipt</h3>
        <p className="mt-1 text-sm text-slate-500">
          Shop or service provider didn&apos;t give a slip? Enter the details and create a clean receipt in English or
          Urdu — then download or print it.
        </p>
      </Link>
      <Link href="/upload" className="card group p-6 transition hover:border-sky-300 hover:shadow-sm">
        <span className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
          <Upload className="size-5" />
        </span>
        <h3 className="mt-4 font-semibold">Upload a receipt</h3>
        <p className="mt-1 text-sm text-slate-500">
          Snap a photo of a paper slip or add a PDF bill so everything lives in one place.
        </p>
      </Link>
    </div>
  );
}
