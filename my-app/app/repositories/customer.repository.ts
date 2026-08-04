import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";
import type { CustomerRow, TemplateRow } from "@/app/types/database";

export class CustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findAll() {
    const [rows] = await this.pool.query<CustomerRow[]>(
      "SELECT c_id, c_name FROM tb_customer ORDER BY c_name ASC",
    );
    return rows;
  }

  async findLatestTemplate(customerId: number) {
    const [rows] = await this.pool.execute<TemplateRow[]>(
      `SELECT id, c_id, inside, outside
       FROM tb_template
       WHERE c_id = ?
       ORDER BY created_date DESC, id DESC
       LIMIT 1`,
      [customerId],
    );
    return rows[0] ?? null;
  }

  async updateOutsideTemplate(templateId: number, outside: string, updatedBy: string) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tb_template
       SET outside = ?, created_by = ?, created_date = NOW()
       WHERE id = ?`,
      [outside, updatedBy, templateId],
    );
    return result.affectedRows;
  }

  async updateTemplate(templateId: number, inside: string, outside: string, updatedBy: string) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tb_template
       SET inside = ?, outside = ?, created_by = ?, created_date = NOW()
       WHERE id = ?`,
      [inside, outside, updatedBy, templateId],
    );
    return result.affectedRows;
  }

  async createWithTemplate(
    name: string,
    inside: string,
    outside: string,
    createdBy: string,
  ) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [customerResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO tb_customer (c_name) VALUES (?)",
        [name],
      );
      await connection.execute<ResultSetHeader>(
        `INSERT INTO tb_template (c_id, inside, outside, created_by, created_date)
         VALUES (?, ?, ?, ?, NOW())`,
        [customerResult.insertId, inside, outside, createdBy],
      );
      await connection.commit();
      return customerResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const customerRepository = new CustomerRepository(pool);
