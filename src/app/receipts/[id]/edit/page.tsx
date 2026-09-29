"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ReceiptForm } from "@/components/receipt-form";
import { useReceipt } from "@/lib/use-receipt";

export default function EditReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = useReceipt(id);

  if (receipt === undefined) return <div className="py-20 text-center text-sm text-slate-500">Loading…</div>;
  if (!receipt || receipt.kind !== "generated")
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        This receipt can&apos;t be edited. <Link href="/" className="text-emerald-700 underline">Back to receipts</Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {receipt.data.receiptNumber}</h1>
      <ReceiptForm existing={receipt} />
    </div>
  );
}
