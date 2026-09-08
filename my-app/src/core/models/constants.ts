import type { MarkingState } from "@/src/core/models/marking";
import type { FontScale } from "@/src/core/models/template";

export const FONT_SCALE_MULTIPLIERS: Record<NonNullable<FontScale>, number> = {
  normal: 1,
  xlarge: 1.7,
};

export const STICKER_PAGE_CLASS: Record<"frame" | "frameVertical" | "customerName" | "fsc", string> = {
  frame: "sticker-page-frame",
  frameVertical: "sticker-page-frame-vertical",
  customerName: "sticker-page-template",
  fsc: "sticker-page-fsc",
};

export const STICKER_SIDE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const STICKER_FORMAT_OPTIONS = ["5533", "555"] as const;
export const STICKER_FORMAT_PALLETS = {
  "5533": [5, 5, 3, 3],
  "555": [5, 5, 5],
} as const;
export const STICKER_TYPE_OPTIONS = ["TNR", "NON TNR"] as const;
export const STICKER_OTHER_OPTIONS = ["Dome", "Inter"] as const;

export const INITIAL_MARKING_STATE: MarkingState = {
  templates: [],
  templateId: "",
  template: null,
  totalLot: "",
  stickerSides: "",
  stickerFormat: "",
  stickerType: "",
  stickerFsc: false,
  stickerOther: "",
  printSections: {
    insideFrame: true,
    outsideFrame: true,
    customerName: false,
    fscLogo: true,
  },
  printOutsideGroups: {},
  lotCount: "1",
  lotStart: 1,
  productionDate: "",
  insideRows: [],
  outsideRows: [],
  isAdmin: false,
  isLoading: true,
  isSaving: false,
  isExportModalOpen: false,
  isPrintSheetActive: false,
  notice: null,
};

export const MESSAGES = {
  selectTemplate: "กรุณาเลือกลูกค้า",
  enterLot: "กรุณากรอกจำนวน Lot ให้ถูดต้อง",
  loadFailed: "โหลดข้อมูลไม่สำเร็จ",
  saveFailed: "บันทึกไม่สำเร็จ",
} as const;
