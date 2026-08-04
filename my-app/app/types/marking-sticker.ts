import type { TemplateField, StickerLayouts } from "@/app/types/customer";
import type { MarkingContent } from "@/app/types/marking";

export type StickerKind = "insideFrame" | "outsideFrame" | "customerName";

export interface StickerDetail {
  label: string;
  values: Array<{ label?: string; value: string }>;
  order: number;
}

export interface StickerItem {
  kind: StickerKind;
  customerName: string;
  lot: number;
  pallet: number;
  side: number;
  productionDate: string;
  stickerType: string;
  details: StickerDetail[];
}

export interface StickerBuildOptions {
  customerName: string;
  format: string;
  sideCount: number;
  lotCount: number;
  lotStart: number;
  productionDate: string;
  stickerType: string;
  layouts: StickerLayouts | undefined;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  insideRow: MarkingContent | undefined;
  outsideRow: MarkingContent | undefined;
}

export interface OutsideStickerGroup {
  name: string;
  order: number;
  fields: TemplateField[];
}

export interface TableSectionProps {
  number: string;
  title: string;
  subtitle: string;
  fields: TemplateField[];
  rows: MarkingContent[];
  lotStart: number;
  onChange: (row: number, key: string, value: string) => void;
  emptyText?: string;
}
