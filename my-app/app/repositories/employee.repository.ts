import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";

type EmployeeRow = RowDataPacket & { fs_id: string };
type EmployeeLocationRow = RowDataPacket & { location_emp: string | null };

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
}

export const employeeRepository = new EmployeeRepository(pool);
