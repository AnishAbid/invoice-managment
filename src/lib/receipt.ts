import type {
  Currency,
  GeneratedReceiptData,
  Language,
  PaymentMethod,
} from "./types";

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
];

export function newId() {
  return crypto.randomUUID();
}

export function formatMoney(amount: number, currency: Currency, lang: Language = "en") {
  const locale = lang === "ur" ? "ur-PK" : currency === "GBP" ? "en-GB" : currency === "USD" ? "en-US" : "en-PK";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "PKR" ? 0 : 2,
    maximumFractionDigits: 2,
    // Latin digits keep amounts unambiguous in both languages
    numberingSystem: "latn",
  } as Intl.NumberFormatOptions).format(amount || 0);
}

export function formatDate(iso: string, lang: Language = "en") {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(lang === "ur" ? "ur-PK" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  } as Intl.DateTimeFormatOptions).format(d);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(data: GeneratedReceiptData) {
  const subtotal = round2(
    data.items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
  );
  const rawDiscount =
    data.discountType === "percent"
      ? (subtotal * (Number(data.discountValue) || 0)) / 100
      : Number(data.discountValue) || 0;
  const discount = round2(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxable = subtotal - discount;
  const tax = round2((taxable * (Number(data.taxPercent) || 0)) / 100);
  const total = round2(taxable + tax);
  return { subtotal, discount, tax, total };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? ` ${ONES[r % 10]}` : ""}`;
  return [h ? `${ONES[h]} Hundred` : "", rest].filter(Boolean).join(" ");
}

function integerInWords(n: number, southAsian: boolean): string {
  if (n === 0) return "Zero";
  // PKR amounts read in lakh/crore, like a paper cash memo; others use thousand/million/billion
  const scales: [number, string][] = southAsian
    ? [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]]
    : [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"]];
  const parts: string[] = [];
  for (const [size, name] of scales) {
    if (n >= size) {
      parts.push(`${integerInWords(Math.floor(n / size), southAsian)} ${name}`);
      n %= size;
    }
  }
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

const UNITS: Record<Currency, [string, string]> = {
  PKR: ["Rupees", "Paisa"],
  USD: ["Dollars", "Cents"],
  GBP: ["Pounds", "Pence"],
};

/** English amount in words, e.g. "Rupees One Lakh Twenty Thousand Only". */
export function amountInWords(amount: number, currency: Currency) {
  const value = Math.max(0, Math.round((amount || 0) * 100));
  const whole = Math.floor(value / 100);
  const fraction = value % 100;
  const [major, minor] = UNITS[currency];
  const words = integerInWords(whole, currency === "PKR");
  const tail = fraction ? ` and ${below1000(fraction)} ${minor}` : "";
  return currency === "PKR" ? `${major} ${words}${tail} Only` : `${words} ${major}${tail} Only`;
}

type Dict = Record<string, string>;

const en: Dict = {
  receipt: "Receipt",
  paymentReceipt: "Payment Receipt",
  receiptNo: "Receipt No.",
  date: "Date",
  from: "From (Vendor)",
  billedTo: "Received From (Customer)",
  description: "Description",
  qty: "Qty",
  rate: "Rate",
  amount: "Amount",
  subtotal: "Subtotal",
  discount: "Discount",
  tax: "Tax",
  total: "Total",
  paymentMethod: "Payment Method",
  notes: "Notes",
  phone: "Phone",
  thankYou: "Thank you for your business.",
  selfGenerated: "Self-generated digital record — not issued by the vendor.",
  signature: "Signature",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  cheque: "Cheque",
  other: "Other",
  cashMemo: "Cash Memo",
  paid: "Paid",
  amountPaid: "Amount paid",
  datePaid: "Date paid",
  summary: "Summary",
  inWords: "Amount in words",
  ms: "M/s.",
  sNo: "S.No.",
};

const ur: Dict = {
  receipt: "رسید",
  paymentReceipt: "ادائیگی کی رسید",
  receiptNo: "رسید نمبر",
  date: "تاریخ",
  from: "فروخت کنندہ",
  billedTo: "وصول کنندہ (گاہک)",
  description: "تفصیل",
  qty: "تعداد",
  rate: "نرخ",
  amount: "رقم",
  subtotal: "ذیلی کل",
  discount: "رعایت",
  tax: "ٹیکس",
  total: "کل رقم",
  paymentMethod: "طریقہ ادائیگی",
  notes: "نوٹس",
  phone: "فون",
  thankYou: "آپ کا شکریہ۔",
  selfGenerated: "خود تیار کردہ ڈیجیٹل ریکارڈ — فروخت کنندہ کی جانب سے جاری نہیں کیا گیا۔",
  signature: "دستخط",
  cash: "نقد",
  card: "کارڈ",
  bank_transfer: "بینک ٹرانسفر",
  jazzcash: "جاز کیش",
  easypaisa: "ایزی پیسہ",
  cheque: "چیک",
  other: "دیگر",
  cashMemo: "کیش میمو",
  paid: "ادا شدہ",
  amountPaid: "ادا شدہ رقم",
  datePaid: "تاریخ ادائیگی",
  summary: "خلاصہ",
  inWords: "رقم الفاظ میں",
  ms: "جناب",
  sNo: "نمبر شمار",
};

export function t(lang: Language, key: string) {
  return (lang === "ur" ? ur : en)[key] ?? en[key] ?? key;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "card",
  "bank_transfer",
  "jazzcash",
  "easypaisa",
  "cheque",
  "other",
];

export const CATEGORIES = [
  "Groceries",
  "Utilities",
  "Fuel",
  "Rent",
  "Medical",
  "Repairs & Services",
  "Food & Dining",
  "Shopping",
  "Travel",
  "Education",
  "Business",
  "Other",
];
