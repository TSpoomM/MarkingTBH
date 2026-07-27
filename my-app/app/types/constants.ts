import type { MarkingState } from "../types/marking";

export const STICKER_SIDE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const STICKER_FORMAT_OPTIONS = ["5533", "555"] as const;
export const STICKER_TYPE_OPTIONS = ["TNR", "NON-TNR", "FCS"] as const;
export const STICKER_OTHER_OPTIONS = ["Dome", "Inter"] as const;

export const INITIAL_MARKING_STATE: MarkingState = {
  customers: [],
  customerId: "",
  template: null,
  totalWeight: "",
  stickerSides: "",
  stickerFormat: "",
  stickerType: "",
  stickerOther: "",
  insideRows: [],
  outsideRows: [],
  outsideDraft: [],
  isAdmin: false,
  isLoading: true,
  isSaving: false,
  isTemplateEditorOpen: false,
  notice: null,
};

export const MESSAGES = {
  selectCustomer: "กรุณาเลือกลูกค้า",
  enterWeight: "กรุณากรอกน้ำหนักรวม",
  loadFailed: "โหลดข้อมูลไม่สำเร็จ",
  saveFailed: "บันทึกไม่สำเร็จ",
  templateSaved: "อัปเดต Outside Template เรียบร้อยแล้ว",
  fieldLabelRequired: "กรุณากรอกชื่อ Field ให้ครบ",
  duplicateKey: "Key ของแต่ละ Field ต้องไม่ซ้ำกัน",
} as const;
