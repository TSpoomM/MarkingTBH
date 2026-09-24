import type { DragEvent } from "react";
import type { CounterType, Template, StickerDefaults, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import type { InsideGroup, StickerLayouts } from "@/src/core/models/template-form";

export type TemplateFormNotice = { kind: "error" | "success"; text: string };
export type TemplateManageMode = "edit" | "create";
export type TemplateFieldPreset = "field" | "section" | "destination";
/** The manage-template page keeps two independent drafts side by side. */
export type TemplateFormTarget = "edit" | "create";
export type TemplateSection = "inside" | "outside";

export type StickerSelectableField = {
  key: string;
  label: string;
  parentKey: string;
  parentLabel: string;
  parentOrder: number | undefined;
  segmentLabel?: string;
  showOnSticker: boolean;
  stickerOrder: number | undefined;
};

export interface TemplateFormState {
  mode: TemplateManageMode;
  templates: Template[];
  selectedTemplateId: string;
  templateName: string;
  templateInsideDraft: TemplateField[];
  templateOutsideDraft: TemplateField[];
  createInsideDraft: TemplateField[];
  createOutsideDraft: TemplateField[];
  duplicateSourceTemplateId: string;
  name: string;
  isActive: boolean;
  templateIsActive: boolean;
  stickerLayouts: StickerLayouts;
  templateStickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  templateStickerDefaults: StickerDefaults;
  notice: TemplateFormNotice | undefined;
  templateNotice: TemplateFormNotice | undefined;
  duplicateNamePrompt: { templateId: string; name: string } | undefined;
  isAdmin: boolean;
  checkingRole: boolean;
  loadingTemplates: boolean;
  loadingTemplate: boolean;
  duplicatingTemplate: boolean;
  savingTemplate: boolean;
  saving: boolean;
}

export interface CreateTemplateFormProps {
  templates: Template[];
  name: string;
  isActive: boolean;
  duplicateSourceTemplateId: string;
  stickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  insideDraft: TemplateField[];
  outsideDraft: TemplateField[];
  notice: TemplateFormNotice | undefined;
  loadingTemplates: boolean;
  duplicatingTemplate: boolean;
  saving: boolean;
  onDismissNotice: () => void;
  onSubmit: () => void;
  onNameChange: (name: string) => void;
  onActiveChange: (isActive: boolean) => void;
  onDuplicateSourceChange: (templateId: string) => void;
  onStickerDefaultsChange: (defaults: StickerDefaults) => void;
  onSelectPreviewSlot: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
  onChangeField: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAddField: (section: "inside" | "outside", tableOrder?: number, preset?: TemplateFieldPreset) => void;
  onRemoveField: (section: "inside" | "outside", index: number) => void;
  onMoveField: (section: "inside" | "outside", fromIndex: number, toIndex: number, tableOrder?: number) => void;
  onAddTable: (layout: StickerGroupLayout) => void;
  onRenameTable: (tableOrder: number, name: string) => void;
  onChangeTableLayout: (tableOrder: number, layout: StickerGroupLayout) => void;
  onRemoveTable: (tableOrder: number) => void;
  onMoveTable: (fromOrder: number, toOrder: number) => void;
}

export interface EditTemplateFormProps {
  templates: Template[];
  selectedTemplateId: string;
  name: string;
  isActive: boolean;
  insideDraft: TemplateField[];
  outsideDraft: TemplateField[];
  stickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  notice: TemplateFormNotice | undefined;
  loadingTemplates: boolean;
  loadingTemplate: boolean;
  savingTemplate: boolean;
  onDismissNotice: () => void;
  onSelectTemplate: (templateId: string) => void;
  onNameChange: (name: string) => void;
  onActiveChange: (isActive: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onStickerDefaultsChange: (defaults: StickerDefaults) => void;
  onSelectPreviewSlot: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
  onChangeField: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAddField: (section: "inside" | "outside", tableOrder?: number, preset?: TemplateFieldPreset) => void;
  onRemoveField: (section: "inside" | "outside", index: number) => void;
  onMoveField: (section: "inside" | "outside", fromIndex: number, toIndex: number, tableOrder?: number) => void;
  onAddTable: (layout: StickerGroupLayout) => void;
  onRenameTable: (tableOrder: number, name: string) => void;
  onChangeTableLayout: (tableOrder: number, layout: StickerGroupLayout) => void;
  onRemoveTable: (tableOrder: number) => void;
  onMoveTable: (fromOrder: number, toOrder: number) => void;
}

export interface SectionHeadingProps {
  number: string;
  title: string;
  subtitle: string;
}

export interface TemplateFieldEditorProps {
  title: string;
  section: "inside" | "outside";
  fields: TemplateField[];
  onChange: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAdd: (section: "inside" | "outside", tableOrder?: number, preset?: TemplateFieldPreset) => void;
  onRemove: (section: "inside" | "outside", index: number) => void;
  onMove: (section: "inside" | "outside", fromIndex: number, toIndex: number, tableOrder?: number) => void;
  onAddTable?: (layout: StickerGroupLayout) => void;
  onRenameTable?: (tableOrder: number, name: string) => void;
  onChangeTableLayout?: (tableOrder: number, layout: StickerGroupLayout) => void;
  onRemoveTable?: (tableOrder: number) => void;
  onMoveTable?: (fromOrder: number, toOrder: number) => void;
}

/** Props for the pieces TemplateFieldEditor is composed of (components/manageTemplate/fieldEditor/). */
export type FieldPatch = (patch: Partial<TemplateField>) => void;
export type FieldDragHandler = (event: DragEvent) => void;

export interface FieldTableHeaderProps {
  field: TemplateField;
  tableOrder: number;
  isDragging: boolean;
  onDragStart: (event: DragEvent, headElement: Element | null) => void;
  onDragEnd: () => void;
  onDragOver: FieldDragHandler;
  onRename: (name: string) => void;
  onChangeLayout: (layout: StickerGroupLayout) => void;
  onRemove: () => void;
}

export interface FieldSummaryRowProps {
  field: TemplateField;
  fieldNumber: number;
  onEdit: () => void;
  onRemove: () => void;
  onDragStart: FieldDragHandler;
  onDragEnd: () => void;
}

export interface SegmentListProps {
  field: TemplateField;
  fieldIndex: number;
  draggingSegmentKey: string | null;
  onChange: FieldPatch;
  onOpenCounterPrompt: (segmentIndex: number) => void;
  onDragStart: (event: DragEvent, segmentIndex: number, segmentKey: string, cardElement: Element | null) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent, segmentIndex: number) => void;
}

export interface FieldSettingsModalProps extends Omit<SegmentListProps, "onOpenCounterPrompt"> {
  open: boolean;
  isVerticalTable: boolean;
  onClose: () => void;
  onOpenCounterPrompt: (segmentIndex?: number) => void;
  onOpenDateFormatPrompt: () => void;
}

export interface DateFormatModalProps {
  open: boolean;
  field: TemplateField;
  onChange: FieldPatch;
  onClose: () => void;
}

export interface AddFieldModalProps {
  open: boolean;
  section: "inside" | "outside";
  pendingPreset: TemplateFieldPreset;
  onPresetChange: (preset: TemplateFieldPreset) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export interface AddTableModalProps {
  open: boolean;
  pendingLayout: StickerGroupLayout;
  onLayoutChange: (layout: StickerGroupLayout) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export interface CounterModalProps {
  open: boolean;
  isCounting: boolean;
  pendingType: CounterType;
  pendingPad4: boolean;
  onTypeChange: (type: CounterType) => void;
  onPad4Change: (pad4: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  onStop: () => void;
}

export interface StickerTemplatePreviewProps {
  customerName: string;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  layouts: StickerLayouts;
  defaults: StickerDefaults;
  onSelect: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
}

export class TemplateManageModelFactory {
  static createSegments(group: InsideGroup["key"], count: number) {
    return Array.from({ length: count }, (_, index) => ({
      key: `${group}_${index + 1}`,
      isCounter: index === 0,
      counterType: group === "lotNo" ? "lot" as const : "pallet" as const,
      type: index === 0 ? "number" as const : "text" as const,
      label: `SECTION ${index + 1}`,
    }));
  }
}

export const initialGroups: InsideGroup[] = [
  { key: "lotNo", label: "LOT NO.", segments: TemplateManageModelFactory.createSegments("lotNo", 1) },
  { key: "palletNo", label: "PALLET NO.", segments: TemplateManageModelFactory.createSegments("palletNo", 1) },
];

export const fixedInsideFields = [
  { key: "gross", label: "GROSS", required: true },
  { key: "nett", label: "NETT", required: true, defaultValue: "1260" },
  { key: "destination", label: "DESTINATION", required: true },
  { key: "contractNo", label: "CONTRACT NO.", required: true },
] as const;
