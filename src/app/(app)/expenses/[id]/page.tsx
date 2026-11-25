"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getExpenseFile } from "@/lib/db";
import { useLedger } from "@/lib/store";

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, format, expenses, removeExpense, ready } = useLedger();
  const exp = expenses.find((e) => e.id === id);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let url: string | undefined;
    getExpenseFile(id).then((blob) => {
      if (!blob) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!exp) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/expenses" className="text-emerald-700 underline">{t("expenses")}</Link>
      </div>
    );
  }

  async function onDelete() {
    if (!confirm("Delete this expense?")) return;
    await removeExpense(id);
    router.push("/expenses");
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("expenses")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exp.vendor}</h1>
          <p className="text-sm text-slate-500">
            {exp.date} · {format(exp.amount, exp.currency)}
            {exp.category ? ` · ${exp.category}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/expenses/${id}/edit`} className="btn-secondary">
            <Pencil className="size-4" /> {t("edit")}
          </Link>
          <button type="button" className="btn-danger" onClick={() => void onDelete()}>
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="card space-y-2 p-4 text-sm">
        <Row label={t("paymentMethod")} value={exp.paymentMethod.replace(/_/g, " ")} />
        {exp.notes ? <Row label={t("notes")} value={exp.notes} /> : null}
      </div>
      {preview ? (
        <div className="card overflow-hidden p-2">
          {exp.fileMime?.includes("pdf") ? (
            <a href={preview} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
              Open attached PDF
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Attachment" className="max-h-96 w-full object-contain" />
          )}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
