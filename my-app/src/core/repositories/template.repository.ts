import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/db";
import type { ActiveColumnRow, TemplateListRow, TemplateRow } from "@/src/core/models/database";
import type { TemplateHistoryItem } from "@/src/core/models/history";

export class TemplateRepository {
  private activeColumn: { tableName: "tb_template"; columnName: string; columnType: string } | null | undefined;

  constructor(private readonly pool: Pool) {}

  private async findActiveColumn() {
    if (this.activeColumn !== undefined) return this.activeColumn;
    const [rows] = await this.pool.query<Array<ActiveColumnRow & { table_name: "tb_template" }>>(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'tb_template'
         AND COLUMN_NAME IN ('is_active', 'active', 'c_active', 'status')
       ORDER BY FIELD(COLUMN_NAME, 'is_active', 'active', 'c_active', 'status')
       LIMIT 1`,
    );
    this.activeColumn = rows[0]
      ? { tableName: rows[0].table_name, columnName: rows[0].column_name, columnType: rows[0].column_type }
      : null;
    return this.activeColumn;
  }

  private columnRef(alias: "t", columnName: string) {
    return `${alias}.\`${columnName}\``;
  }

  private countTemplateFields(value: unknown, section: "inside" | "outside") {
    try {
      const parsed: unknown = JSON.parse(String(value ?? ""));
      if (Array.isArray(parsed)) return parsed.length;
      if (!parsed || typeof parsed !== "object") return 0;
      const config = parsed as {
        groups?: unknown[];
        fields?: unknown[];
        tables?: Array<{ fields?: unknown[] }>;
      };
      if (section === "inside") return (config.groups?.length ?? 0) + (config.fields?.length ?? 0);
      if (Array.isArray(config.tables)) {
        return config.tables.reduce((count, table) => count + (table.fields?.length ?? 0), 0);
      }
      return config.fields?.length ?? 0;
    } catch {
      return 0;
    }
  }

  private isoDate(value: unknown) {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString();
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

  private activeValue(isActive: boolean, activeColumn: NonNullable<TemplateRepository["activeColumn"]>) {
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
      ? this.columnRef("t", activeColumn.columnName)
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
    const [rows] = await this.pool.query<TemplateListRow[]>(
      `SELECT t.id, t.c_name, ${activeExpression} AS is_active
       FROM tb_template t
       ${whereClause}
         ${whereClause ? "AND" : "WHERE"} t.id = (
         SELECT latest_template.id
         FROM tb_template latest_template
         WHERE latest_template.id = t.id
         ORDER BY latest_template.created_date DESC, latest_template.id DESC
         LIMIT 1
       )
       ORDER BY is_active DESC, c_name ASC`,
    );
    return rows;
  }

  async findHistory(): Promise<TemplateHistoryItem[]> {
    const [rows] = await this.pool.query<Array<RowDataPacket & {
      id: number;
      c_name: string;
      inside: string | null;
      outside: string | null;
      created_by: string | null;
      created_date: Date | string | null;
      first_log_date: Date | string | null;
      last_template_log_date: Date | string | null;
    }>>(
      `SELECT
         t.id,
         t.c_name,
         t.inside,
         t.outside,
         t.created_by,
         t.created_date,
         (
           SELECT MIN(l.createdDate)
           FROM tb_action_log l
           WHERE l.action LIKE CONCAT('%(ID ', t.id, ')%')
              OR l.action LIKE CONCAT('%ลูกค้าใหม่%ID ', t.id, '%')
         ) AS first_log_date,
         (
           SELECT MAX(l.createdDate)
           FROM tb_action_log l
           WHERE l.action LIKE CONCAT('%Template%ID ', t.id, '%')
         ) AS last_template_log_date
       FROM tb_template t
       ORDER BY COALESCE(t.created_date, '1970-01-01') DESC, t.c_name ASC`,
    );

    return rows.map((row) => {
      const updatedAt = this.isoDate(row.last_template_log_date ?? row.created_date);
      return {
        id: Number(row.id),
        name: String(row.c_name ?? ""),
        createdAt: this.isoDate(row.first_log_date ?? row.created_date),
        updatedAt,
        updatedBy: String(row.created_by ?? ""),
        insideFieldCount: this.countTemplateFields(row.inside, "inside"),
        outsideFieldCount: this.countTemplateFields(row.outside, "outside"),
      };
    });
  }

  async updateName(templateId: number, name: string) {
    const template = await this.findLatestTemplate(templateId);
    if (!template) return 0;
    const [result] = await this.pool.execute<ResultSetHeader>(
      "UPDATE tb_template SET c_name = ? WHERE id = ?",
      [name, template.id],
    );
    return result.affectedRows;
  }

  async updateActive(templateId: number, isActive: boolean) {
    const activeColumn = await this.findActiveColumn();
    if (!activeColumn) {
      const template = await this.findLatestTemplate(templateId);
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
    const template = await this.findLatestTemplate(templateId);
    if (!template) return 0;
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tb_template SET \`${activeColumn.columnName}\` = ? WHERE id = ?`,
      [value, template.id],
    );
    return result.affectedRows;
  }

  async findLatestTemplate(templateId: number) {
    const [rows] = await this.pool.execute<TemplateRow[]>(
      `SELECT id, id, c_name, inside, outside
       FROM tb_template
       WHERE id = ?
       ORDER BY created_date DESC, id DESC
       LIMIT 1`,
      [templateId],
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
      const [nextTemplateListRows] = await connection.execute<Array<RowDataPacket & { next_id: number }>>(
        "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM tb_template",
      );
      const templateId = Number(nextTemplateListRows[0]?.next_id ?? 1);
      await connection.execute<ResultSetHeader>(
        activeColumn
          ? `INSERT INTO tb_template (id, c_name, inside, outside, created_by, created_date, \`${activeColumn.columnName}\`)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`
          : `INSERT INTO tb_template (id, c_name, inside, outside, created_by, created_date)
             VALUES (?, ?, ?, ?, ?, NOW())`,
        activeColumn
          ? [templateId, name, inside, outside, createdBy, activeDbValue]
          : [templateId, name, insideWithActive, outside, createdBy],
      );
      await connection.commit();
      return templateId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const templateRepository = new TemplateRepository(pool);
