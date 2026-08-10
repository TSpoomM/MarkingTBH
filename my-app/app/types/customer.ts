export type FieldType = "text" | "number" | "date" | "textarea";
export type CounterType = "lot" | "pallet";
export type FontScale = "normal" | "large" | "xlarge";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  displayFormat?: string;
  segments?: Array<{
    key: string;
    label: string;
    type?: FieldType;
    prefix?: string;
    suffix?: string;
    showOnSticker?: boolean;
    stickerOrder?: number;
    isCounter?: boolean;
    counterType?: CounterType;
  }>;
  condition?: {
    stickerType?: "TNR" | "NON-TNR" | "FCS";
    stickerOther?: "Dome" | "Inter";
  };
  showOnSticker?: boolean;
  stickerOrder?: number;
  stickerGroup?: string;
  stickerGroupOrder?: number;
  uppercase?: boolean;
  fontScale?: FontScale;
}

export interface Customer {
  id: number;
  name: string;
}

export interface StickerLayouts {
  insideFrame: boolean;
  outsideFrame: boolean;
  customerName: boolean;
  fscLogo: boolean;
}

export interface CustomerTemplate {
  customerId: number;
  customerName: string;
  templateId: number | null;
  sticker: {
    enabledFields: Array<"side" | "format" | "type" | "other">;
    layouts: StickerLayouts;
  };
  inside: TemplateField[];
  outside: TemplateField[];
}
