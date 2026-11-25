"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { toGeneratedData } from "@/lib/document";
import { computeTotals, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import { effectiveInvoiceStatus, type InvoiceStatus } from "@/lib/types";

const FILTERS: (InvoiceStatus | "all")[] = ["all", "draft", "sent", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const { ready, t, format, invoices } = useLedger();
  const [status, setStatus] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const today = todayISO();

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return invoices.filter((inv) => {
      const st = effectiveInvoiceStatus(inv, today);
      if (status !== "all" && st !== status) return false;
      if (!query) return true;
      const hay = [inv.number, inv.data.customer.name, inv.data.vendor.name, inv.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [invoices, status, q, today]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("invoices")}</h1>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <FilePlus2 className="size-4" /> {t("createInvoice")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              status === s ? "bg-emerald-50 text-emerald-800" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {s === "all" ? t("all") : t(s)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder={t("searchInvoice")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!list.length ? (
        <EmptyState
          title={t("noInvoices")}
          hint={t("noInvoicesHint")}
          action={
            <Link href="/invoices/new" className="btn-primary">
              {t("createInvoice")}
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((inv) => {
            const st = effectiveInvoiceStatus(inv, today);
            const total = computeTotals(toGeneratedData(inv.data)).total;
            return (
              <li key={inv.id}>
                <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {inv.data.customer.name || inv.number}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono">{inv.number}</span> · {inv.data.date} · {t(st)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{format(total, inv.data.currency)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
