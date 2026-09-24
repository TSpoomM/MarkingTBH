import { z } from "zod";
import { destinationRepository, DestinationRepository } from "@/src/core/repositories/destination.repository";
import { actionLogger, ActionLogger } from "@/src/lib/server/actionLogger";

const valueSchema = z.string().trim().min(1, "กรุณากรอก destination");
const idText = z.union([z.string(), z.number()]).optional()
  .transform((value) => value == null ? "" : String(value).trim());

const createSchema = z.object({ value: valueSchema });
const updateSchema = z.object({
  value: valueSchema,
  id: idText.pipe(z.string().min(1, "ไม่พบ destination ที่ต้องการแก้ไข")),
});
const deleteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1)),
});

/** Server-side destination use cases: validates the payload, calls the repository and writes the action log. */
export class DestinationService {
  constructor(
    private readonly repository: DestinationRepository,
    private readonly logger: ActionLogger,
  ) {}

  listOptions() {
    return this.repository.findOptions();
  }

  listAll() {
    return this.repository.findAll();
  }

  async create(payload: unknown, actorId: string) {
    const input = createSchema.parse(payload);
    const destination = await this.repository.create(input.value);
    await this.logger.log(actorId, `เพิ่ม destination: ${destination.value}`);
    return destination;
  }

  /** Resolves to null when no destination has the given id. */
  async update(payload: unknown, actorId: string) {
    const input = updateSchema.parse(payload);
    const destination = await this.repository.update(input.id, input.value);
    if (destination) await this.logger.log(actorId, `แก้ไข destination: ${destination.value}`);
    return destination;
  }

  /** Resolves to null when no destination has the given id. */
  async remove(payload: unknown, actorId: string) {
    const input = deleteSchema.parse(payload);
    const destination = await this.repository.delete(input.id);
    if (destination) await this.logger.log(actorId, `ลบ destination: ${destination.value}`);
    return destination;
  }
}

export const destinationService = new DestinationService(destinationRepository, actionLogger);
