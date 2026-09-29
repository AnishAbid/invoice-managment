import { ReceiptForm } from "@/components/receipt-form";

export default function NewReceiptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate receipt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in what you paid for. The preview on the right is exactly what you&apos;ll download or print.
        </p>
      </div>
      <ReceiptForm />
    </div>
  );
}
