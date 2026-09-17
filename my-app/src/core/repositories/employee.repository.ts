import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/db";
import type { EmployeeLocationRow, EmployeeOptionRow, EmployeeRow } from "@/src/core/models/database";

export type EmployeeOption = {
  fsId: string;
  name: string;
};

export class EmployeeRepository {
  constructor(private readonly pool: Pool) {}

  async findDefaultFsId() {
    const [rows] = await this.pool.query<EmployeeRow[]>(
      `SELECT fs_id
       FROM tb_employee_list
       WHERE fs_id IS NOT NULL AND TRIM(fs_id) <> ''
       ORDER BY emp_id ASC
       LIMIT 1`,
    );
    return rows[0]?.fs_id ?? null;
  }

  async findLocationByFsId(fsId: string) {
    const [rows] = await this.pool.query<EmployeeLocationRow[]>(
      `SELECT location_emp
       FROM tb_employee_list
       WHERE fs_id = ?
       LIMIT 1`,
      [fsId],
    );
    return rows[0]?.location_emp?.trim() || null;
  }

  async findOptions(): Promise<EmployeeOption[]> {
    const [rows] = await this.pool.query<EmployeeOptionRow[]>(
      `SELECT fs_id, emp_name
       FROM tb_employee_list
       WHERE fs_id IS NOT NULL AND TRIM(fs_id) <> ''
         AND emp_name IS NOT NULL AND TRIM(emp_name) <> ''
       ORDER BY emp_name ASC
       LIMIT 1000`,
    );

    return rows.flatMap((row) => {
      const fsId = String(row.fs_id ?? "").trim();
      const name = row.emp_name?.trim() || "";
      return fsId && name ? [{ fsId, name }] : [];
    });
  }
}

export const employeeRepository = new EmployeeRepository(pool);
