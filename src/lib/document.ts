import type { DocumentData, GeneratedReceiptData } from "./types";

/** Adapt invoice DocumentData for receipt templates / computeTotals. */
export function toGeneratedData(data: DocumentData): GeneratedReceiptData {
  return {
    receiptNumber: data.number,
    date: data.date,
    vendor: data.vendor,
    customer: data.customer,
    items: data.items,
    taxPercent: data.taxPercent,
    discountType: data.discountType,
    discountValue: data.discountValue,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    language: data.language,
    currency: data.currency,
    template: data.template,
  };
}
