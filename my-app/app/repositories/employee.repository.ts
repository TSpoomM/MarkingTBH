import type { RowDataPacket } from "mysql2";
import { database, Database } from "../lib/db";

type EmployeeRow = RowDataPacket & { fs_id: string };

export class EmployeeRepository {
  constructor(private readonly database: Database) {}

  async findDefaultFsId() {
    const [rows] = await this.database.pool.query<EmployeeRow[]>(
      `SELECT fs_id
       FROM tb_employee_list
       WHERE fs_id IS NOT NULL AND TRIM(fs_id) <> ''
       ORDER BY emp_id ASC
       LIMIT 1`,
    );
    return rows[0]?.fs_id ?? null;
  }
}

export const employeeRepository = new EmployeeRepository(database);
