"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/invoice-form";
import { useLedger } from "@/lib/store";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { t, invoices, ready } = useLedger();
  const inv = invoices.find((i) => i.id === id);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!inv) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/invoices" className="text-emerald-700 underline">{t("invoices")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/invoices/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {inv.number}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("edit")} {inv.number}
      </h1>
      <InvoiceForm existing={inv} />
    </div>
  );
}
