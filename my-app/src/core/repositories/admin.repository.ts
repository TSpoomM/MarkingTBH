import { pool } from "@/src/lib/db";
import { currentUserService } from "@/src/lib/currentUser";
import type { AdminRole, AdminRow } from "@/src/core/models/database";

export type AdminUser = {
  idUser: number;
  fsId: string;
  name: string;
  role: AdminRole;
  createdDate: string | null;
};

export class AdminRepository {
  private normalizeRole(role: unknown): AdminRole | null {
    if (role === "admin" || role === "super_admin") return role;
    if (role === "superAdmin") return "super_admin";
    return null;
  }

  private toAdminUser(row: AdminRow): AdminUser | null {
    const role = this.normalizeRole(row.role);
    const fsId = currentUserService.normalizeUserId(row.fs_id);
    if (!role || !fsId) return null;

    return {
      idUser: Number(row.idUser),
      fsId,
      name: row.emp_name?.trim() || "ไม่พบชื่อพนักงาน",
      role,
      createdDate: row.createdDate instanceof Date
        ? row.createdDate.toISOString().slice(0, 10)
        : row.createdDate ? String(row.createdDate) : null,
    };
  }

  async findByFsId(fsId: string): Promise<AdminUser | null> {
    const normalizedId = currentUserService.normalizeUserId(fsId);
    if (!normalizedId) return null;

    const [rows] = await pool.query<AdminRow[]>(
      `
      SELECT a.idUser, a.fs_id, a.role, a.userInv, a.createdDate, e.emp_name
      FROM tb_admin a
      LEFT JOIN tb_employee_list e ON TRIM(CAST(e.fs_id AS CHAR)) = TRIM(CAST(a.fs_id AS CHAR))
      WHERE TRIM(CAST(a.fs_id AS CHAR)) = ?
      ORDER BY a.role = 'super_admin' DESC, a.idUser DESC
      LIMIT 1
      `,
      [normalizedId],
    );

    return rows[0] ? this.toAdminUser(rows[0]) : null;
  }

  async findAll(): Promise<AdminUser[]> {
    const [rows] = await pool.query<AdminRow[]>(
      `
      SELECT a.idUser, a.fs_id, a.role, a.userInv, a.createdDate, e.emp_name
      FROM tb_admin a
      LEFT JOIN tb_employee_list e ON TRIM(CAST(e.fs_id AS CHAR)) = TRIM(CAST(a.fs_id AS CHAR))
      ORDER BY a.role = 'super_admin' DESC, e.emp_name ASC, a.fs_id ASC
      `,
    );

    return rows.flatMap((row) => {
      const admin = this.toAdminUser(row);
      return admin ? [admin] : [];
    });
  }

  async upsert(input: { fsId: string; role: AdminRole }): Promise<AdminUser> {
    const fsId = currentUserService.normalizeUserId(input.fsId);
    const existing = await this.findByFsId(fsId);

    if (existing) {
      await pool.query(
        `
        UPDATE tb_admin
        SET role = ?
        WHERE idUser = ?
        `,
        [input.role, existing.idUser],
      );
      return { ...existing, fsId, role: input.role };
    }

    const [result] = await pool.query(
      `
      INSERT INTO tb_admin (fs_id, role, userInv, createdDate)
      VALUES (?, ?, ?, CURDATE())
      `,
      [fsId, input.role, ""],
    );

    return await this.findByFsId(fsId) ?? {
      idUser: Number((result as { insertId?: number }).insertId ?? 0),
      fsId,
      name: fsId,
      role: input.role,
      createdDate: new Date().toISOString().slice(0, 10),
    };
  }

  async deleteById(idUser: number): Promise<AdminUser | null> {
    const [rows] = await pool.query<AdminRow[]>(
      `
      SELECT a.idUser, a.fs_id, a.role, a.userInv, a.createdDate, e.emp_name
      FROM tb_admin a
      LEFT JOIN tb_employee_list e ON TRIM(CAST(e.fs_id AS CHAR)) = TRIM(CAST(a.fs_id AS CHAR))
      WHERE a.idUser = ?
      LIMIT 1
      `,
      [idUser],
    );
    const admin = rows[0] ? this.toAdminUser(rows[0]) : null;
    if (!admin) return null;

    await pool.query(
      `
      DELETE FROM tb_admin
      WHERE idUser = ?
      LIMIT 1
      `,
      [idUser],
    );

    return admin;
  }
}

export const adminRepository = new AdminRepository();
