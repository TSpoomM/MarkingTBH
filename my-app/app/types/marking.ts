import { Customer, CustomerTemplate, TemplateField } from "./customer";

export type MarkingContent = Record<string, string>;
export type Notice = { type: "error" | "success"; text: string };

export interface MarkingState {
  customers: Customer[];
  customerId: string;
  template: CustomerTemplate | null;
  totalWeight: string;
  stickerSides: string;
  stickerFormat: string;
  stickerType: string;
  stickerOther: string;
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
