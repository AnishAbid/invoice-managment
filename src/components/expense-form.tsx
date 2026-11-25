"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import { CATEGORIES, CURRENCIES, newId, PAYMENT_METHODS, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { Currency, Expense, PaymentMethod } from "@/lib/types";

export function ExpenseForm({ existing }: { existing?: Expense }) {
  const router = useRouter();
  const { t, currency, accounts, saveExpense } = useLedger();
  const [vendor, setVendor] = useState(existing?.vendor ?? "");
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [cur, setCur] = useState<Currency>(existing?.currency ?? currency);
  const [category, setCategory] = useState(existing?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existing?.paymentMethod ?? "cash");
  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!vendor.trim()) return setError("Enter a vendor");
    if (!n || n <= 0) return setError("Enter an amount");
    setBusy(true);
    setError("");
    const now = Date.now();
    const exp: Expense = {
      id: existing?.id ?? newId(),
      vendor: vendor.trim(),
      date,
      amount: n,
      currency: cur,
      category,
      paymentMethod,
      accountId: accountId || undefined,
      notes,
      fileName: file?.name ?? existing?.fileName,
      fileMime: file?.type ?? existing?.fileMime,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveExpense(exp, file ?? undefined);
    router.push(`/expenses/${exp.id}`);
  }

  return (
    <form className="card mx-auto max-w-lg space-y-4 p-5" onSubmit={submit}>
      <div>
        <label className="label">{t("vendor")}</label>
        <input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t("date")}</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("amount")}</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t("category")}</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t("paymentMethod")}</label>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t("account")}</label>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">—</option>
            {accounts.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t("notes")}</label>
        <textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div>
        <label className="label">{t("attachFile")}</label>
        <label className="btn-secondary cursor-pointer">
          <Camera className="size-4" />
          {file?.name || existing?.fileName || t("capture")}
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        <Save className="size-4" /> {t("save")}
      </button>
    </form>
  );
}
