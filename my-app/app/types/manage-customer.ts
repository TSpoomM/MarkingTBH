import type { Customer, StickerDefaults, TemplateField } from "@/app/types/customer";
import type {
  FixedInsideField,
  InsideGroup,
  OutsideTable,
  StickerField,
  StickerLayouts,
} from "@/app/types/customer-form";
import type { FormEvent, ReactNode } from "react";

export type CustomerFormNotice = { kind: "error" | "success"; text: string };
export type CustomerManageMode = "edit" | "create";
export type FieldCondition = TemplateField["condition"];

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

export interface CustomerFormState {
  mode: CustomerManageMode;
  customers: Customer[];
  selectedCustomerId: string;
  templateName: string;
  templateInsideDraft: TemplateField[];
  templateOutsideDraft: TemplateField[];
  createInsideDraft: TemplateField[];
  createOutsideDraft: TemplateField[];
  duplicateSourceCustomerId: string;
  name: string;
  stickerFields: StickerField[];
  templateStickerFields: StickerField[];
  stickerLayouts: StickerLayouts;
  templateStickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  templateStickerDefaults: StickerDefaults;
  groups: InsideGroup[];
  tables: OutsideTable[];
  notice: CustomerFormNotice | undefined;
  templateNotice: CustomerFormNotice | undefined;
  duplicateNamePrompt: { customerId: string; name: string } | undefined;
  isAdmin: boolean;
  checkingRole: boolean;
  loadingCustomers: boolean;
  loadingTemplate: boolean;
  duplicatingTemplate: boolean;
  savingTemplate: boolean;
  saving: boolean;
}

export interface CreateCustomerFormProps {
  customers: Customer[];
  name: string;
  duplicateSourceCustomerId: string;
  stickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  groups: InsideGroup[];
  tables: OutsideTable[];
  fixedInsideFields: readonly FixedInsideField[];
  insideDraft: TemplateField[];
  outsideDraft: TemplateField[];
  notice: CustomerFormNotice | undefined;
  loadingCustomers: boolean;
  duplicatingTemplate: boolean;
  saving: boolean;
  onDismissNotice: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNameChange: (name: string) => void;
  onDuplicateSourceChange: (customerId: string) => void;
  onStickerDefaultsChange: (defaults: StickerDefaults) => void;
  onSegmentCountChange: (groupKey: InsideGroup["key"], count: number) => void;
  onGroupSegmentChange: (groupKey: InsideGroup["key"], segmentIndex: number, label: string) => void;
  onTablesChange: (updater: (tables: OutsideTable[]) => OutsideTable[]) => void;
  onTableUpdate: (tableId: string, update: (table: OutsideTable) => OutsideTable) => void;
  onSelectPreviewSlot: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
  onChangeField: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAddField: (section: "inside" | "outside", tableOrder?: number) => void;
  onRemoveField: (section: "inside" | "outside", index: number) => void;
  onMoveField: (section: "inside" | "outside", fromIndex: number, toIndex: number) => void;
  onAddTable: () => void;
  onRenameTable: (tableOrder: number, name: string) => void;
  onRemoveTable: (tableOrder: number) => void;
  onMoveTable: (fromOrder: number, toOrder: number) => void;
}

export interface EditCustomerTemplateProps {
  customers: Customer[];
  selectedCustomerId: string;
  name: string;
  insideDraft: TemplateField[];
  outsideDraft: TemplateField[];
  stickerLayouts: StickerLayouts;
  stickerDefaults: StickerDefaults;
  notice: CustomerFormNotice | undefined;
  loadingCustomers: boolean;
  loadingTemplate: boolean;
  savingTemplate: boolean;
  onDismissNotice: () => void;
  onSelectCustomer: (customerId: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStickerDefaultsChange: (defaults: StickerDefaults) => void;
  onSelectPreviewSlot: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
  onChangeField: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAddField: (section: "inside" | "outside", tableOrder?: number) => void;
  onRemoveField: (section: "inside" | "outside", index: number) => void;
  onMoveField: (section: "inside" | "outside", fromIndex: number, toIndex: number) => void;
  onAddTable: () => void;
  onRenameTable: (tableOrder: number, name: string) => void;
  onRemoveTable: (tableOrder: number) => void;
  onMoveTable: (fromOrder: number, toOrder: number) => void;
}

export interface SectionHeadingProps {
  number: string;
  title: string;
  subtitle: string;
}

export interface OptionGroupProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export interface ChoiceProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

export interface ConditionSelectorProps {
  value: FieldCondition;
  disabled?: boolean;
  onChange: (condition: FieldCondition) => void;
}

export interface TemplateFieldEditorProps {
  title: string;
  section: "inside" | "outside";
  fields: TemplateField[];
  onChange: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAdd: (section: "inside" | "outside", tableOrder?: number) => void;
  onRemove: (section: "inside" | "outside", index: number) => void;
  onMove: (section: "inside" | "outside", fromIndex: number, toIndex: number) => void;
  onAddTable?: () => void;
  onRenameTable?: (tableOrder: number, name: string) => void;
  onRemoveTable?: (tableOrder: number) => void;
  onMoveTable?: (fromOrder: number, toOrder: number) => void;
}

export interface StickerTemplatePreviewProps {
  customerName: string;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  layouts: StickerLayouts;
  defaults: StickerDefaults;
  onSelect: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
}

export interface PreviewStickerProps {
  title: string;
  section: "inside" | "outside";
  customerName: string;
  fields: TemplateField[];
  onSelect: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
}

export const createSegments = (group: InsideGroup["key"], count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `${group}_${index + 1}`,
    isCounter: index === 0,
    counterType: group === "lotNo" ? "lot" as const : "pallet" as const,
    type: index === 0 ? "number" as const : "text" as const,
    label: `ส่วนที่ ${index + 1}`,
  }));

export const initialGroups: InsideGroup[] = [
  { key: "lotNo", label: "LOT NO.", segments: createSegments("lotNo", 1) },
  { key: "palletNo", label: "PALLET NO.", segments: createSegments("palletNo", 1) },
];

export const fixedInsideFields = [
  { key: "gross", label: "GROSS", required: true },
  { key: "nett", label: "NETT", required: true },
  { key: "destination", label: "DESTINATION", required: true },
  { key: "contractNo", label: "CONTRACT NO.", required: true },
] as const;
