"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { FastAddDialog } from "@/components/fast-add-dialog";
import { useLedger } from "@/lib/store";
import type { TxnKind } from "@/lib/types";

const KINDS: (TxnKind | "all")[] = ["all", "expense", "income", "transfer", "assign", "move"];

export default function ActivityPage() {
  const { ready, t, format, txns, envelopeById, accountById, activeMember } = useLedger();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<"spend" | "income" | null>(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return txns.filter((txn) => {
      if (kind !== "all" && txn.kind !== kind) return false;
      if (!query) return true;
      const hay = [txn.payee, txn.notes, envelopeById(txn.envelopeId)?.name, accountById(txn.accountId)?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [txns, kind, q, envelopeById, accountById]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("activity")}</h1>
          {activeMember ? (
            <p className="mt-1 text-sm text-slate-500">{t("loggingAs", { name: activeMember.name })}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={() => setDialog("spend")}>
            <Plus className="size-4" /> {t("spend")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setDialog("income")}>
            {t("income")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              kind === k ? "bg-emerald-50 text-emerald-800" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {k === "all" ? t("all") : t(k)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder={t("searchPayee")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!list.length ? (
        <EmptyState
          title={t("noActivity")}
          hint={t("noActivityHint")}
          action={
            <button type="button" className="btn-primary" onClick={() => setDialog("spend")}>
              {t("addExpense")}
            </button>
          }
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((txn) => (
            <li key={txn.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{txn.payee || t(txn.kind)}</p>
                <p className="text-xs text-slate-500">
                  {txn.date} · {t(txn.kind)}
                  {txn.envelopeId ? ` · ${envelopeById(txn.envelopeId)?.name ?? ""}` : ""}
                  {txn.accountId ? ` · ${accountById(txn.accountId)?.name ?? ""}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 font-semibold tabular-nums ${
                  txn.kind === "income" ? "text-emerald-700" : "text-slate-800"
                }`}
              >
                {txn.kind === "income" ? "+" : txn.kind === "expense" ? "−" : ""}
                {format(txn.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <FastAddDialog open={dialog === "spend"} mode="spend" onClose={() => setDialog(null)} />
      <FastAddDialog open={dialog === "income"} mode="income" onClose={() => setDialog(null)} />
    </div>
  );
}
