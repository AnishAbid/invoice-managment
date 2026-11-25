"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { newId } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { Client, PartyRole } from "@/lib/types";

const blank = (): Omit<Client, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  role: "customer",
  openingBalance: 0,
});

export default function ClientsPage() {
  const { ready, t, format, clients, saveClient, removeClient } = useLedger();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Client | null>(null);
  const [draft, setDraft] = useState(blank());
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return clients.filter((c) => !query || [c.name, c.phone, c.email].join(" ").toLowerCase().includes(query));
  }, [clients, q]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  function startNew() {
    setEdit(null);
    setDraft(blank());
    setOpen(true);
  }

  function startEdit(c: Client) {
    setEdit(c);
    setDraft({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      notes: c.notes,
      role: c.role,
      openingBalance: c.openingBalance,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const now = Date.now();
    await saveClient({
      id: edit?.id ?? newId(),
      ...draft,
      name: draft.name.trim(),
      createdAt: edit?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("clients")}</h1>
        <button type="button" className="btn-primary" onClick={startNew}>
          <Plus className="size-4" /> {t("addClient")}
        </button>
      </div>
      <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!list.length ? (
        <EmptyState title={t("noClients")} hint={t("noClientsHint")} action={<button type="button" className="btn-primary" onClick={startNew}>{t("addClient")}</button>} />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => startEdit(c)}>
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.role}
                  {c.phone ? ` · ${c.phone}` : ""}
                  {c.openingBalance ? ` · ${format(c.openingBalance)}` : ""}
                </p>
              </button>
              <button
                type="button"
                className="btn-ghost text-red-600"
                onClick={() => confirm("Delete client?") && void removeClient(c.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <form className="card w-full max-w-md space-y-3 p-5" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{edit ? t("edit") : t("addClient")}</h2>
              <button type="button" className="btn-ghost p-2" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <Field label={t("name")}>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("phone")}>
                <input className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </Field>
              <Field label={t("email")}>
                <input className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </Field>
            </div>
            <Field label={t("address")}>
              <input className="input" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("role")}>
                <select className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as PartyRole })}>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              <Field label={t("openingBalance")}>
                <input
                  className="input"
                  type="number"
                  value={draft.openingBalance}
                  onChange={(e) => setDraft({ ...draft, openingBalance: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label={t("notes")}>
              <input className="input" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
