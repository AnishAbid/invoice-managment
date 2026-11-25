"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useLedger } from "@/lib/store";

export default function ExpensesPage() {
  const { ready, t, format, expenses } = useLedger();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return expenses.filter((e) => {
      if (!query) return true;
      return [e.vendor, e.category, e.notes].join(" ").toLowerCase().includes(query);
    });
  }, [expenses, q]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("expenses")}</h1>
        <Link href="/expenses/new" className="btn-primary">
          <Plus className="size-4" /> {t("addExpense")}
        </Link>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder={t("searchVendor")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!list.length ? (
        <EmptyState
          title={t("noExpenses")}
          hint={t("noExpensesHint")}
          action={
            <Link href="/expenses/new" className="btn-primary">
              {t("addExpense")}
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((e) => (
            <li key={e.id}>
              <Link href={`/expenses/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.vendor}</p>
                  <p className="text-xs text-slate-500">
                    {e.date}
                    {e.category ? ` · ${e.category}` : ""}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{format(e.amount, e.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
