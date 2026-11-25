"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ACCOUNT_KIND_LABEL } from "@/lib/types";
import { useLedger } from "@/lib/store";

export default function AccountsPage() {
  const { ready, t, format, accounts, budget, transfer } = useLedger();
  const [xfer, setXfer] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  const list = accounts.filter((a) => !a.archived);

  async function doTransfer(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || !fromId || !toId) return;
    await transfer({ amount: n, fromId, toId, notes });
    setXfer(false);
    setAmount("");
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("accounts")}</h1>
          <p className="text-sm text-slate-500">
            {t("netWorth")}: {format(budget.netWorth)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounts/new" className="btn-primary">
            <Plus className="size-4" /> Add
          </Link>
          <button type="button" className="btn-secondary" onClick={() => setXfer(true)}>
            <ArrowLeftRight className="size-4" /> {t("transferMoney")}
          </button>
        </div>
      </div>
      {!list.length ? (
        <EmptyState title="No accounts" action={<Link href="/accounts/new" className="btn-primary">Add account</Link>} />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((a) => (
            <li key={a.id}>
              <Link href={`/accounts/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">{ACCOUNT_KIND_LABEL[a.kind]}</p>
                </div>
                <span className="font-semibold tabular-nums">{format(budget.accountBalances[a.id] ?? a.openingBalance)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {xfer ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setXfer(false)}>
          <form className="card w-full max-w-md space-y-3 p-5" onClick={(e) => e.stopPropagation()} onSubmit={doTransfer}>
            <h2 className="text-lg font-semibold">{t("transferMoney")}</h2>
            <div>
              <label className="label">{t("fromAccount")}</label>
              <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                <option value="">—</option>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("toAccount")}</label>
              <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
                <option value="">—</option>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("amount")}</label>
              <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t("notes")}</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setXfer(false)}>{t("cancel")}</button>
              <button type="submit" className="btn-primary">{t("save")}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
