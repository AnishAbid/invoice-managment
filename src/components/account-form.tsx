"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { newId } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import { ACCOUNT_KIND_LABEL, type AccountKind, type MoneyAccount } from "@/lib/types";

export function AccountForm({ existing }: { existing?: MoneyAccount }) {
  const router = useRouter();
  const { t, currency, saveAccount } = useLedger();
  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState<AccountKind>(existing?.kind ?? "cash");
  const [openingBalance, setOpeningBalance] = useState(String(existing?.openingBalance ?? 0));
  const [last4, setLast4] = useState(existing?.last4 ?? "");
  const [creditLimit, setCreditLimit] = useState(String(existing?.creditLimit ?? 0));
  const [network, setNetwork] = useState(existing?.network ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const now = Date.now();
    const acct: MoneyAccount = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      kind,
      openingBalance: Number(openingBalance) || 0,
      currency: existing?.currency ?? currency,
      archived: existing?.archived ?? false,
      last4,
      creditLimit: Number(creditLimit) || 0,
      network,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveAccount(acct);
    router.push(`/accounts/${acct.id}`);
  }

  return (
    <form className="card mx-auto max-w-lg space-y-4 p-5" onSubmit={submit}>
      <div>
        <label className="label">{t("name")}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">{t("kind")}</label>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
          {(Object.keys(ACCOUNT_KIND_LABEL) as AccountKind[]).map((k) => (
            <option key={k} value={k}>
              {ACCOUNT_KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t("openingBalance")}</label>
        <input className="input" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
      </div>
      {kind === "credit" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t("creditLimit")}</label>
            <input className="input" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("last4")}</label>
            <input className="input" value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">{t("network")}</label>
            <input className="input" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Visa / Mastercard" />
          </div>
        </div>
      ) : null}
      <button type="submit" className="btn-primary" disabled={busy}>
        <Save className="size-4" /> {t("save")}
      </button>
    </form>
  );
}
