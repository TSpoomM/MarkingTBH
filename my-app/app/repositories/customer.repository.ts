import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../lib/db";

export type CustomerRow = RowDataPacket & { c_id: number; c_name: string };
export type TemplateRow = RowDataPacket & {
  id: number;
  c_id: number;
  inside: string | null;
  outside: string | null;
};

export async function findCustomers() {
  const [rows] = await db.query<CustomerRow[]>(
    "SELECT c_id, c_name FROM tb_customer ORDER BY c_name ASC",
  );
  return rows;
}

export async function findLatestTemplateByCustomer(customerId: number) {
  const [rows] = await db.execute<TemplateRow[]>(
    `SELECT id, c_id, inside, outside
     FROM tb_template
     WHERE c_id = ?
     ORDER BY created_date DESC, id DESC
     LIMIT 1`,
    [customerId],
  );
  return rows[0] ?? null;
}

export async function updateOutsideTemplate(
  templateId: number,
  outside: string,
  updatedBy: string,
) {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE tb_template
     SET outside = ?, created_by = ?, created_date = NOW()
     WHERE id = ?`,
    [outside, updatedBy, templateId],
  );
  return result.affectedRows;
}
