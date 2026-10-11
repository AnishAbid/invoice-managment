"use client";

import { Check } from "lucide-react";
import { FitToWidth, PAGE_WIDTH, ReceiptPreview } from "./receipt-preview";
import { TEMPLATES, type TemplateMeta } from "@/lib/templates";
import type { GeneratedReceiptData, TemplateId } from "@/lib/types";

export function TemplatePicker({
  data,
  value,
  onChange,
  onHover,
}: {
  data: GeneratedReceiptData;
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  /** Called with a template while the pointer or focus is on it, and null when it leaves. */
  onHover: (id: TemplateId | null) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Receipt template" className="grid grid-cols-2 gap-3 xl:grid-cols-3" onMouseLeave={() => onHover(null)}>
      {TEMPLATES.map((tpl) => {
        const selected = tpl.id === value;
        return (
          <button
            key={tpl.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(tpl.id)}
            onMouseEnter={() => onHover(tpl.id)}
            onFocus={() => onHover(tpl.id)}
            onBlur={() => onHover(null)}
            className={`group relative overflow-hidden rounded-xl border bg-white text-start transition focus-visible:outline-none ${
              selected
                ? "border-emerald-600 ring-2 ring-emerald-600/30"
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-600/30"
            }`}
          >
            <Thumbnail data={data} template={tpl} />
            <div className="border-t border-slate-100 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{tpl.name}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {tpl.paper === "thermal" ? "80 mm" : "A4"}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{tpl.description}</p>
            </div>
            {selected && (
              <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-emerald-600 text-white shadow">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A real, scaled-down render of the template, so thumbnails never drift from the output. */
function Thumbnail({ data, template }: { data: GeneratedReceiptData; template: TemplateMeta }) {
  return (
    <div className="relative" aria-hidden inert>
      <FitToWidth width={PAGE_WIDTH} clip className="pointer-events-none aspect-[4/5] bg-slate-100">
        <ReceiptPreview data={data} template={template.id} />
      </FitToWidth>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-100 to-transparent" />
    </div>
  );
}
