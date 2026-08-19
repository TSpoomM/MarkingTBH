import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";
import type { ActiveColumnRow, CustomerRow, TemplateRow } from "@/app/types/database";

export class CustomerRepository {
  private activeColumn: { tableName: "tb_customer" | "tb_template"; columnName: string } | null | undefined;

  constructor(private readonly pool: Pool) {}

  private async findActiveColumn() {
    if (this.activeColumn !== undefined) return this.activeColumn;
    const [rows] = await this.pool.query<Array<ActiveColumnRow & { table_name: "tb_customer" | "tb_template" }>>(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('tb_template', 'tb_customer')
         AND COLUMN_NAME IN ('is_active', 'active', 'c_active', 'status')
       ORDER BY FIELD(TABLE_NAME, 'tb_template', 'tb_customer'),
         FIELD(COLUMN_NAME, 'is_active', 'active', 'c_active', 'status')
       LIMIT 1`,
    );
    this.activeColumn = rows[0]
      ? { tableName: rows[0].table_name, columnName: rows[0].column_name }
      : null;
    return this.activeColumn;
  }

  async findAll(includeInactive = false) {
    const activeColumn = await this.findActiveColumn();
    const activeSource = activeColumn
      ? `${activeColumn.tableName === "tb_template" ? "t" : "c"}.${activeColumn.columnName}`
      : null;
    const activeExpression = activeColumn
      ? `CASE
          WHEN LOWER(TRIM(CAST(${activeSource} AS CHAR))) IN ('0', 'false', 'inactive', 'disabled', 'n', 'no') THEN 0
          ELSE 1
        END`
      : "1";
    const whereClause = includeInactive ? "" : `WHERE ${activeExpression} = 1`;
    const [rows] = await this.pool.query<CustomerRow[]>(
      `SELECT c.c_id, c.c_name, ${activeExpression} AS is_active
       FROM tb_customer c
       LEFT JOIN tb_template t ON t.id = (
         SELECT latest_template.id
         FROM tb_template latest_template
         WHERE latest_template.c_id = c.c_id
         ORDER BY latest_template.created_date DESC, latest_template.id DESC
         LIMIT 1
       )
       ${whereClause}
       ORDER BY is_active DESC, c_name ASC`,
    );
    return rows;
  }

  async updateName(customerId: number, name: string) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      "UPDATE tb_customer SET c_name = ? WHERE c_id = ?",
      [name, customerId],
    );
    return result.affectedRows;
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
