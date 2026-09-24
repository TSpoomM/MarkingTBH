import { pool } from "@/src/lib/server/db";
import { currentUserService } from "@/src/lib/server/currentUser";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";
import type { AdminAccess } from "@/src/core/models/auth";
import { adminRepository } from "@/src/core/repositories/admin.repository";
import type { AdminRole } from "@/src/core/models/database";
import type { EmployeeReportAccessRow } from "@/src/core/models/database";

export class AdminAuthService {
  private getAdminUserIds(): Set<string> {
    const raw = process.env.ADMIN_USER_IDS || "";
    return new Set(
      raw
        .split(",")
        .map((id) => currentUserService.normalizeUserId(id))
        .filter(Boolean)
    );
  }

  async getUserRole(userId: string): Promise<AdminRole | null> {
    const normalizedId = currentUserService.normalizeUserId(userId);
    if (!normalizedId) return null;

    try {
      const admin = await adminRepository.findByFsId(normalizedId);
      if (admin?.role === "admin" || admin?.role === "super_admin") return admin.role;
    } catch (error) {
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
    const isAdmin = role === "admin" || role === "super_admin";
    const isSuperAdmin = role === "super_admin";

    let isBranchManager = false;
    let branch: string | null = null;

    if (!isAdmin) {
      try {
        const [rows] = await pool.query<EmployeeReportAccessRow[]>(
          `
          SELECT section, location_emp
          FROM tb_employee_list
          WHERE fs_id = ?
          LIMIT 1
          `,
          [currentUserService.normalizeUserId(userId)]
        );

        branch = rows[0]?.location_emp?.trim() || null;
        isBranchManager = Number(rows[0]?.section) === 1 && Boolean(branch);
      } catch {
        isBranchManager = false;
        branch = null;
      }
    }

    return {
      userId,
      isAdmin,
      isSuperAdmin,
      role,
      isBranchManager,
      branch,
      canManageAdmins: isSuperAdmin,
      canAccessReport: isAdmin || isBranchManager,
    };
  }

  async requireAdmin(request: Request): Promise<AdminAccess> {
    return this.getAccess(request);
  }
}

export const adminAuthService = new AdminAuthService();
