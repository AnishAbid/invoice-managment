export type Currency = "PKR" | "USD" | "GBP";
export type Language = "en" | "ur" | "ar" | "de" | "ja" | "zh";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export function isRtlLanguage(lang: Language) {
  return lang === "ur" || lang === "ar";
}
export type ReceiptKind = "generated" | "uploaded";
export type TemplateId = "classic" | "thermal" | "modern" | "bold" | "elegant" | "memo";
export type DiscountType = "percent" | "amount";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type PartyRole = "customer" | "supplier" | "both";
export type AccountKind = "cash" | "checking" | "savings" | "credit" | "debt" | "tracking";
export type TxnKind = "income" | "expense" | "transfer" | "assign" | "move";
export type TargetCadence = "weekly" | "monthly" | "yearly";
export type TargetBehavior = "refill" | "setAside";
export type RecurringFreq = "daily" | "weekly" | "monthly" | "yearly";
export type ReportPeriod = "day" | "week" | "month";
export type KhataKind = "gave" | "got";
export type CashBookKind = "cashIn" | "cashOut";
export type MemberRole = "owner" | "member" | "viewer";
export type AuthProvider = "local" | "google" | "microsoft";

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
  email?: string;
}

export interface DocumentData {
  number: string;
  date: string;
  dueDate?: string;
  vendor: Party;
  customer: Party;
  items: LineItem[];
  taxPercent: number;
  discountType: DiscountType;
  discountValue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  language: Language;
  currency: Currency;
  template?: TemplateId;
}

/** @deprecated prefer DocumentData; kept for existing receipt rows */
export interface GeneratedReceiptData {
  receiptNumber: string;
  date: string;
  vendor: Party;
  customer: Party;
  items: LineItem[];
  taxPercent: number;
  discountType: DiscountType;
  discountValue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  language: Language;
  currency: Currency;
  template?: TemplateId;
}

export interface UploadedFileMeta {
  name: string;
  type: string;
  size: number;
}

interface ReceiptBase {
  id: string;
  kind: ReceiptKind;
  title: string;
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

export interface BusinessProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  defaultCurrency: Currency;
  defaultLanguage: Language;
  defaultTemplate: TemplateId;
  invoiceDueDays: number;
  defaultTaxPercent: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  role: PartyRole;
  openingBalance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId?: string;
  status: InvoiceStatus;
  data: DocumentData;
  amountPaid: number;
  paidAt?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Expense {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  currency: Currency;
  category: string;
  paymentMethod: PaymentMethod;
  accountId?: string;
  notes: string;
  receiptId?: string;
  fileName?: string;
  fileMime?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MoneyAccount {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: number;
  currency: Currency;
  archived: boolean;
  last4: string;
  creditLimit: number;
  statementDay?: number;
  network: string;
  createdAt: number;
  updatedAt: number;
}

export interface EnvelopeTarget {
  amount: number;
  cadence: TargetCadence;
  behavior: TargetBehavior;
}

export interface Envelope {
  id: string;
  name: string;
  group: string;
  color: number;
  target?: EnvelopeTarget;
  archived: boolean;
  sort: number;
  createdAt: number;
  updatedAt: number;
}

export interface MoneyTxn {
  id: string;
  kind: TxnKind;
  date: string;
  amount: number;
  currency: Currency;
  accountId?: string;
  toAccountId?: string;
  envelopeId?: string;
  fromEnvelopeId?: string;
  payee: string;
  notes: string;
  invoiceId?: string;
  expenseId?: string;
  recurringId?: string;
  memberId?: string;
  createdAt: number;
}

export interface RecurringRule {
  id: string;
  kind: TxnKind;
  amount: number;
  currency: Currency;
  accountId: string;
  envelopeId?: string;
  payee: string;
  notes: string;
  freq: RecurringFreq;
  nextDate: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KhataEntry {
  id: string;
  partyId: string;
  kind: KhataKind;
  amount: number;
  currency: Currency;
  date: string;
  notes: string;
  billNo: string;
  memberId?: string;
  createdAt: number;
}

export interface CashBookEntry {
  id: string;
  kind: CashBookKind;
  amount: number;
  currency: Currency;
  date: string;
  notes: string;
  partyId?: string;
  accountId: string;
  memberId?: string;
  txnId?: string;
  createdAt: number;
}

export interface Household {
  id: string;
  name: string;
  createdAt: number;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: MemberRole;
  color: string;
  createdAt: number;
}

export interface SignedAccount {
  id: string;
  provider: AuthProvider;
  email: string;
  displayName: string;
  /** local auth only — SHA-256 hex of salt+password */
  passwordHash?: string;
  salt?: string;
  createdAt: number;
}

export interface AppSettings {
  pinHash?: string;
  pinSalt?: string;
  pinEnabled: boolean;
  lastBackupAt?: number;
  activeMemberId?: string;
}

export const emptyProfile = (): BusinessProfile => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  defaultCurrency: "PKR",
  defaultLanguage: "en",
  defaultTemplate: "classic",
  invoiceDueDays: 14,
  defaultTaxPercent: 0,
});

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  cash: "Cash",
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  debt: "Loan / debt",
  tracking: "Investment",
};

export function accountIsAsset(kind: AccountKind) {
  return kind === "cash" || kind === "checking" || kind === "savings" || kind === "tracking";
}

export function accountOnBudget(kind: AccountKind) {
  return kind === "cash" || kind === "checking" || kind === "savings" || kind === "credit";
}

export function effectiveInvoiceStatus(inv: Invoice, today: string): InvoiceStatus {
  if (inv.status === "sent" && inv.data.dueDate && inv.data.dueDate < today) return "overdue";
  return inv.status;
}
