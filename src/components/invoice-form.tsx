"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { nextInvoiceNumber } from "@/lib/db";
import { toGeneratedData } from "@/lib/document";
import { computeTotals, CURRENCIES, newId, PAYMENT_METHODS, todayISO } from "@/lib/receipt";
import { DEFAULT_TEMPLATE, TEMPLATES } from "@/lib/templates";
import { useLedger } from "@/lib/store";
import type { DocumentData, Invoice, InvoiceStatus, LineItem, Party, TemplateId } from "@/lib/types";

const blankItem = (): LineItem => ({ id: newId(), description: "", quantity: 1, unitPrice: 0 });

function emptyDoc(profile: { name: string; phone: string; address: string; email: string; defaultCurrency: DocumentData["currency"]; defaultLanguage: DocumentData["language"]; defaultTemplate: TemplateId; defaultTaxPercent: number; invoiceDueDays: number }): DocumentData {
  const due = new Date();
  due.setDate(due.getDate() + (profile.invoiceDueDays || 14));
  const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
  return {
    number: "",
    date: todayISO(),
    dueDate,
    vendor: { name: profile.name, phone: profile.phone, address: profile.address, email: profile.email },
    customer: { name: "", phone: "", address: "", email: "" },
    items: [blankItem()],
    taxPercent: profile.defaultTaxPercent,
    discountType: "amount",
    discountValue: 0,
    paymentMethod: "cash",
    notes: "",
    language: profile.defaultLanguage,
    currency: profile.defaultCurrency,
    template: profile.defaultTemplate || DEFAULT_TEMPLATE,
  };
}

export function InvoiceForm({ existing }: { existing?: Invoice }) {
  const router = useRouter();
  const { t, profile, clients, saveInvoice, saveClient } = useLedger();
  const [data, setData] = useState<DocumentData>(() =>
    existing ? { ...existing.data } : emptyDoc(profile),
  );
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status ?? "draft");
  const [clientId, setClientId] = useState(existing?.clientId ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) return;
    setData(emptyDoc(profile));
    nextInvoiceNumber().then((n) => setData((d) => (d.number ? d : { ...d, number: n })));
  }, [existing, profile]);

  const set = <K extends keyof DocumentData>(key: K, value: DocumentData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setParty = (who: "vendor" | "customer", key: keyof Party, value: string) =>
    setData((d) => ({ ...d, [who]: { ...d[who], [key]: value } }));
  const setItem = (id: string, patch: Partial<LineItem>) =>
    setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const totals = computeTotals(toGeneratedData(data));

  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setData((d) => ({
      ...d,
      customer: { name: c.name, phone: c.phone, address: c.address, email: c.email },
    }));
  }

  async function handleSave() {
    if (!data.customer.name.trim() && !data.vendor.name.trim())
      return setError("Enter a customer or business name.");
    if (!data.items.some((i) => i.description.trim() && i.unitPrice > 0))
      return setError("Add at least one line item.");
    setError("");
    setSaving(true);
    const now = Date.now();
    let cid = clientId;
    if (!cid && data.customer.name.trim()) {
      cid = newId();
      await saveClient({
        id: cid,
        name: data.customer.name.trim(),
        phone: data.customer.phone ?? "",
        email: data.customer.email ?? "",
        address: data.customer.address ?? "",
        notes: "",
        role: "customer",
        openingBalance: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    const inv: Invoice = {
      id: existing?.id ?? newId(),
      number: data.number,
      clientId: cid || undefined,
      status,
      data: { ...data, items: data.items.filter((i) => i.description.trim() || i.unitPrice) },
      amountPaid: existing?.amountPaid ?? 0,
      paidAt: existing?.paidAt,
      category: category || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveInvoice(inv, { consumeNumber: !existing });
    router.push(`/invoices/${inv.id}`);
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Invoice no.">
            <input className="input font-mono" value={data.number} onChange={(e) => set("number", e.target.value)} />
          </Field>
          <Field label={t("date")}>
            <input type="date" className="input" value={data.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label={t("dueDate")}>
            <input type="date" className="input" value={data.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
          <Field label={t("status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              {(["draft", "sent", "paid", "overdue", "cancelled"] as InvoiceStatus[]).map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Client">
            <select className="input" value={clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">— New / manual —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Template">
            <select
              className="input"
              value={data.template ?? DEFAULT_TEMPLATE}
              onChange={(e) => set("template", e.target.value as TemplateId)}
            >
              {TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("category")}>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartyCard title="From (vendor)" party={data.vendor} onChange={(k, v) => setParty("vendor", k, v)} />
        <PartyCard title={t("customer")} party={data.customer} onChange={(k, v) => setParty("customer", k, v)} />
      </div>

      <div className="card space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Line items</h3>
          <button type="button" className="btn-secondary" onClick={() => set("items", [...data.items, blankItem()])}>
            <Plus className="size-4" /> Add
          </button>
        </div>
        {data.items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_4.5rem_6rem_auto] gap-2">
            <input
              className="input"
              placeholder="Description"
              value={item.description}
              onChange={(e) => setItem(item.id, { description: e.target.value })}
            />
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              value={item.quantity}
              onChange={(e) => setItem(item.id, { quantity: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              min={0}
              step="any"
              value={item.unitPrice}
              onChange={(e) => setItem(item.id, { unitPrice: Number(e.target.value) })}
            />
            <button
              type="button"
              className="btn-ghost p-2 text-red-600"
              onClick={() => set("items", data.items.filter((i) => i.id !== item.id))}
              disabled={data.items.length <= 1}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
          <Field label="Tax %">
            <input
              className="input"
              type="number"
              value={data.taxPercent}
              onChange={(e) => set("taxPercent", Number(e.target.value))}
            />
          </Field>
          <Field label="Discount">
            <input
              className="input"
              type="number"
              value={data.discountValue}
              onChange={(e) => set("discountValue", Number(e.target.value))}
            />
          </Field>
          <Field label="Discount type">
            <select
              className="input"
              value={data.discountType}
              onChange={(e) => set("discountType", e.target.value as "percent" | "amount")}
            >
              <option value="amount">Amount</option>
              <option value="percent">Percent</option>
            </select>
          </Field>
          <Field label={t("paymentMethod")}>
            <select
              className="input"
              value={data.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value as DocumentData["paymentMethod"])}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Language">
            <select className="input" value={data.language} onChange={(e) => set("language", e.target.value as "en" | "ur")}>
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </Field>
          <Field label="Currency">
            <select
              className="input"
              value={data.currency}
              onChange={(e) => set("currency", e.target.value as DocumentData["currency"])}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("notes")}>
            <input className="input" value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
        <p className="text-right text-sm font-medium text-slate-700">
          Total: {totals.total.toLocaleString()} {data.currency}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          {t("cancel")}
        </button>
        <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
          <Save className="size-4" /> {t("save")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function PartyCard({
  title,
  party,
  onChange,
}: {
  title: string;
  party: Party;
  onChange: (k: keyof Party, v: string) => void;
}) {
  return (
    <div className="card space-y-3 p-4 sm:p-5">
      <h3 className="font-medium">{title}</h3>
      <Field label="Name">
        <input className="input" value={party.name} onChange={(e) => onChange("name", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input className="input" value={party.phone ?? ""} onChange={(e) => onChange("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" value={party.email ?? ""} onChange={(e) => onChange("email", e.target.value)} />
        </Field>
      </div>
      <Field label="Address">
        <input className="input" value={party.address ?? ""} onChange={(e) => onChange("address", e.target.value)} />
      </Field>
    </div>
  );
}
