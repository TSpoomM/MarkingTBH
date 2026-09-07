export type FieldType = "text" | "number" | "date" | "textarea";
export type CounterType = "lot" | "pallet" | "sequence";
export type FontScale = "normal" | "xlarge";
export type DatePart = "dd" | "mm" | "mmm" | "yyyy";
export type DateSeparator = "-" | "/" | ".";
export type DateFormat = string;
export type StickerGroupLayout = "2x2" | "8x2";
export type LegacyStickerGroupLayout = StickerGroupLayout | "4x2";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  dateFormat?: DateFormat;
  locked?: boolean;
  displayFormat?: string;
  segments?: Array<{
    key: string;
    label: string;
    type?: FieldType;
    prefix?: string;
    suffix?: string;
    dateFormat?: DateFormat;
    showOnSticker?: boolean;
    stickerOrder?: number;
    isCounter?: boolean;
    counterType?: CounterType;
    counterPad4?: boolean;
  }>;
  condition?: {
    stickerType?: "TNR" | "NON TNR";
    stickerOther?: "Dome" | "Inter";
  };
  showOnSticker?: boolean;
  stickerOrder?: number;
  isCounter?: boolean;
  stickerGroup?: string;
  stickerGroupOrder?: number;
  stickerGroupLayout?: LegacyStickerGroupLayout;
  uppercase?: boolean;
  counterType?: CounterType;
  counterPad4?: boolean;
  fontScale?: FontScale;
  hideLabel?: boolean;
}

export interface Template {
  id: number;
  name: string;
  isActive: boolean;
}

export interface StickerLayouts {
  insideFrame: boolean;
  outsideFrame: boolean;
  customerName: boolean;
  fscLogo: boolean;
}

export interface StickerDefaults {
  sideCount: number;
  format: "5533" | "555";
  stickerType: "TNR" | "NON TNR";
  stickerOther: "Dome" | "Inter";
  stickerFsc: boolean;
}

export interface TemplateDetail {
  id: number;
  customerName: string;
  templateId: number | null;
  sticker: {
    enabledFields: Array<"side" | "format" | "type" | "other">;
    layouts: StickerLayouts;
    defaults: StickerDefaults;
    isActive?: boolean;
  };
  inside: TemplateField[];
  outside: TemplateField[];
}
