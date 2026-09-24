import { z } from "zod";
import {
  markingRepository,
  MarkingRepository,
} from "@/src/core/repositories/marking.repository";
import { employeeRepository, EmployeeRepository } from "@/src/core/repositories/employee.repository";

export const markingSchema = z.object({
  templateId: z.coerce.number().int().positive("กรุณาเลือกลูกค้า"),
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
  printSections: z.record(z.string(), z.boolean()).optional(),
});

const nextLotQuerySchema = z.object({
  templateId: z.number({ error: "รหัสลูกค้าไม่ถูกต้อง" }).int("รหัสลูกค้าไม่ถูกต้อง").positive("รหัสลูกค้าไม่ถูกต้อง"),
  productionYear: z.number({ error: "Production date ไม่ถูกต้อง" }).int("Production date ไม่ถูกต้อง").min(2000, "Production date ไม่ถูกต้อง"),
});

const HISTORY_MAX_LIMIT = 300;

export class MarkingService {
  constructor(
    private readonly repository: MarkingRepository,
    private readonly employees: EmployeeRepository,
  ) {}

  /** `rawLimit` is the untrusted query-string value; it is clamped to 1..HISTORY_MAX_LIMIT. */
  getHistory(rawLimit: string | null) {
    const limit = Math.min(Math.max(Number(rawLimit ?? 100), 1), HISTORY_MAX_LIMIT);
    return this.repository.findHistory(limit);
  }

  /** Validates the raw route inputs; throws ZodError with the message to show the caller. */
  parseNextLotQuery(rawTemplateId: string, productionDate: string) {
    return nextLotQuerySchema.parse({
      templateId: Number(rawTemplateId),
      productionYear: Number(productionDate.slice(0, 4)),
    });
  }

  /** Resolves to null when the employee has no branch, since lot numbers are counted per branch. */
  async getNextLotStart(query: z.infer<typeof nextLotQuerySchema>, employeeId: string) {
    const employeeLocation = employeeId ? await this.employees.findLocationByFsId(employeeId) : null;
    if (!employeeLocation) return null;

    const lastLotEnd = await this.repository.findLastLotEnd(query.templateId, query.productionYear, employeeLocation);
    return lastLotEnd + 1;
  }

  async save(payload: unknown, actingEmployeeId?: string) {
    const input = markingSchema.parse(payload);
    const employeeId = actingEmployeeId;
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
