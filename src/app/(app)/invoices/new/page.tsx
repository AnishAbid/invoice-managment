"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/invoice-form";
import { useLedger } from "@/lib/store";

export default function NewInvoicePage() {
  const { t } = useLedger();
  return (
    <div className="space-y-5">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("invoices")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{t("createInvoice")}</h1>
      <InvoiceForm />
    </div>
  );
}
