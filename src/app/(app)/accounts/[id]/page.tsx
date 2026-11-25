"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ACCOUNT_KIND_LABEL } from "@/lib/types";
import { useLedger } from "@/lib/store";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, t, format, accounts, budget, removeAccount } = useLedger();
  const acct = accounts.find((a) => a.id === id);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!acct) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/accounts" className="text-emerald-700 underline">{t("accounts")}</Link>
      </div>
    );
  }

  async function onDelete() {
    if (!confirm("Delete this account?")) return;
    await removeAccount(id);
    router.push("/accounts");
  }

  const bal = budget.accountBalances[id] ?? acct.openingBalance;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("accounts")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{acct.name}</h1>
          <p className="text-sm text-slate-500">{ACCOUNT_KIND_LABEL[acct.kind]}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/accounts/${id}/edit`} className="btn-secondary">
            <Pencil className="size-4" /> {t("edit")}
          </Link>
          <button type="button" className="btn-danger" onClick={() => void onDelete()}>
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-xs text-slate-500">{t("balance")}</p>
        <p className="mt-1 text-3xl font-semibold text-emerald-800">{format(bal)}</p>
      </div>
      <div className="card space-y-2 p-4 text-sm">
        <Row label={t("openingBalance")} value={format(acct.openingBalance)} />
        {acct.last4 ? <Row label={t("last4")} value={acct.last4} /> : null}
        {acct.creditLimit ? <Row label={t("creditLimit")} value={format(acct.creditLimit)} /> : null}
        {acct.network ? <Row label={t("network")} value={acct.network} /> : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
