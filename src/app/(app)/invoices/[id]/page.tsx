"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt-preview";
import { toGeneratedData } from "@/lib/document";
import { downloadAsPDF, printElement } from "@/lib/export";
import { computeTotals, formatDate } from "@/lib/receipt";
import { getTemplate } from "@/lib/templates";
import { useLedger } from "@/lib/store";
import { todayISO } from "@/lib/receipt";
import { effectiveInvoiceStatus } from "@/lib/types";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, format, invoices, saveInvoice, removeInvoice, markInvoicePaid, ready } = useLedger();
  const inv = invoices.find((i) => i.id === id);
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;
  if (!inv) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Not found. <Link href="/invoices" className="text-emerald-700 underline">{t("invoices")}</Link>
      </div>
    );
  }

  const data = toGeneratedData(inv.data);
  const totals = computeTotals(data);
  const st = effectiveInvoiceStatus(inv, todayISO());
  const template = getTemplate(inv.data.template);
  const filename = `${inv.number}-${inv.data.customer.name || "invoice"}`.replace(/[^\w؀-ۿ-]+/g, "_");

  async function markSent() {
    await saveInvoice({ ...inv!, status: "sent", updatedAt: Date.now() });
  }

  async function markPaid() {
    setBusy(true);
    try {
      await markInvoicePaid(inv!);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this invoice?")) return;
    await removeInvoice(id);
    router.push("/invoices");
  }

  async function download() {
    if (!docRef.current) return;
    setBusy(true);
    try {
      await downloadAsPDF(docRef.current, filename, template.paper);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("invoices")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{inv.data.customer.name || inv.number}</h1>
          <p className="text-sm text-slate-500">
            <span className="font-mono">{inv.number}</span> · {formatDate(inv.data.date)} · {t(st)} ·{" "}
            {format(totals.total, inv.data.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {st === "draft" ? (
            <button type="button" className="btn-secondary" onClick={() => void markSent()}>
              {t("markSent")}
            </button>
          ) : null}
          {st !== "paid" && st !== "cancelled" ? (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void markPaid()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("markPaid")}
            </button>
          ) : null}
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void download()}>
            <Download className="size-4" /> {t("downloadPdf")}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => docRef.current && printElement(docRef.current, filename, template.paper)}
          >
            <Printer className="size-4" /> {t("print")}
          </button>
          <Link href={`/invoices/${id}/edit`} className="btn-secondary">
            <Pencil className="size-4" /> {t("edit")}
          </Link>
          <button type="button" className="btn-danger" onClick={() => void onDelete()}>
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className={template.paper === "thermal" ? "" : "min-w-[600px]"}>
          <ReceiptPreview docRef={docRef} data={data} />
        </div>
      </div>
    </div>
  );
}
