export type Currency = "PKR" | "USD" | "GBP";
export type Language = "en" | "ur";
export type ReceiptKind = "generated" | "uploaded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "jazzcash"
  | "easypaisa"
  | "cheque"
  | "other";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Party {
  name: string;
  phone?: string;
  address?: string;
}

export interface GeneratedReceiptData {
  receiptNumber: string;
  date: string; // yyyy-mm-dd
  vendor: Party;
  customer: Party;
  items: LineItem[];
  taxPercent: number;
  discountType: "percent" | "amount";
  discountValue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  language: Language;
  currency: Currency;
}

export interface UploadedFileMeta {
  name: string;
  type: string;
  size: number;
}

interface ReceiptBase {
  id: string;
  kind: ReceiptKind;
  title: string; // vendor name for list display
  date: string;
  total: number;
  currency: Currency;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedReceipt extends ReceiptBase {
  kind: "generated";
  data: GeneratedReceiptData;
}

export interface UploadedReceipt extends ReceiptBase {
  kind: "uploaded";
  file: UploadedFileMeta;
  notes?: string;
}

export type Receipt = GeneratedReceipt | UploadedReceipt;
