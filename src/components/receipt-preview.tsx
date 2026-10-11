"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { ReceiptDocument } from "./receipt-document";
import { getTemplate } from "@/lib/templates";
import type { GeneratedReceiptData, TemplateId } from "@/lib/types";

/** Page width (document plus surface padding) that scaled previews are laid out at. */
export const PAGE_WIDTH = 760;

/**
 * Shows a receipt as a sheet of paper on a grey surface. The ref goes to the
 * document itself, so exports never include the surface or the shadow.
 */
export function ReceiptPreview({
  data,
  template,
  docRef,
  className = "",
}: {
  data: GeneratedReceiptData;
  template?: TemplateId;
  docRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  const meta = getTemplate(template ?? data.template);
  return (
    <div className={`bg-slate-100 p-5 ${className}`}>
      <div className="mx-auto shadow-md ring-1 ring-slate-900/5" style={{ maxWidth: meta.width }}>
        <ReceiptDocument data={data} template={meta.id} ref={docRef} />
      </div>
    </div>
  );
}

/**
 * Lays children out at a fixed width and scales them down to fit the container,
 * so a preview keeps the exact layout of the exported page at any screen size.
 * With `clip`, the container keeps its own height (e.g. an aspect-ratio thumbnail).
 */
export function FitToWidth({
  width,
  clip = false,
  className = "",
  children,
}: {
  width: number;
  clip?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0, height: 0 });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const observer = new ResizeObserver(() => {
      const scale = Math.min(1, outer.clientWidth / width);
      // offsetHeight ignores transforms, so this is the unscaled height
      setSize({ scale, height: inner.offsetHeight * scale });
    });
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={outerRef}
      className={`relative overflow-hidden ${className}`}
      style={clip || !size.height ? undefined : { height: size.height }}
    >
      <div
        ref={innerRef}
        className="origin-top-left"
        style={{ width, transform: `scale(${size.scale})`, opacity: size.scale ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
