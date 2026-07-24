import type { MarkingState } from "./types";

export const STICKER_SIDE_OPTIONS = [1, 2, 3, 4] as const;

export const INITIAL_MARKING_STATE: MarkingState = {
  customers: [],
  customerId: "",
  template: null,
  totalWeight: "",
  stickerSides: "2",
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
