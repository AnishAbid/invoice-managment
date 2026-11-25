"use client";

import { useMemo } from "react";
import { toGeneratedData } from "@/lib/document";
import { computeTotals, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";

export default function ReportsPage() {
  const { ready, t, format, budget, activityFor, invoices, expenses, envelopes } = useLedger();

  const month = activityFor("month");
  const monthPrefix = todayISO().slice(0, 7);

  const collected = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "paid" && (i.paidAt ?? i.data.date).startsWith(monthPrefix))
        .reduce((s, i) => s + (i.amountPaid || computeTotals(toGeneratedData(i.data)).total), 0),
    [invoices, monthPrefix],
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      if (!e.date.startsWith(monthPrefix)) continue;
      const key = e.category || t("other");
      map[key] = (map[key] ?? 0) + e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses, monthPrefix, t]);

  const byEnvelope = useMemo(() => {
    return Object.entries(month.byEnvelope)
      .map(([id, amt]) => [envelopes.find((e) => e.id === id)?.name ?? t("other"), amt] as const)
      .sort((a, b) => b[1] - a[1]);
  }, [month.byEnvelope, envelopes, t]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("reports")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("reportsHint")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("collectedThisMonth")} value={format(collected)} />
        <Stat label={t("spentThisMonth")} value={format(month.spent)} />
        <Stat label={t("netWorth")} value={format(budget.netWorth)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">{t("whereItWent")} — envelopes</h2>
        <ul className="card divide-y divide-slate-100">
          {!byEnvelope.length ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">—</li>
          ) : (
            byEnvelope.map(([name, amt]) => (
              <li key={name} className="flex justify-between px-4 py-3 text-sm">
                <span>{name}</span>
                <span className="font-medium tabular-nums">{format(amt)}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">{t("whereItWent")} — categories</h2>
        <ul className="card divide-y divide-slate-100">
          {!byCategory.length ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">—</li>
          ) : (
            byCategory.map(([name, amt]) => (
              <li key={name} className="flex justify-between px-4 py-3 text-sm">
                <span>{name}</span>
                <span className="font-medium tabular-nums">{format(amt)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
