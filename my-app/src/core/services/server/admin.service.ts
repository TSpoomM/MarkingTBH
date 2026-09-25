import { z } from "zod";
import { adminRepository, AdminRepository } from "@/src/core/repositories/admin.repository";
import { actionLogger, ActionLogger } from "@/src/lib/server/actionLogger";
import { adminAuthService } from "@/src/lib/server/adminAuth";

const saveSchema = z.object({
  fsId: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1)),
  role: z.enum(["admin", "super_admin", "superAdmin"]).transform((value) => value === "superAdmin" ? "super_admin" : value),
});

const deleteSchema = z.object({
  idUser: z.number().int().positive(),
});

/** Server-side admin-management use cases; callers must already have checked the actor is a super admin. */
export class AdminService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly logger: ActionLogger,
  ) {}

  list() {
    return this.repository.findAll();
  }

  async save(payload: unknown, actorId: string) {
    const input = saveSchema.parse(payload);
    const admin = await this.repository.upsert(input);
    adminAuthService.clearRoleCache();
    await this.logger.log(actorId, `เพิ่ม/แก้ไข admin: ${admin.fsId} (${admin.role})`);
    return admin;
  }

  /** Resolves to null when no admin has the given id. */
  async remove(payload: unknown, actorId: string) {
    const input = deleteSchema.parse(payload);
    const admin = await this.repository.deleteById(input.idUser);
    adminAuthService.clearRoleCache();
    if (admin) await this.logger.log(actorId, `ลบ admin: ${admin.fsId} (${admin.role})`);
    return admin;
  }
}

export const adminService = new AdminService(adminRepository, actionLogger);
