import type { FontScale, LegacyStickerGroupLayout, StickerGroupLayout, TemplateField, StickerLayouts } from "@/src/core/models/template";
import type { MarkingContent, MarkingState } from "@/src/core/models/marking";
import type { FramePage, PrintOption } from "@/src/core/stickers/markingStickerPlan";

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

export interface OrderTableProps {
  template: MarkingState["template"];
  insideRows: MarkingContent[];
  outsideRows: MarkingContent[];
  outsideGroups: OutsideStickerGroup[];
  lotStart: number;
  isAdmin: boolean;
  framePages: FramePage[];
  customerNamePages: StickerItem[][];
  fscLogoPages: StickerItem[][];
  onChangeRow: (section: "inside" | "outside", row: number, key: string, value: string) => void;
}

export interface SelectablePrintOption extends PrintOption {
  selected: boolean;
}

export interface PaginationProps {
  previewItems: StickerItem[];
  printOptions: SelectablePrintOption[];
  canExport: boolean;
  isSaving: boolean;
  isExportModalOpen: boolean;
  onOpenExportModal: () => void;
  onCloseExportModal: () => void;
  onToggleOption: (option: SelectablePrintOption, enabled: boolean) => void;
  onExport: () => void;
}
