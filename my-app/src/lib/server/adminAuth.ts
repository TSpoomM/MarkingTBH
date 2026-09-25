import { currentUserService } from "@/src/lib/server/currentUser";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";
import type { AdminAccess } from "@/src/core/models/auth";
import { adminRepository } from "@/src/core/repositories/admin.repository";
import type { AdminRole } from "@/src/core/models/database";

/** How long a looked-up role is reused; keeps the tb_admin query off the hot path of every API call. */
const ROLE_CACHE_TTL_MS = 30 * 1000;

export class AdminAuthService {
  private readonly roleCache = new Map<string, { role: AdminRole | null; expiresAt: number }>();

  private getAdminUserIds(): Set<string> {
    const raw = process.env.ADMIN_USER_IDS || "";
    return new Set(
      raw
        .split(",")
        .map((id) => currentUserService.normalizeUserId(id))
        .filter(Boolean)
    );
  }

  /** Called after admins are added, changed or removed so the change applies immediately in this process. */
  clearRoleCache() {
    this.roleCache.clear();
  }

  async getUserRole(userId: string): Promise<AdminRole | null> {
    const normalizedId = currentUserService.normalizeUserId(userId);
    if (!normalizedId) return null;

    const cached = this.roleCache.get(normalizedId);
    if (cached && cached.expiresAt > Date.now()) return cached.role;

    try {
      const admin = await adminRepository.findByFsId(normalizedId);
      const role = admin?.role === "admin" || admin?.role === "super_admin"
        ? admin.role
        : this.getAdminUserIds().has(normalizedId) ? "admin" : null;
      this.roleCache.set(normalizedId, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
      return role;
    } catch (error) {
      // A failed lookup is not cached, so the next request tries the database again.
      console.error("Admin role lookup failed", error);
    }

    return this.getAdminUserIds().has(normalizedId) ? "admin" : null;
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    return Boolean(await this.getUserRole(userId));
  }

  async isUserSuperAdmin(userId: string): Promise<boolean> {
    return (await this.getUserRole(userId)) === "super_admin";
  }

  async getAccess(request: Request): Promise<AdminAccess> {
    const userId = await requestCurrentUserService.getCurrentUserId(request);
    const role = await this.getUserRole(userId);
    const isSuperAdmin = role === "super_admin";

    return {
      userId,
      isAdmin: role === "admin" || isSuperAdmin,
      isSuperAdmin,
      role,
      canManageAdmins: isSuperAdmin,
    };
  }

  async requireAdmin(request: Request): Promise<AdminAccess> {
    return this.getAccess(request);
  }
}

export const adminAuthService = new AdminAuthService();
