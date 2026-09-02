import type { FontScale, LegacyStickerGroupLayout, StickerGroupLayout, TemplateField, StickerLayouts } from "@/src/core/models/template";
import type { MarkingContent } from "@/src/core/models/marking";

export type StickerKind = "insideFrame" | "outsideFrame" | "customerName" | "fscLogo";

export interface StickerDetail {
  label: string;
  values: Array<{ label?: string; value: string }>;
  order: number;
  fontScale?: FontScale;
  hideLabel?: boolean;
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
  group?: string;
  groupOrder?: number;
  groupLayout?: LegacyStickerGroupLayout;
  logoCount?: number;
}

export interface StickerBuildOptions {
  customerName: string;
  format: string;
  sideCount: number;
  lotCount: number;
  lotStart: number;
  productionDate: string;
  stickerType: string;
  stickerFsc: boolean;
  layouts: StickerLayouts | undefined;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  insideRow: MarkingContent | undefined;
  outsideRow: MarkingContent | undefined;
}

export interface OutsideStickerGroup {
  name: string;
  order: number;
  layout: StickerGroupLayout;
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
