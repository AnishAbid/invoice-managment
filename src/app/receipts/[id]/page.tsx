"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileImage, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { ReceiptDocument } from "@/components/receipt-document";
import { deleteReceipt, getReceiptFile } from "@/lib/db";
import { downloadAsPDF, downloadAsPNG, downloadBlob, printElement, printFile } from "@/lib/export";
import { formatDate, formatMoney } from "@/lib/receipt";
import { useReceipt } from "@/lib/use-receipt";
import type { GeneratedReceipt, UploadedReceipt } from "@/lib/types";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const receipt = useReceipt(id);

  if (receipt === undefined) return <div className="py-20 text-center text-sm text-slate-500">Loading…</div>;
  if (receipt === null)
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Receipt not found. <Link href="/" className="text-emerald-700 underline">Back to receipts</Link>
      </div>
    );

  async function handleDelete() {
    if (!confirm("Delete this receipt permanently?")) return;
    await deleteReceipt(id);
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All receipts
      </Link>
      {receipt.kind === "generated" ? (
        <GeneratedView receipt={receipt} onDelete={handleDelete} />
      ) : (
        <UploadedView receipt={receipt} onDelete={handleDelete} />
      )}
    </div>
  );
}

function GeneratedView({ receipt, onDelete }: { receipt: GeneratedReceipt; onDelete: () => void }) {
  const docRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const filename = `${receipt.data.receiptNumber}-${receipt.title}`.replace(/[^\w؀-ۿ-]+/g, "_");

  async function run(kind: "pdf" | "png") {
    if (!docRef.current) return;
    setBusy(kind);
    try {
      await (kind === "pdf" ? downloadAsPDF : downloadAsPNG)(docRef.current, filename);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" dir="auto">{receipt.title}</h1>
          <p className="text-sm text-slate-500">
            <span className="font-mono">{receipt.data.receiptNumber}</span> · {formatDate(receipt.date)} ·{" "}
            {formatMoney(receipt.total, receipt.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => run("pdf")} disabled={!!busy}>
            {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} PDF
          </button>
          <button className="btn-secondary" onClick={() => run("png")} disabled={!!busy}>
            {busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />} Image
          </button>
          <button className="btn-secondary" onClick={() => docRef.current && printElement(docRef.current, filename)}>
            <Printer className="size-4" /> Print
          </button>
          <Link href={`/receipts/${receipt.id}/edit`} className="btn-secondary">
            <Pencil className="size-4" /> Edit
          </Link>
          <button className="btn-danger" onClick={onDelete} aria-label="Delete">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <div className="min-w-[600px]">
          <ReceiptDocument ref={docRef} data={receipt.data} />
        </div>
      </div>
    </>
  );
}

function UploadedView({ receipt, onDelete }: { receipt: UploadedReceipt; onDelete: () => void }) {
  const [file, setFile] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    let objectUrl = "";
    getReceiptFile(receipt.id).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setFile(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [receipt.id]);

  const isPdf = receipt.file.type === "application/pdf";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" dir="auto">{receipt.title}</h1>
          <p className="text-sm text-slate-500">
            {formatDate(receipt.date)}
            {receipt.total > 0 && <> · {formatMoney(receipt.total, receipt.currency)}</>}
            {receipt.category && <> · {receipt.category}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={!file} onClick={() => file && downloadBlob(file, receipt.file.name)}>
            <Download className="size-4" /> Download
          </button>
          <button className="btn-secondary" disabled={!file} onClick={() => file && printFile(file)}>
            <Printer className="size-4" /> Print
          </button>
          <button className="btn-danger" onClick={onDelete} aria-label="Delete">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {receipt.notes && (
        <div className="card p-4 text-sm whitespace-pre-line text-slate-700" dir="auto">{receipt.notes}</div>
      )}
      <div className="card flex justify-center overflow-hidden bg-slate-100 p-4">
        {!url ? (
          <div className="py-20 text-sm text-slate-500">Loading file…</div>
        ) : isPdf ? (
          <iframe src={url} title={receipt.file.name} className="h-[80vh] w-full rounded-lg bg-white" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={receipt.title} className="max-h-[80vh] rounded-lg object-contain shadow" />
        )}
      </div>
    </>
  );
}
