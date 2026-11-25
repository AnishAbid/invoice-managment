"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountForm } from "@/components/account-form";
import { useLedger } from "@/lib/store";

export default function EditAccountPage() {
  const { id } = useParams<{ id: string }>();
  const { t, accounts, ready } = useLedger();
  const acct = accounts.find((a) => a.id === id);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!acct) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/accounts" className="text-emerald-700 underline">{t("accounts")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/accounts/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {acct.name}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("edit")} {acct.name}
      </h1>
      <AccountForm existing={acct} />
    </div>
  );
}
