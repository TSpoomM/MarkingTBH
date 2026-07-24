export const STICKER_FORMATS = {
  "5533": [5, 5, 3, 3],
  "555": [5, 5, 5],
} as const;

export type StickerField = "side" | "format" | "type" | "other";

export interface SegmentDefinition {
  key: string;
  label: string;
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
  condition?: { stickerType: "TNR" };
  system?: boolean;
}

export interface OutsideTable {
  id: string;
  name: string;
  fields: OutsideField[];
}

export interface CustomerConfiguration {
  version: 2;
  sticker: {
    enabledFields: StickerField[];
  };
  inside: {
    groups: InsideGroup[];
    fields: FixedInsideField[];
  };
  outside: { tables: OutsideTable[] };
}

export interface CreateCustomerPayload {
  name: string;
  configuration: CustomerConfiguration;
}
