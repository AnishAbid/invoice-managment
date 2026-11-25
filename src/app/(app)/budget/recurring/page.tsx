"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { newId, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { RecurringFreq, TxnKind } from "@/lib/types";

export default function RecurringPage() {
  const { ready, t, format, recurring, accounts, envelopes, saveRecurring, removeRecurring, currency } = useLedger();
  const [show, setShow] = useState(false);
  const [kind, setKind] = useState<TxnKind>("expense");
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [accountId, setAccountId] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [freq, setFreq] = useState<RecurringFreq>("monthly");
  const [nextDate, setNextDate] = useState(todayISO());

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    const acct = accountId || accounts.find((a) => !a.archived)?.id;
    if (!n || !acct) return;
    const now = Date.now();
    await saveRecurring({
      id: newId(),
      kind,
      amount: n,
      currency,
      accountId: acct,
      envelopeId: envelopeId || undefined,
      payee,
      notes: "",
      freq,
      nextDate,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });
    setShow(false);
    setAmount("");
    setPayee("");
  }

  return (
    <div className="space-y-5">
      <Link href="/budget" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("budget")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("recurring")}</h1>
          <p className="text-sm text-slate-500">{t("recurringHint", { count: recurring.length })}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShow(true)}>
          <Plus className="size-4" /> {t("addRecurring")}
        </button>
      </div>

      {!recurring.length ? (
        <EmptyState title={t("noRecurring")} action={<button type="button" className="btn-primary" onClick={() => setShow(true)}>{t("addRecurring")}</button>} />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {recurring.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{r.payee || t(r.kind)}</p>
                <p className="text-xs text-slate-500">
                  {format(r.amount)} · {r.freq} · next {r.nextDate}
                  {!r.enabled ? " · off" : ""}
                </p>
              </div>
              <button type="button" className="btn-ghost text-red-600" onClick={() => void removeRecurring(r.id)}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {show ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setShow(false)}>
          <form className="card w-full max-w-md space-y-3 p-5" onClick={(e) => e.stopPropagation()} onSubmit={add}>
            <h2 className="text-lg font-semibold">{t("addRecurring")}</h2>
            <div>
              <label className="label">{t("kind")}</label>
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value as TxnKind)}>
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
              </select>
            </div>
            <div>
              <label className="label">{t("amount")}</label>
              <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t("payee")}</label>
              <input className="input" value={payee} onChange={(e) => setPayee(e.target.value)} />
            </div>
            <div>
              <label className="label">{t("account")}</label>
              <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Default</option>
                {accounts.filter((a) => !a.archived).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {kind === "expense" ? (
              <div>
                <label className="label">{t("envelope")}</label>
                <select className="input" value={envelopeId} onChange={(e) => setEnvelopeId(e.target.value)}>
                  <option value="">—</option>
                  {envelopes.filter((e) => !e.archived).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("frequency")}</label>
                <select className="input" value={freq} onChange={(e) => setFreq(e.target.value as RecurringFreq)}>
                  {(["daily", "weekly", "monthly", "yearly"] as RecurringFreq[]).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("nextDate")}</label>
                <input type="date" className="input" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>{t("cancel")}</button>
              <button type="submit" className="btn-primary">{t("save")}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
