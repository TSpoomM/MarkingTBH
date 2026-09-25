import { z } from "zod";
import {
  markingRepository,
  MarkingRepository,
} from "@/src/core/repositories/marking.repository";
import { employeeRepository, EmployeeRepository } from "@/src/core/repositories/employee.repository";
import { destinationRepository, DestinationRepository } from "@/src/core/repositories/destination.repository";
import { templateService, TemplateService } from "@/src/core/services/server/template.service";
import DestinationRules from "@/src/core/marking/destinationRules";
import { LotOverlapError } from "@/src/core/errors/lotOverlapError";
import { UserFacingError } from "@/src/core/errors/userFacingError";
import type { MarkingContent } from "@/src/core/models/marking";

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
  /** Set once the user confirmed that these lot numbers may repeat an earlier marking. */
  allowLotOverlap: z.boolean().optional(),
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
    private readonly templates: TemplateService,
    private readonly destinations: DestinationRepository,
  ) {}

  /**
   * A destination must be one of tb_destination, whatever the form sent: the page may be out of date
   * or the request may not come from the page at all. Returns the rows with destinations written as the list has them.
   */
  private async checkDestinations(templateId: number, inside: MarkingContent[], outside: MarkingContent[]) {
    const template = await this.templates.getTemplate(templateId);
    if (![...template.inside, ...template.outside].some((field) => DestinationRules.isDestinationField(field))) {
      return { inside, outside };
    }
    const options = await this.destinations.findOptions();
    const badInside = DestinationRules.findInvalid(template.inside, inside, options);
    if (badInside) throw new UserFacingError(DestinationRules.describe("Inside", badInside));
    const badOutside = DestinationRules.findInvalid(template.outside, outside, options);
    if (badOutside) throw new UserFacingError(DestinationRules.describe("Outside", badOutside));
    return {
      inside: DestinationRules.canonicalRows(template.inside, inside, options),
      outside: DestinationRules.canonicalRows(template.outside, outside, options),
    };
  }

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
    const checked = await this.checkDestinations(input.templateId, stampAction(input.contentInside), stampAction(input.contentOutside));
    const record = {
      ...input,
      employeeId,
      contentInside: checked.inside,
      contentOutside: checked.outside,
    };

    // Lot numbers are counted per branch; without one there is no series to check.
    // A repeated lot is allowed when the user confirmed it, so that path needs no check or lock.
    const branch = await this.employees.findLocationByFsId(employeeId);
    if (!branch || input.allowLotOverlap) return { id: await this.repository.create(record) };

    // The form's lot start was read when the page loaded, so another save may have used it since.
    // Checking and inserting under one lock per series keeps two saves from both passing the check.
    const year = Number(input.productionDate.slice(0, 4));
    const lotEnd = input.lotStart + input.lotCount - 1;
    const id = await this.repository.withLock(`marking-lot:${input.templateId}:${year}:${branch}`, async (db) => {
      if (await this.repository.hasLotOverlap(input.templateId, year, branch, input.lotStart, lotEnd, db)) {
        throw new LotOverlapError(input.lotStart, lotEnd);
      }
      return this.repository.create(record, db);
    });
    return { id };
  }
}

export const markingService = new MarkingService(markingRepository, employeeRepository, templateService, destinationRepository);
