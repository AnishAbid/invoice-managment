"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useLedger } from "@/lib/store";

export default function KhataPage() {
  const { ready, t, format, clients, khataBalances } = useLedger();

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  const parties = clients;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("khata")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("toGet")}: {format(khataBalances.toGet)} · {t("toGive")}: {format(khataBalances.toGive)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t("toGet")}</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800">{format(khataBalances.toGet)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t("toGive")}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{format(khataBalances.toGive)}</p>
        </div>
      </div>
      {!clients.length ? (
        <EmptyState
          title={t("noClients")}
          hint={t("noClientsHint")}
          action={
            <Link href="/clients" className="btn-primary">
              {t("addClient")}
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {parties.map((c) => {
            const bal = khataBalances.byParty[c.id] ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/khata/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold tabular-nums ${bal > 0 ? "text-emerald-700" : bal < 0 ? "text-red-600" : "text-slate-600"}`}>
                      {format(bal)}
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
