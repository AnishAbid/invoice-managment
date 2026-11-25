"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccountForm } from "@/components/account-form";
import { useLedger } from "@/lib/store";

export default function NewAccountPage() {
  const { t } = useLedger();
  return (
    <div className="space-y-5">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("accounts")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Add account</h1>
      <AccountForm />
    </div>
  );
}
