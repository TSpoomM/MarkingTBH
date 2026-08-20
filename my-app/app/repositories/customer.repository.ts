import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";
import type { ActiveColumnRow, CustomerRow, TemplateRow } from "@/app/types/database";

export class CustomerRepository {
  private activeColumn: { tableName: "tb_customer" | "tb_template"; columnName: string; columnType: string } | null | undefined;

  constructor(private readonly pool: Pool) {}

  private async findActiveColumn() {
    if (this.activeColumn !== undefined) return this.activeColumn;
    const [rows] = await this.pool.query<Array<ActiveColumnRow & { table_name: "tb_customer" | "tb_template" }>>(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('tb_template', 'tb_customer')
         AND COLUMN_NAME IN ('is_active', 'active', 'c_active', 'status')
       ORDER BY FIELD(TABLE_NAME, 'tb_template', 'tb_customer'),
         FIELD(COLUMN_NAME, 'is_active', 'active', 'c_active', 'status')
       LIMIT 1`,
    );
    this.activeColumn = rows[0]
      ? { tableName: rows[0].table_name, columnName: rows[0].column_name, columnType: rows[0].column_type }
      : null;
    return this.activeColumn;
  }

  private columnRef(alias: "c" | "t", columnName: string) {
    return `${alias}.\`${columnName}\``;
  }

  private activeValue(isActive: boolean, activeColumn: NonNullable<CustomerRepository["activeColumn"]>) {
    const columnType = activeColumn.columnType.toLowerCase();
    const columnName = activeColumn.columnName.toLowerCase();
    if (columnType.includes("'inactive'") || columnType.includes("'active'") || columnName === "status") {
      return isActive ? "active" : "inactive";
    }
    if (columnType.includes("'n'") && columnType.includes("'y'")) {
      return isActive ? "Y" : "N";
    }
    return isActive ? 1 : 0;
  }

  async findAll(includeInactive = false) {
    const activeColumn = await this.findActiveColumn();
    const activeSource = activeColumn
      ? this.columnRef(activeColumn.tableName === "tb_template" ? "t" : "c", activeColumn.columnName)
      : null;
    const activeExpression = activeColumn
      ? `CASE
          WHEN LOWER(TRIM(CAST(${activeSource} AS CHAR))) IN ('', '0', 'false', 'inactive', 'disabled', 'n', 'no') THEN 0
          ELSE 1
        END`
      : `CASE
          WHEN t.inside IS NULL OR JSON_VALID(t.inside) = 0 THEN 1
          WHEN JSON_EXTRACT(t.inside, '$.sticker.isActive') IS NULL THEN 1
          WHEN LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(t.inside, '$.sticker.isActive')))) IN ('', '0', 'false', 'inactive', 'disabled', 'n', 'no') THEN 0
          ELSE 1
        END`;
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

  async updateActive(customerId: number, isActive: boolean) {
    const activeColumn = await this.findActiveColumn();
    if (!activeColumn) {
      const template = await this.findLatestTemplate(customerId);
      if (!template) return 0;
      const parsed = JSON.parse(template.inside || "{}") as { sticker?: Record<string, unknown> };
      const nextInside = JSON.stringify({
        ...parsed,
        sticker: {
          ...(parsed.sticker ?? {}),
          isActive,
        },
      });
      const [result] = await this.pool.execute<ResultSetHeader>(
        "UPDATE tb_template SET inside = ? WHERE id = ?",
        [nextInside, template.id],
      );
      return result.affectedRows;
    }
    const value = this.activeValue(isActive, activeColumn);
    if (activeColumn.tableName === "tb_customer") {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `UPDATE tb_customer SET \`${activeColumn.columnName}\` = ? WHERE c_id = ?`,
        [value, customerId],
      );
      return result.affectedRows;
    }
    const template = await this.findLatestTemplate(customerId);
    if (!template) return 0;
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tb_template SET \`${activeColumn.columnName}\` = ? WHERE id = ?`,
      [value, template.id],
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
    isActive = true,
  ) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const activeColumn = await this.findActiveColumn();
      const activeDbValue = activeColumn ? this.activeValue(isActive, activeColumn) : 1;
      const insideWithActive = activeColumn ? inside : JSON.stringify({
        ...JSON.parse(inside || "{}"),
        sticker: {
          ...((JSON.parse(inside || "{}") as { sticker?: Record<string, unknown> }).sticker ?? {}),
          isActive,
        },
      });
      const [customerResult] = await connection.execute<ResultSetHeader>(
        activeColumn?.tableName === "tb_customer"
          ? `INSERT INTO tb_customer (c_name, \`${activeColumn.columnName}\`) VALUES (?, ?)`
          : "INSERT INTO tb_customer (c_name) VALUES (?)",
        activeColumn?.tableName === "tb_customer" ? [name, activeDbValue] : [name],
      );
      await connection.execute<ResultSetHeader>(
        activeColumn?.tableName === "tb_template"
          ? `INSERT INTO tb_template (c_id, inside, outside, created_by, created_date, \`${activeColumn.columnName}\`)
             VALUES (?, ?, ?, ?, NOW(), ?)`
          : `INSERT INTO tb_template (c_id, inside, outside, created_by, created_date)
             VALUES (?, ?, ?, ?, NOW())`,
        activeColumn?.tableName === "tb_template"
          ? [customerResult.insertId, inside, outside, createdBy, activeDbValue]
          : [customerResult.insertId, insideWithActive, outside, createdBy],
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
