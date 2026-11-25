"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useLedger } from "@/lib/store";

export default function EditEnvelopePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, format, budget, envelopes, saveEnvelope, removeEnvelope, ready } = useLedger();
  const env = envelopes.find((e) => e.id === id);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [archived, setArchived] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!env) return;
    setName(env.name);
    setGroup(env.group);
    setArchived(env.archived);
  }, [env]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!env) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/budget" className="text-emerald-700 underline">{t("budget")}</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await saveEnvelope({
      ...env!,
      name: name.trim() || env!.name,
      group: group.trim() || env!.group,
      archived,
      updatedAt: Date.now(),
    });
    router.push("/budget");
  }

  async function onDelete() {
    if (!confirm("Delete this envelope?")) return;
    await removeEnvelope(id);
    router.push("/budget");
  }

  const left = budget.envelopeAvailable[id] ?? 0;
  const spent = budget.envelopeSpent[id] ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/budget" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("budget")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{env.name}</h1>
      <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t("left", { amount: "" }).replace(/\s*$/, "")}</p>
          <p className="font-semibold text-emerald-800">{format(left)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Spent</p>
          <p className="font-semibold">{format(spent)}</p>
        </div>
      </div>
      <form className="card space-y-4 p-5" onSubmit={submit}>
        <div>
          <label className="label">{t("name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Group</label>
          <input className="input" value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Archived
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            <Save className="size-4" /> {t("save")}
          </button>
          <button type="button" className="btn-danger" onClick={onDelete}>
            <Trash2 className="size-4" /> {t("delete")}
          </button>
        </div>
      </form>
    </div>
  );
}
