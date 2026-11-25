"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, PiggyBank, ReceiptText } from "lucide-react";
import { FastAddDialog } from "@/components/fast-add-dialog";
import { EmptyState } from "@/components/empty-state";
import { useLedger } from "@/lib/store";
import { todayISO } from "@/lib/receipt";
import { effectiveInvoiceStatus } from "@/lib/types";
import type { ReportPeriod } from "@/lib/types";

export default function HomePage() {
  const {
    ready,
    t,
    format,
    budget,
    activityFor,
    invoices,
    txns,
    ensureDefaults,
    loadSample,
    profile,
    envelopeById,
  } = useLedger();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [dialog, setDialog] = useState<"spend" | "income" | null>(null);

  useEffect(() => {
    void ensureDefaults();
  }, [ensureDefaults]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  const activity = activityFor(period);
  const monthPrefix = todayISO().slice(0, 7);
  const collected = invoices
    .filter((i) => i.status === "paid" && (i.paidAt ?? i.data.date).startsWith(monthPrefix))
    .reduce((s, i) => s + (i.amountPaid || 0), 0);
  const outstanding = invoices
    .filter((i) => {
      const st = effectiveInvoiceStatus(i, todayISO());
      return st === "sent" || st === "overdue";
    })
    .reduce((s, i) => {
      const total = i.data.items.reduce((a, li) => a + li.quantity * li.unitPrice, 0);
      return s + Math.max(0, total - (i.amountPaid || 0));
    }, 0);
  const overdueCount = invoices.filter((i) => effectiveInvoiceStatus(i, todayISO()) === "overdue").length;
  const recent = [...txns].slice(0, 8);
  const empty = !txns.length && !invoices.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("overview")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("overviewHint")}</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {(["day", "week", "month"] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                period === p ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("readyToAssign")}</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">{format(budget.readyToAssign)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t("inIncomeLeft", { income: format(activity.income), left: format(activity.income - activity.spent) })}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("spent")}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{format(activity.spent)}</p>
          {budget.ageOfMoneyDays != null ? (
            <p className="mt-1 text-xs text-slate-500">{t("ageOfMoney", { days: Math.round(budget.ageOfMoneyDays) })}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => setDialog("spend")}>
          {t("spend")}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setDialog("income")}>
          {t("income")}
        </button>
        <Link href="/invoices/new" className="btn-secondary">
          <FilePlus2 className="size-4" /> {t("newInvoice")}
        </Link>
        <Link href="/budget" className="btn-ghost">
          <PiggyBank className="size-4" /> {t("fillEnvelopes")}
        </Link>
        <Link href="/receipts/new" className="btn-ghost">
          <ReceiptText className="size-4" /> {t("generateReceipt")}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("collectedThisMonth")} value={format(collected)} />
        <Stat label={t("spentThisMonth")} value={format(activityFor("month").spent)} />
        <Stat
          label={t("outstanding")}
          value={format(outstanding)}
          hint={overdueCount ? t("overdueN", { count: overdueCount }) : undefined}
        />
      </div>

      {Object.keys(activity.byEnvelope).length > 0 ? (
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900">{t("whereItWent")}</p>
          <SpendBars
            slices={Object.entries(activity.byEnvelope)
              .map(([id, value]) => ({
                id,
                value,
                label: envelopeById(id)?.name ?? t("other"),
                color: envelopeById(id)?.color ?? 0xff64748b,
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)}
            total={activity.spent}
            format={format}
          />
        </div>
      ) : null}

      {!profile.name ? (
        <Link href="/settings" className="card block border-emerald-200 bg-emerald-50/50 p-4 transition hover:bg-emerald-50">
          <p className="font-medium text-emerald-900">{t("addBusiness")}</p>
          <p className="mt-0.5 text-sm text-emerald-800/70">{t("addBusinessHint")}</p>
        </Link>
      ) : null}

      {empty ? (
        <EmptyState
          title={t("startBooks")}
          hint={t("startBooksHint")}
          action={
            <>
              <Link href="/invoices/new" className="btn-primary">
                {t("createInvoice")}
              </Link>
              <button type="button" className="btn-secondary" onClick={() => void loadSample()}>
                {t("loadSample")}
              </button>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">{t("recentActivity")}</h2>
            <Link href="/activity" className="text-sm text-emerald-700 hover:underline">
              {t("seeAllActivity")} <ArrowRight className="inline size-3.5" />
            </Link>
          </div>
          <ul className="card divide-y divide-slate-100">
            {recent.map((txn) => (
              <li key={txn.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{txn.payee || t(txn.kind)}</p>
                  <p className="text-xs text-slate-500">
                    {txn.date} · {t(txn.kind)}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    txn.kind === "income" ? "text-emerald-700" : "text-slate-800"
                  }`}
                >
                  {txn.kind === "income" ? "+" : txn.kind === "expense" ? "−" : ""}
                  {format(txn.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FastAddDialog open={dialog === "spend"} mode="spend" onClose={() => setDialog(null)} />
      <FastAddDialog open={dialog === "income"} mode="income" onClose={() => setDialog(null)} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-amber-700">{hint}</p> : null}
    </div>
  );
}

function SpendBars({
  slices,
  total,
  format,
}: {
  slices: { id: string; value: number; label: string; color: number }[];
  total: number;
  format: (n: number) => string;
}) {
  return (
    <ul className="mt-4 space-y-3">
      {slices.map((s) => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
        const hex = `#${(s.color >>> 0).toString(16).padStart(8, "0").slice(2)}`;
        return (
          <li key={s.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-slate-700">{s.label}</span>
              <span className="tabular-nums text-slate-500">
                {format(s.value)} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: hex }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
