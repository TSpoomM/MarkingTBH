import { pool } from "@/src/lib/db";
import { currentUserService } from "@/src/lib/currentUser";
import { requestCurrentUserService } from "@/src/lib/requestCurrentUser";
import type { AdminAccess } from "@/src/core/models/auth";
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

  async isUserAdmin(userId: string): Promise<boolean> {
    const normalizedId = currentUserService.normalizeUserId(userId);
    if (!normalizedId) return false;

    return this.getAdminUserIds().has(normalizedId);
  }

  async getAccess(request: Request): Promise<AdminAccess> {
    const userId = await requestCurrentUserService.getCurrentUserId(request);
    const isAdmin = await this.isUserAdmin(userId);

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
      isBranchManager,
      branch,
      canAccessReport: isAdmin || isBranchManager,
    };
  }

  async requireAdmin(request: Request): Promise<AdminAccess> {
    return this.getAccess(request);
  }
}

export const adminAuthService = new AdminAuthService();
