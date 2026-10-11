import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/types";
import { BoldTemplate } from "./receipt-templates/bold";
import { ClassicTemplate } from "./receipt-templates/classic";
import { ElegantTemplate } from "./receipt-templates/elegant";
import { MemoTemplate } from "./receipt-templates/memo";
import { ModernTemplate } from "./receipt-templates/modern";
import type { TemplateProps } from "./receipt-templates/shared";
import { ThermalTemplate } from "./receipt-templates/thermal";

const COMPONENTS: Record<TemplateId, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  bold: BoldTemplate,
  elegant: ElegantTemplate,
  memo: MemoTemplate,
  thermal: ThermalTemplate,
};

/** The printable receipt, drawn with the template saved on the receipt (classic by default). */
export function ReceiptDocument({ data, ref, template }: TemplateProps & { template?: TemplateId }) {
  const Template = COMPONENTS[template ?? data.template ?? "classic"] ?? ClassicTemplate;
  return <Template data={data} ref={ref} />;
}
