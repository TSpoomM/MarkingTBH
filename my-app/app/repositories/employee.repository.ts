import type { RowDataPacket } from "mysql2";
import { db } from "../lib/db";

type EmployeeRow = RowDataPacket & { fs_id: string };

export async function findDefaultEmployeeFsId() {
  const [rows] = await db.query<EmployeeRow[]>(
    `SELECT fs_id
     FROM tb_employee_list
     WHERE fs_id IS NOT NULL AND TRIM(fs_id) <> ''
     ORDER BY emp_id ASC
     LIMIT 1`,
  );
  return rows[0]?.fs_id ?? null;
}

