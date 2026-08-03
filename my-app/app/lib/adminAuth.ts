import { pool } from "@/app/lib/db";
import { currentUserService } from "@/app/lib/currentUser";
import { getRequestCurrentUserId } from "@/app/lib/requestCurrentUser";
import { RowDataPacket } from "mysql2";

type EmployeeRoleRow = RowDataPacket & {
  position: string | null;
};

type EmployeeReportAccessRow = RowDataPacket & {
  section: string | number | null;
  location_emp: string | null;
};

export type AdminAccess = {
  userId: string;
  isAdmin: boolean;
  isBranchManager: boolean;
  branch: string | null;
  canAccessReport: boolean;
};

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

  private isAdminPosition(position: string | null | undefined) {
    if (!position) return false;
    return /\badmin\b/i.test(position.trim());
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const normalizedId = currentUserService.normalizeUserId(userId);
    if (!normalizedId) return false;

    if (this.getAdminUserIds().has(normalizedId)) return true;

    try {
      const [rows] = await pool.query<EmployeeRoleRow[]>(
        `
        SELECT em.position
        FROM tb_employee_list e
        LEFT JOIN tb_emp_email em ON e.fs_id = em.Code
        WHERE e.fs_id = ?
        LIMIT 1
        `,
        [normalizedId]
      );

      return this.isAdminPosition(rows[0]?.position);
    } catch {
      return false;
    }
  }

  async getAccess(request: Request): Promise<AdminAccess> {
    const userId = await getRequestCurrentUserId(request);
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

export const isUserAdmin = (userId: string) => adminAuthService.isUserAdmin(userId);
export const requireAdmin = (request: Request) => adminAuthService.requireAdmin(request);
