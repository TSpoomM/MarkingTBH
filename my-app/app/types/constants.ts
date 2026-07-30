import type { MarkingState } from "../types/marking";

export const STICKER_SIDE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const STICKER_FORMAT_OPTIONS = ["5533", "555"] as const;
export const STICKER_FORMAT_PALLETS = {
  "5533": [5, 5, 3, 3],
  "555": [5, 5, 5],
} as const;
export const STICKER_TYPE_OPTIONS = ["TNR", "NON-TNR", "FCS"] as const;
export const STICKER_OTHER_OPTIONS = ["Dome", "Inter"] as const;

export const INITIAL_MARKING_STATE: MarkingState = {
  customers: [],
  customerId: "",
  template: null,
  totalLot: "",
  stickerSides: "",
  stickerFormat: "",
  stickerType: "",
  stickerOther: "",
  lotCount: "1",
  lotStart: 1,
  productionDate: "",
  insideRows: [],
  outsideRows: [],
  insideDraft: [],
  outsideDraft: [],
  isAdmin: false,
  isLoading: true,
  isSaving: false,
  isTemplateEditorOpen: false,
  notice: null,
};

export const MESSAGES = {
  selectCustomer: "กรุณาเลือกลูกค้า",
  enterLot: "กรุณากรอกจำนวน Lot ให้ถูดต้อง",
  loadFailed: "โหลดข้อมูลไม่สำเร็จ",
  saveFailed: "บันทึกไม่สำเร็จ",
  templateSaved: "อัปเดต Outside Template เรียบร้อยแล้ว",
  fieldLabelRequired: "กรุณากรอกชื่อ Field ให้ครบ",
  duplicateKey: "Key ของแต่ละ Field ต้องไม่ซ้ำกัน",
} as const;
