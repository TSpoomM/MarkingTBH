export type FieldType = "text" | "number" | "date" | "textarea";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export interface Customer {
  id: number;
  name: string;
}

export interface CustomerTemplate {
  customerId: number;
  customerName: string;
  templateId: number | null;
  inside: TemplateField[];
  outside: TemplateField[];
}

export type MarkingContent = Record<string, string>;
export type Notice = { type: "error" | "success"; text: string };

export interface MarkingState {
  customers: Customer[];
  customerId: string;
  template: CustomerTemplate | null;
  totalWeight: string;
  stickerSides: string;
  insideRows: MarkingContent[];
  outsideRows: MarkingContent[];
  outsideDraft: TemplateField[];
  isAdmin: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isTemplateEditorOpen: boolean;
  notice: Notice | null;
}

export interface SaveMarkingPayload {
  customerId: number;
  totalWeight: number;
  stickerSides: number;
  contentInside: MarkingContent[];
  contentOutside: MarkingContent[];
}

export interface CreateMarkingInput {
  employeeId: string;
  customerId: number;
  totalWeight: number;
  stickerSides: number;
  contentInside: MarkingContent | MarkingContent[];
  contentOutside: MarkingContent | MarkingContent[];
}
