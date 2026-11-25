"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { useLedger } from "@/lib/store";

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const { t, expenses, ready } = useLedger();
  const exp = expenses.find((e) => e.id === id);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!exp) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/expenses" className="text-emerald-700 underline">{t("expenses")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/expenses/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {exp.vendor}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("edit")} {t("expense")}
      </h1>
      <ExpenseForm existing={exp} />
    </div>
  );
}
