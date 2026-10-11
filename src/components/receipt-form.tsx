"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LayoutTemplate, ListChecks, Plus, Save, Trash2 } from "lucide-react";
import { FitToWidth, PAGE_WIDTH, ReceiptPreview } from "./receipt-preview";
import { TemplatePicker } from "./template-picker";
import { commitReceiptNumber, nextReceiptNumber, saveReceipt } from "@/lib/db";
import {
  CATEGORIES,
  CURRENCIES,
  PAYMENT_METHODS,
  computeTotals,
  formatMoney,
  newId,
  t,
  todayISO,
} from "@/lib/receipt";
import { DEFAULT_TEMPLATE, TEMPLATES, getTemplate, hasContent, sampleData } from "@/lib/templates";
import type { GeneratedReceipt, GeneratedReceiptData, LineItem, Party, TemplateId } from "@/lib/types";

const timestamp = () => Date.now();
const LAST_TEMPLATE_KEY = "raseed:last-template";

type Step = "template" | "details";

const blankItem = (): LineItem => ({ id: newId(), description: "", quantity: 1, unitPrice: 0 });

function emptyData(): GeneratedReceiptData {
  return {
    receiptNumber: "",
    date: todayISO(),
    vendor: { name: "", phone: "", address: "" },
    customer: { name: "", phone: "", address: "" },
    items: [blankItem()],
    taxPercent: 0,
    discountType: "amount",
    discountValue: 0,
    paymentMethod: "cash",
    notes: "",
    language: "en",
    currency: "PKR",
    template: DEFAULT_TEMPLATE,
  };
}

export function ReceiptForm({ existing }: { existing?: GeneratedReceipt }) {
  const router = useRouter();
  const [data, setData] = useState<GeneratedReceiptData>(() =>
    existing ? { ...existing.data, template: existing.data.template ?? DEFAULT_TEMPLATE } : emptyData(),
  );
  const [category, setCategory] = useState(existing?.category ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(existing ? "details" : "template");
  const [hovered, setHovered] = useState<TemplateId | null>(null);

  useEffect(() => {
    if (existing) return;
    nextReceiptNumber().then((n) => {
      setData((d) => (d.receiptNumber ? d : { ...d, receiptNumber: n }));
      // Start new receipts on the template the user picked last time
      try {
        const last = localStorage.getItem(LAST_TEMPLATE_KEY);
        if (TEMPLATES.some((tpl) => tpl.id === last)) setData((d) => ({ ...d, template: last as TemplateId }));
      } catch {}
    });
  }, [existing]);

  const set = <K extends keyof GeneratedReceiptData>(key: K, value: GeneratedReceiptData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setParty = (who: "vendor" | "customer", key: keyof Party, value: string) =>
    setData((d) => ({ ...d, [who]: { ...d[who], [key]: value } }));
  const setItem = (id: string, patch: Partial<LineItem>) =>
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const totals = computeTotals(data);
  const template = data.template ?? DEFAULT_TEMPLATE;
  const previewTemplate = getTemplate(hovered ?? template);
  const isSample = !hasContent(data);
  const previewData = isSample ? sampleData(data) : data;

  function chooseTemplate(id: TemplateId) {
    set("template", id);
    try {
      localStorage.setItem(LAST_TEMPLATE_KEY, id);
    } catch {}
  }

  async function handleSave() {
    if (!data.vendor.name.trim()) return setError("Please enter the vendor / shop name.");
    if (!data.items.some((i) => i.description.trim() && i.unitPrice > 0))
      return setError("Add at least one item with a description and price.");
    setError("");
    setSaving(true);
    const now = timestamp();
    const receipt: GeneratedReceipt = {
      id: existing?.id ?? newId(),
      kind: "generated",
      title: data.vendor.name.trim(),
      date: data.date,
      total: totals.total,
      currency: data.currency,
      category: category || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      data: { ...data, items: data.items.filter((i) => i.description.trim() || i.unitPrice) },
    };
    await saveReceipt(receipt);
    if (!existing) await commitReceiptNumber();
    router.push(`/receipts/${receipt.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Left: template picker or form */}
      <div className="space-y-5">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <StepTab active={step === "template"} onClick={() => setStep("template")} icon={LayoutTemplate} n={1}>
            Template
          </StepTab>
          <StepTab active={step === "details"} onClick={() => setStep("details")} icon={ListChecks} n={2}>
            Details
          </StepTab>
        </div>

        {step === "template" ? (
          <Section title="Choose a template">
            <p className="-mt-2 mb-3 text-xs text-slate-500">
              Hover to preview on the right, click to pick. You can change it any time, even after saving.
            </p>
            <TemplatePicker data={previewData} value={template} onChange={chooseTemplate} onHover={setHovered} />
            <div className="mt-4 flex justify-end">
              <button type="button" className="btn-primary" onClick={() => setStep("details")}>
                Continue with {getTemplate(template).name} <ArrowRight className="size-4" />
              </button>
            </div>
          </Section>
        ) : (
          <>
            <Section title="Receipt settings">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Receipt no.">
                  <input className="input font-mono" value={data.receiptNumber} onChange={(e) => set("receiptNumber", e.target.value)} />
                </Field>
                <Field label="Date">
                  <input type="date" className="input" value={data.date} onChange={(e) => set("date", e.target.value)} />
                </Field>
                <Field label="Language">
                  <select className="input" value={data.language} onChange={(e) => set("language", e.target.value as "en" | "ur")}>
                    <option value="en">English</option>
                    <option value="ur">اردو (Urdu)</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select className="input" value={data.currency} onChange={(e) => set("currency", e.target.value as GeneratedReceiptData["currency"])}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <div className="grid gap-5 sm:grid-cols-2">
              <PartySection title="Vendor / service provider" party={data.vendor} onChange={(k, v) => setParty("vendor", k, v)} namePlaceholder="e.g. Al-Madina General Store" required />
              <PartySection title="Customer (paid by)" party={data.customer} onChange={(k, v) => setParty("customer", k, v)} namePlaceholder="Your name" />
            </div>

            <Section title="Items">
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_70px_110px_32px] gap-2 text-xs font-medium text-slate-500 sm:grid">
                  <span>Description</span><span>Qty</span><span>Unit price</span><span />
                </div>
                {data.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_70px_110px_32px] gap-2">
                    <input
                      className="input"
                      dir="auto"
                      placeholder="Item or service"
                      value={item.description}
                      onChange={(e) => setItem(item.id, { description: e.target.value })}
                    />
                    <input
                      type="number" min={0} step="any" className="input" aria-label="Quantity"
                      value={item.quantity}
                      onChange={(e) => setItem(item.id, { quantity: e.target.valueAsNumber || 0 })}
                    />
                    <input
                      type="number" min={0} step="any" className="input" aria-label="Unit price"
                      value={item.unitPrice || ""}
                      placeholder="0"
                      onChange={(e) => setItem(item.id, { unitPrice: e.target.valueAsNumber || 0 })}
                    />
                    <button
                      type="button"
                      className="btn-ghost px-0 text-slate-400 hover:text-red-600"
                      aria-label="Remove item"
                      disabled={data.items.length === 1}
                      onClick={() => set("items", data.items.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary mt-1" onClick={() => set("items", [...data.items, blankItem()])}>
                  <Plus className="size-4" /> Add item
                </button>
              </div>
            </Section>

            <Section title="Tax, discount & payment">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Tax %">
                  <input type="number" min={0} step="any" className="input" value={data.taxPercent || ""} placeholder="0"
                    onChange={(e) => set("taxPercent", e.target.valueAsNumber || 0)} />
                </Field>
                <Field label="Discount">
                  <div className="flex">
                    <input type="number" min={0} step="any" className="input rounded-e-none" value={data.discountValue || ""} placeholder="0"
                      onChange={(e) => set("discountValue", e.target.valueAsNumber || 0)} />
                    <select className="input w-16 rounded-s-none border-s-0 px-1" value={data.discountType}
                      onChange={(e) => set("discountType", e.target.value as "percent" | "amount")} aria-label="Discount type">
                      <option value="amount">{data.currency}</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </Field>
                <Field label="Payment method">
                  <select className="input" value={data.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as GeneratedReceiptData["paymentMethod"])}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{t("en", m)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Category">
                  <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">None</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Notes" className="mt-3">
                <textarea className="input min-h-20" dir="auto" placeholder="Warranty info, reference number, etc." value={data.notes}
                  onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </Section>
          </>
        )}

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-xl font-semibold">{formatMoney(totals.total, data.currency)}</div>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-red-600">{error}</span>}
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <Save className="size-4" /> {existing ? "Save changes" : "Save receipt"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Live preview · <span className="text-slate-800">{previewTemplate.name}</span>
          </div>
          {isSample ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Sample data
            </span>
          ) : (
            step === "details" && (
              <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => setStep("template")}>
                Change template
              </button>
            )
          )}
        </div>
        <div className="card overflow-hidden lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <FitToWidth width={PAGE_WIDTH} className="bg-slate-100">
            <ReceiptPreview data={previewData} template={previewTemplate.id} />
          </FitToWidth>
        </div>
      </div>
    </div>
  );
}

function StepTab({
  active, onClick, icon: Icon, n, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  n: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon className="size-4" />
      <span>
        <span className="opacity-70">{n}.</span> {children}
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function PartySection({
  title, party, onChange, namePlaceholder, required,
}: {
  title: string;
  party: Party;
  onChange: (key: keyof Party, value: string) => void;
  namePlaceholder: string;
  required?: boolean;
}) {
  return (
    <Section title={title}>
      <div className="space-y-3">
        <Field label={required ? "Name *" : "Name"}>
          <input className="input" dir="auto" placeholder={namePlaceholder} value={party.name} onChange={(e) => onChange("name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="input" type="tel" placeholder="03xx-xxxxxxx" value={party.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </Field>
        <Field label="Address">
          <textarea className="input min-h-16" dir="auto" value={party.address} onChange={(e) => onChange("address", e.target.value)} />
        </Field>
      </div>
    </Section>
  );
}
