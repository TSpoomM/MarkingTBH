import type { TemplateDetail, StickerDefaults, TemplateField } from "./template";

export const STICKER_FORMATS = {
  "5533": [5, 5, 3, 3],
  "555": [5, 5, 5],
} as const;

export type StickerField = "side" | "format" | "type" | "other";
export type StickerLayoutKey = "insideFrame" | "outsideFrame" | "customerName" | "fscLogo";
export type CounterType = "lot" | "pallet" | "sequence";

export interface StickerLayouts {
  insideFrame: boolean;
  outsideFrame: boolean;
  customerName: boolean;
  fscLogo: boolean;
}

export const DEFAULT_STICKER_LAYOUTS: StickerLayouts = {
  insideFrame: true,
  outsideFrame: true,
  customerName: false,
  fscLogo: false,
};

export const DEFAULT_STICKER_DEFAULTS: StickerDefaults = {
  sideCount: 1,
  format: "555",
  stickerType: "TNR",
  stickerOther: "Dome",
  stickerFsc: false,
};

export interface SegmentDefinition {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  prefix?: string;
  suffix?: string;
  dateFormat?: TemplateField["dateFormat"];
  isCounter?: boolean;
  counterType?: CounterType;
}

export interface InsideGroup {
  key: "lotNo" | "palletNo";
  label: string;
  segments: SegmentDefinition[];
}

export interface FixedInsideField {
  key: "gross" | "nett" | "destination" | "contractNo";
  label: "GROSS" | "NETT" | "DESTINATION" | "CONTRACT NO.";
  required: true;
}

export interface OutsideField {
  key: string;
  label: string;
  required: boolean;
  condition?: {
    stickerType?: "TNR" | "NON TNR";
    stickerOther?: "Dome" | "Inter";
  };
  showOnSticker?: boolean;
  stickerOrder?: number;
  system?: boolean;
  uppercase?: boolean;
  defaultValue?: string;
  dateFormat?: TemplateField["dateFormat"];
  locked?: boolean;
}

export interface OutsideTable {
  id: string;
  name: string;
  fields: OutsideField[];
}

export interface TemplateConfiguration {
  version: 2;
  sticker: {
    enabledFields: StickerField[];
    layouts: StickerLayouts;
    defaults: StickerDefaults;
  };
  inside: {
    groups: InsideGroup[];
    fields: FixedInsideField[];
  };
  outside: { tables: OutsideTable[] };
}

export interface CreateTemplatePayload {
  name: string;
  isActive?: boolean;
  configuration: TemplateConfiguration;
  template?: Pick<TemplateDetail, "sticker"> & {
    inside: TemplateField[];
    outside: TemplateField[];
  };
}
