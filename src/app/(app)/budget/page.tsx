"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Plus, Search, Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useLedger } from "@/lib/store";

export default function BudgetPage() {
  const { ready, t, format, budget, envelopes, fillEnvelope, moveBetweenEnvelopes } = useLedger();
  const [q, setQ] = useState("");
  const [fillId, setFillId] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return envelopes
      .filter((e) => !e.archived)
      .filter((e) => !query || e.name.toLowerCase().includes(query) || e.group.toLowerCase().includes(query));
  }, [envelopes, q]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  async function doFill(e: React.FormEvent) {
    e.preventDefault();
    if (!fillId) return;
    const n = Number(amount);
    if (!n) return;
    await fillEnvelope({ amount: n, envelopeId: fillId, notes });
    setFillId(null);
    setAmount("");
    setNotes("");
  }

  async function doMove(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || !fromId || !toId) return;
    await moveBetweenEnvelopes({ amount: n, fromId, toId, notes });
    setMoveOpen(false);
    setAmount("");
    setNotes("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("budget")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("readyToAssign")}: <span className="font-medium text-emerald-800">{format(budget.readyToAssign)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/budget/envelopes/new" className="btn-primary">
            <Plus className="size-4" /> {t("addEnvelope")}
          </Link>
          <Link href="/budget/recurring" className="btn-secondary">
            {t("recurring")}
          </Link>
          <button type="button" className="btn-ghost" onClick={() => setMoveOpen(true)}>
            <ArrowLeftRight className="size-4" /> {t("moveMoney")}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder={t("searchEnvelopes")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {!list.length ? (
        <EmptyState
          title={t("noEnvelopes")}
          hint={t("noEnvelopesHint")}
          action={
            <Link href="/budget/envelopes/new" className="btn-primary">
              {t("addEnvelope")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {list.map((env) => {
            const left = budget.envelopeAvailable[env.id] ?? 0;
            const spent = budget.envelopeSpent[env.id] ?? 0;
            return (
              <li key={env.id} className="card flex flex-wrap items-center gap-3 px-4 py-3">
                <Link href={`/budget/envelopes/${env.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
                    style={{ backgroundColor: `#${(env.color >>> 0).toString(16).slice(-6)}` }}
                  >
                    <Wallet className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{env.name}</p>
                    <p className="text-xs text-slate-500">
                      {env.group} · {t("spentAmount", { amount: format(spent) })}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold tabular-nums ${left < 0 ? "text-red-600" : "text-emerald-800"}`}>
                    {left < 0 ? t("overspent", { amount: format(-left) }) : t("left", { amount: format(left) })}
                  </span>
                  <button type="button" className="btn-secondary" onClick={() => { setFillId(env.id); setAmount(""); }}>
                    {t("fill")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {fillId ? (
        <Dialog title={t("fill")} onClose={() => setFillId(null)} onSubmit={doFill} t={t}>
          <Field label={t("amount")}>
            <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <Field label={t("notes")}>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </Dialog>
      ) : null}

      {moveOpen ? (
        <Dialog title={t("moveMoney")} onClose={() => setMoveOpen(false)} onSubmit={doMove} t={t}>
          <Field label={t("fromEnvelope")}>
            <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">—</option>
              {envelopes.filter((e) => !e.archived).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("toEnvelope")}>
            <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">—</option>
              {envelopes.filter((e) => !e.archived).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("amount")}>
            <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </Dialog>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
  onSubmit,
  t,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={onClose}>
      <form className="card w-full max-w-md space-y-4 p-5" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>{t("cancel")}</button>
          <button type="submit" className="btn-primary">{t("save")}</button>
        </div>
      </form>
    </div>
  );
}
