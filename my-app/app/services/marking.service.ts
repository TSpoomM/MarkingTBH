import { z } from "zod";
import { findDefaultEmployeeFsId } from "../repositories/employee.repository";
import { createMarking } from "../repositories/marking.repository";

export const markingSchema = z.object({
  employeeId: z.string().trim().min(1).optional(),
  customerId: z.coerce.number().int().positive("กรุณาเลือกลูกค้า"),
  totalWeight: z.coerce.number().positive("น้ำหนักต้องมากกว่า 0"),
  stickerSides: z.coerce.number().int().min(1).max(4),
  contentInside: z.union([
    z.record(z.string(), z.string()),
    z.array(z.record(z.string(), z.string())).min(1),
  ]),
  contentOutside: z.union([
    z.record(z.string(), z.string()),
    z.array(z.record(z.string(), z.string())),
  ]),
});

export async function saveMarking(payload: unknown) {
  const input = markingSchema.parse(payload);
  const employeeId = input.employeeId ?? await findDefaultEmployeeFsId();
  if (!employeeId) {
    throw new Error("ไม่พบข้อมูลพนักงานในระบบ");
  }
  const id = await createMarking({ ...input, employeeId });
  return { id };
}
