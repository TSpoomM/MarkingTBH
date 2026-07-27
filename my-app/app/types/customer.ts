export type FieldType = "text" | "number" | "date" | "textarea";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  segments?: Array<{ key: string; label: string }>;
  condition?: { stickerType: "TNR" };
}

export interface Customer {
  id: number;
  name: string;
}

export interface CustomerTemplate {
  customerId: number;
  customerName: string;
  templateId: number | null;
  sticker: {
    enabledFields: Array<"side" | "format" | "type" | "other">;
  };
  inside: TemplateField[];
  outside: TemplateField[];
}