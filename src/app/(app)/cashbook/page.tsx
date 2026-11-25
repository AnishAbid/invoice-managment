"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { newId, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { CashBookKind } from "@/lib/types";

export default function CashbookPage() {
  const { ready, t, format, cashbook, accounts, saveCashbook, currency, activeMember, ensureDefaults } = useLedger();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CashBookKind>("cashIn");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState("");

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await ensureDefaults();
    const n = Number(amount);
    const acct = accountId || accounts.find((a) => a.kind === "cash" && !a.archived)?.id || accounts[0]?.id;
    if (!n || !acct) return;
    await saveCashbook({
      id: newId(),
      kind,
      amount: n,
      currency,
      date,
      notes,
      accountId: acct,
      memberId: activeMember?.id,
      createdAt: Date.now(),
    });
    setOpen(false);
    setAmount("");
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("cashBook")}</h1>
          <p className="text-sm text-slate-500">{t("cashBookMoreHint")}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> {t("addEntry")}
        </button>
      </div>
      {!cashbook.length ? (
        <EmptyState title="No cash entries" action={<button type="button" className="btn-primary" onClick={() => setOpen(true)}>{t("addEntry")}</button>} />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {cashbook.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t(e.kind)}</p>
                <p className="text-xs text-slate-500">
                  {e.date}
                  {e.notes ? ` · ${e.notes}` : ""}
                </p>
              </div>
              <span className={`font-semibold ${e.kind === "cashIn" ? "text-emerald-700" : "text-slate-800"}`}>
                {e.kind === "cashIn" ? "+" : "−"}
                {format(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form className="card w-full max-w-md space-y-3 p-5" onClick={(ev) => ev.stopPropagation()} onSubmit={add}>
            <h2 className="text-lg font-semibold">{t("addEntry")}</h2>
            <div className="flex gap-2">
              <button type="button" className={`btn flex-1 ${kind === "cashIn" ? "btn-primary" : "btn-secondary"}`} onClick={() => setKind("cashIn")}>
                {t("cashIn")}
              </button>
              <button type="button" className={`btn flex-1 ${kind === "cashOut" ? "btn-primary" : "btn-secondary"}`} onClick={() => setKind("cashOut")}>
                {t("cashOut")}
              </button>
            </div>
            <div>
              <label className="label">{t("amount")}</label>
              <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t("account")}</label>
              <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Cash (default)</option>
                {accounts.filter((a) => !a.archived).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("date")}</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">{t("notes")}</label>
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>{t("cancel")}</button>
              <button type="submit" className="btn-primary">{t("save")}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
