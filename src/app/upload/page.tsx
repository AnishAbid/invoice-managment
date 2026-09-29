"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Save, Upload, X } from "lucide-react";
import { saveReceipt } from "@/lib/db";
import { CATEGORIES, CURRENCIES, newId, todayISO } from "@/lib/receipt";
import type { Currency, UploadedReceipt } from "@/lib/types";

const ACCEPT = "image/*,application/pdf";
const MAX_BYTES = 20 * 1024 * 1024;

interface Draft {
  key: string;
  file: File;
  preview: string;
  title: string;
  date: string;
  total: string;
  currency: Currency;
  category: string;
  notes: string;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Revoke preview URLs when drafts are discarded / page unmounts
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  useEffect(() => () => draftsRef.current.forEach((d) => URL.revokeObjectURL(d.preview)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const rejected: string[] = [];
    const next: Draft[] = [];
    for (const file of Array.from(list)) {
      const ok = file.type.startsWith("image/") || file.type === "application/pdf";
      if (!ok || file.size > MAX_BYTES) {
        rejected.push(file.name);
        continue;
      }
      next.push({
        key: newId(),
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
        date: todayISO(),
        total: "",
        currency: "PKR",
        category: "",
        notes: "",
      });
    }
    setError(rejected.length ? `Skipped (only images/PDFs up to 20 MB): ${rejected.join(", ")}` : "");
    setDrafts((d) => [...d, ...next]);
  }

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  function remove(key: string) {
    setDrafts((ds) => {
      const d = ds.find((x) => x.key === key);
      if (d) URL.revokeObjectURL(d.preview);
      return ds.filter((x) => x.key !== key);
    });
  }

  async function saveAll() {
    if (drafts.some((d) => !d.title.trim())) return setError("Every receipt needs a vendor / title.");
    setSaving(true);
    const now = Date.now();
    const ids: string[] = [];
    for (const [i, d] of drafts.entries()) {
      const receipt: UploadedReceipt = {
        id: newId(),
        kind: "uploaded",
        title: d.title.trim(),
        date: d.date,
        total: Number(d.total) || 0,
        currency: d.currency,
        category: d.category || undefined,
        notes: d.notes.trim() || undefined,
        createdAt: now + i,
        updatedAt: now + i,
        file: { name: d.file.name, type: d.file.type, size: d.file.size },
      };
      await saveReceipt(receipt, d.file);
      ids.push(receipt.id);
    }
    router.push(ids.length === 1 ? `/receipts/${ids[0]}` : "/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload receipts</h1>
        <p className="mt-1 text-sm text-slate-500">Add photos of paper slips or PDF bills. You can add several at once.</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
        }`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Upload className="size-5" />
        </span>
        <div className="font-medium">Drop files here or click to browse</div>
        <div className="text-xs text-slate-500">JPG, PNG, HEIC, WEBP or PDF · up to 20 MB each</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {drafts.length > 0 && (
        <>
          <div className="space-y-4">
            {drafts.map((d) => (
              <div key={d.key} className="card flex flex-col gap-4 p-4 sm:flex-row">
                <div className="grid h-40 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 sm:w-36">
                  {d.file.type === "application/pdf" ? (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <FileText className="size-8" />
                      <span className="text-xs">PDF</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.preview} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                  <label className="col-span-2">
                    <span className="label">Vendor / title *</span>
                    <input className="input" dir="auto" value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} />
                  </label>
                  <label>
                    <span className="label">Date</span>
                    <input type="date" className="input" value={d.date} onChange={(e) => update(d.key, { date: e.target.value })} />
                  </label>
                  <label>
                    <span className="label">Category</span>
                    <select className="input" value={d.category} onChange={(e) => update(d.key, { category: e.target.value })}>
                      <option value="">None</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="label">Amount</span>
                    <input type="number" min={0} step="any" className="input" placeholder="0" value={d.total}
                      onChange={(e) => update(d.key, { total: e.target.value })} />
                  </label>
                  <label>
                    <span className="label">Currency</span>
                    <select className="input" value={d.currency} onChange={(e) => update(d.key, { currency: e.target.value as Currency })}>
                      {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </label>
                  <label className="col-span-2">
                    <span className="label">Notes</span>
                    <input className="input" dir="auto" value={d.notes} onChange={(e) => update(d.key, { notes: e.target.value })} />
                  </label>
                  <div className="col-span-2 truncate text-xs text-slate-400 sm:col-span-4">
                    {d.file.name} · {(d.file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button className="btn-ghost self-start px-2" onClick={() => remove(d.key)} aria-label="Remove">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save {drafts.length} receipt{drafts.length > 1 ? "s" : ""}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
