import type { CounterType, StickerGroupLayout } from "@/src/core/models/template";
import type { TemplateFieldPreset } from "@/src/core/models/manage-template";

export const OUTSIDE_TABLE_LAYOUT_OPTIONS: Array<{ value: StickerGroupLayout; label: string; description: string }> = [
  { value: "2x2", label: "2 x 2 แนวนอน", description: "A4 แนวนอน 4 ดวง/หน้า (ค่าเริ่มต้น)" },
  { value: "8x2", label: "8 x 2 แนวตั้ง", description: "A4 แนวตั้ง 16 ดวง/หน้า สำหรับกระดาษสติ๊กเกอร์แนวตั้ง" },
];

export const COUNTER_TYPE_OPTIONS: Array<{ value: CounterType; label: string; description: string }> = [
  { value: "lot", label: "Lot", description: "นับตามเลข Lot ของรอบพิมพ์" },
  { value: "pallet", label: "Pallet", description: "นับตามลำดับ Pallet ในแต่ละ Lot" },
  { value: "sequence", label: "+1 ไปเรื่อยๆ", description: "นับต่อเนื่องไปเรื่อยๆ (คล้าย pallet แต่ไม่วนกลับมา 1 ใหม่)" },
];

export const ADD_FIELD_OPTIONS: Array<{ value: TemplateFieldPreset; label: string; description: string }> = [
  { value: "field", label: "Field ปกติ", description: "เพิ่มช่องข้อมูลทั่วไป แล้วค่อยตั้งค่าเพิ่มเติมได้" },
  { value: "destination", label: "Destination", description: "เพิ่ม Field DESTINATION สำหรับ Autocomplete จาก tb_destination" },
  { value: "section", label: "Section", description: "เพิ่ม Field แบบ Section พร้อมตัวนับเริ่มต้น แล้วค่อยปรับแต่งต่อได้" },
];
