export type FieldType = "text" | "number" | "date" | "textarea";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
};

export type CustomerTemplate = {
  customerId: number;
  customerName: string;
  templateId: number | null;
  inside: TemplateField[];
  outside: TemplateField[];
};

export type MarkingContent = Record<string, string>;

export type CreateMarkingInput = {
  employeeId: string;
  customerId: number;
  totalWeight: number;
  stickerSides: number;
  contentInside: MarkingContent | MarkingContent[];
  contentOutside: MarkingContent | MarkingContent[];
};
