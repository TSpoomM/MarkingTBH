import { Template, TemplateDetail } from "./template";

export type MarkingContent = Record<string, string>;
export type Notice = { type: "error" | "success"; text: string };
export type PrintSection = "insideFrame" | "outsideFrame" | "customerName" | "fscLogo";

export type PrintSections = Record<PrintSection, boolean>;

export interface MarkingState {
  templates: Template[];
  templateId: string;
  template: TemplateDetail | null;
  totalLot: string;
  stickerSides: string;
  stickerFormat: string;
  stickerType: string;
  stickerFsc: boolean;
  stickerOther: string;
  printSections: PrintSections;
  printOutsideGroups: Record<string, boolean>;
  lotCount: string;
  lotStart: number;
  productionDate: string;
  insideRows: MarkingContent[];
  outsideRows: MarkingContent[];
  isAdmin: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isExportModalOpen: boolean;
  isPrintSheetActive: boolean;
  notice: Notice | null;
}

export interface SaveMarkingPayload {
  templateId: number;
  totalLot: number;
  stickerSides: number;
  lotCount: number;
  lotStart: number;
  productionDate: string;
  actionType?: "save" | "print";
  contentInside: MarkingContent[];
  contentOutside: MarkingContent[];
}

export interface CreateMarkingInput {
  employeeId: string;
  templateId: number;
  totalLot: number;
  stickerSides: number;
  lotCount: number;
  lotStart: number;
  productionDate: string;
  actionType?: "save" | "print";
  contentInside: MarkingContent | MarkingContent[];
  contentOutside: MarkingContent | MarkingContent[];
}

export interface MarkingHistoryItem {
  id: number | string;
  employeeId: string;
  employeeName: string;
  employeeLocation: string;
  templateId: number;
  customerName: string;
  totalLot: number;
  stickerSides: number;
  lotStart: number;
  lotEnd: number;
  lotCount: number;
  productionDate: string;
  actionType: "save" | "print" | "unknown";
  stickerFormat: string;
  stickerType: string;
  stickerFsc?: boolean;
  stickerOther: string;
  createdDate: string;
  inside: MarkingContent[];
  outside: MarkingContent[];
  fieldMeta?: {
    inside: Record<string, MarkingHistoryFieldMeta>;
    outside: Record<string, MarkingHistoryFieldMeta>;
  };
}

export interface MarkingHistoryFieldMeta {
  label: string;
  parentKey: string;
  parentLabel: string;
  order: number;
}

export interface MarkingFilterPanelProps {
  notice: Notice | null;
  templates: Template[];
  templateId: string;
  template: TemplateDetail | null;
  productionDate: string;
  lotCount: string;
  lotStart: number;
  isLoading: boolean;
  onDismissNotice: () => void;
  onSelectTemplate: (templateId: string) => void;
  onProductionDateChange: (value: string) => void;
  onLotCountChange: (value: string) => void;
}
