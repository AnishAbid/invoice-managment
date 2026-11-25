"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { useLedger } from "@/lib/store";

export default function NewExpensePage() {
  const { t } = useLedger();
  return (
    <div className="space-y-5">
      <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("expenses")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{t("addExpense")}</h1>
      <ExpenseForm />
    </div>
  );
}
