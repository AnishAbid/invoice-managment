"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLedger } from "@/lib/store";
import { todayISO } from "@/lib/receipt";

type Mode = "spend" | "income";

export function FastAddDialog({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: Mode;
  onClose: () => void;
}) {
  const { t, accounts, envelopes, addIncome, addExpenseTxn, ensureDefaults } = useLedger();
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void ensureDefaults().then(() => {
      /* refresh updates accounts via store */
    });
    setAmount("");
    setPayee("");
    setNotes("");
    setDate(todayISO());
    setError("");
  }, [open, ensureDefaults]);

  useEffect(() => {
    if (!open) return;
    const first = accounts.find((a) => !a.archived);
    if (first && !accountId) setAccountId(first.id);
    const env = envelopes.find((e) => !e.archived);
    if (env && !envelopeId) setEnvelopeId(env.id);
  }, [open, accounts, envelopes, accountId, envelopeId]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return setError("Enter an amount");
    if (!accountId) return setError("Pick an account");
    setBusy(true);
    setError("");
    try {
      if (mode === "income") {
        await addIncome({ amount: n, accountId, payee, notes, date });
      } else {
        await addExpenseTxn({
          amount: n,
          accountId,
          envelopeId: envelopeId || undefined,
          payee,
          notes,
          date,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={onClose}>
      <form
        className="card w-full max-w-md space-y-4 p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{mode === "income" ? t("addIncome") : t("addExpense")}</h2>
          <button type="button" className="btn-ghost p-2" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div>
          <label className="label">{t("amount")}</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">{t("payee")}</label>
          <input className="input" value={payee} onChange={(e) => setPayee(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("account")}</label>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        {mode === "spend" ? (
          <div>
            <label className="label">{t("envelope")}</label>
            <select className="input" value={envelopeId} onChange={(e) => setEnvelopeId(e.target.value)}>
              <option value="">—</option>
              {envelopes.filter((e) => !e.archived).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
