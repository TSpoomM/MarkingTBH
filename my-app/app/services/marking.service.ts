import { z } from "zod";
import {
  employeeRepository,
  EmployeeRepository,
} from "@/app/repositories/employee.repository";
import {
  markingRepository,
  MarkingRepository,
} from "@/app/repositories/marking.repository";

export const markingSchema = z.object({
  employeeId: z.string().trim().min(1).optional(),
  customerId: z.coerce.number().int().positive("กรุณาเลือกลูกค้า"),
  totalLot: z.coerce.number().nonnegative(),
  stickerSides: z.coerce.number().int().min(1).max(6),
  lotCount: z.coerce.number().int().min(1),
  lotStart: z.coerce.number().int().min(1),
  productionDate: z.string().trim().min(1),
  actionType: z.enum(["save", "print"]).default("save"),
  contentInside: z.union([
    z.record(z.string(), z.string()),
    z.array(z.record(z.string(), z.string())).min(1),
  ]),
  contentOutside: z.union([
    z.record(z.string(), z.string()),
    z.array(z.record(z.string(), z.string())),
  ]),
});

export class MarkingService {
  constructor(
    private readonly repository: MarkingRepository,
    private readonly employees: EmployeeRepository,
  ) {}

  async save(payload: unknown, actingEmployeeId?: string) {
    const input = markingSchema.parse(payload);
    const employeeId = actingEmployeeId || input.employeeId || await this.employees.findDefaultFsId();
    if (!employeeId) throw new Error("ไม่พบข้อมูลพนักงานในระบบ");
    const stampAction = (content: typeof input.contentInside) => {
      const rows = Array.isArray(content) ? content : [content];
      return rows.map((row) => ({ ...row, action_type: input.actionType }));
    };
    const id = await this.repository.create({
      ...input,
      employeeId,
      contentInside: stampAction(input.contentInside),
      contentOutside: stampAction(input.contentOutside),
    });
    return { id };
  }
}

export const markingService = new MarkingService(markingRepository, employeeRepository);
