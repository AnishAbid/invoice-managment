"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { newId, todayISO } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { KhataKind } from "@/lib/types";

export default function KhataPartyPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, t, format, clients, khata, khataBalances, saveKhata, currency, activeMember } = useLedger();
  const client = clients.find((c) => c.id === id);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<KhataKind>("got");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [billNo, setBillNo] = useState("");

  const entries = useMemo(() => khata.filter((e) => e.partyId === id), [khata, id]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!client) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/khata" className="text-emerald-700 underline">{t("khata")}</Link>
      </div>
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n) return;
    await saveKhata({
      id: newId(),
      partyId: id,
      kind,
      amount: n,
      currency,
      date,
      notes,
      billNo,
      memberId: activeMember?.id,
      createdAt: Date.now(),
    });
    setOpen(false);
    setAmount("");
    setNotes("");
    setBillNo("");
  }

  const bal = khataBalances.byParty[id] ?? 0;

  return (
    <div className="space-y-5">
      <Link href="/khata" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("khata")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-sm text-slate-500">
            {t("balance")}: {format(bal)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            {t("print")}
          </button>
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> {t("addEntry")}
          </button>
        </div>
      </div>
      <ul className="card divide-y divide-slate-100">
        {entries.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No entries yet</li>
        ) : (
          entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t(e.kind)}</p>
                <p className="text-xs text-slate-500">
                  {e.date}
                  {e.billNo ? ` · #${e.billNo}` : ""}
                  {e.notes ? ` · ${e.notes}` : ""}
                </p>
              </div>
              <span className={`font-semibold ${e.kind === "got" ? "text-emerald-700" : "text-red-600"}`}>
                {e.kind === "got" ? "+" : "−"}
                {format(e.amount)}
              </span>
            </li>
          ))
        )}
      </ul>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form className="card w-full max-w-md space-y-3 p-5" onClick={(ev) => ev.stopPropagation()} onSubmit={add}>
            <h2 className="text-lg font-semibold">{t("addEntry")}</h2>
            <div className="flex gap-2">
              <button type="button" className={`btn flex-1 ${kind === "got" ? "btn-primary" : "btn-secondary"}`} onClick={() => setKind("got")}>
                {t("got")}
              </button>
              <button type="button" className={`btn flex-1 ${kind === "gave" ? "btn-primary" : "btn-secondary"}`} onClick={() => setKind("gave")}>
                {t("gave")}
              </button>
            </div>
            <div>
              <label className="label">{t("amount")}</label>
              <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("date")}</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Bill no.</label>
                <input className="input" value={billNo} onChange={(e) => setBillNo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">{t("notes")}</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
