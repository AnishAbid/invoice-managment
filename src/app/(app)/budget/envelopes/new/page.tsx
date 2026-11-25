"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { newId } from "@/lib/receipt";
import { useLedger } from "@/lib/store";

export default function NewEnvelopePage() {
  const router = useRouter();
  const { t, saveEnvelope, envelopes } = useLedger();
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Everyday");
  const [color, setColor] = useState("#059669");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const now = Date.now();
    const id = newId();
    await saveEnvelope({
      id,
      name: name.trim(),
      group: group.trim() || "Everyday",
      color: parseInt(color.replace("#", ""), 16) | 0xff000000,
      archived: false,
      sort: envelopes.length,
      createdAt: now,
      updatedAt: now,
    });
    router.push("/budget");
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/budget" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("budget")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{t("addEnvelope")}</h1>
      <form className="card space-y-4 p-5" onSubmit={submit}>
        <div>
          <label className="label">{t("name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="label">Group</label>
          <input className="input" value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
        <div>
          <label className="label">Color</label>
          <input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-slate-300" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Save className="size-4" /> {t("save")}
        </button>
      </form>
    </div>
  );
}
