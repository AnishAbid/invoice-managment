import type { GeneratedReceiptData, TemplateId } from "./types";

export type Paper = "a4" | "thermal";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  paper: Paper;
  /** Natural width of the document in CSS px, used to scale thumbnails. */
  width: number;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean layout with a green accent. Works for almost anything.",
    paper: "a4",
    width: 720,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Minimal and roomy. The amount paid is the first thing you see.",
    paper: "a4",
    width: 720,
  },
  {
    id: "bold",
    name: "Bold",
    description: "Dark header band with the vendor's initials. Good for businesses.",
    paper: "a4",
    width: 720,
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Serif type, framed border and a PAID stamp. Good for services and rent.",
    paper: "a4",
    width: 720,
  },
  {
    id: "memo",
    name: "Cash Memo",
    description: "Ruled grid like a shop bill book, with the amount in words.",
    paper: "a4",
    width: 720,
  },
  {
    id: "thermal",
    name: "Thermal slip",
    description: "80 mm till-roll look with monospace type. Prints on POS printers.",
    paper: "thermal",
    width: 320,
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "classic";

export function getTemplate(id: TemplateId | undefined): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** Placeholder content so templates can be compared before the form is filled. */
export function sampleData(base: GeneratedReceiptData): GeneratedReceiptData {
  const ur = base.language === "ur";
  return {
    ...base,
    receiptNumber: base.receiptNumber || "RCPT-000000-0001",
    vendor: ur
      ? { name: "المدینہ جنرل اسٹور", phone: "0300-1234567", address: "مین بازار، لاہور" }
      : { name: "Al-Madina General Store", phone: "0300-1234567", address: "Main Bazaar, Lahore" },
    customer: ur ? { name: "احمد علی", phone: "", address: "" } : { name: "Ahmed Ali", phone: "", address: "" },
    items: ur
      ? [
          { id: "s1", description: "آٹا (10 کلو)", quantity: 1, unitPrice: 1450 },
          { id: "s2", description: "دودھ (1 لیٹر)", quantity: 3, unitPrice: 220 },
          { id: "s3", description: "چینی (1 کلو)", quantity: 2, unitPrice: 160 },
        ]
      : [
          { id: "s1", description: "Flour (10 kg)", quantity: 1, unitPrice: 1450 },
          { id: "s2", description: "Milk (1 litre)", quantity: 3, unitPrice: 220 },
          { id: "s3", description: "Sugar (1 kg)", quantity: 2, unitPrice: 160 },
        ],
    notes: "",
  };
}

/** True once the user has typed anything that would show on the receipt. */
export function hasContent(data: GeneratedReceiptData) {
  return Boolean(data.vendor.name.trim() || data.items.some((i) => i.description.trim() || i.unitPrice));
}
