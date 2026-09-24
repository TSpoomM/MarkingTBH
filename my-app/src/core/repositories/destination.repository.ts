import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/db";
import type { DestinationColumnRow, DestinationOptionRow } from "@/src/core/models/database";

export type DestinationItem = {
  id: string;
  value: string;
};

type DestinationColumns = {
  idColumn: string | null;
  valueColumn: string | null;
};

export class DestinationRepository {
  private columns: DestinationColumns | undefined;

  constructor(private readonly pool: Pool) {}

  private async findColumns() {
    if (this.columns !== undefined) return this.columns;
    const [rows] = await this.pool.query<DestinationColumnRow[]>(
      `SELECT COLUMN_NAME AS column_name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'tb_destination'
         AND COLUMN_NAME IN (
           'id', 'idDestination', 'id_destination', 'destination_id', 'c_id',
           'destination', 'c_destination', 'name', 'c_name', 'description'
         )
       ORDER BY FIELD(
         COLUMN_NAME,
         'id', 'idDestination', 'id_destination', 'destination_id', 'c_id',
         'destination', 'c_destination', 'name', 'c_name', 'description'
       )`,
    );
    const columnNames = rows.map((row) => row.column_name);
    this.columns = {
      idColumn: columnNames.find((column) =>
        ["id", "idDestination", "id_destination", "destination_id", "c_id"].includes(column)
      ) ?? null,
      valueColumn: columnNames.find((column) =>
        ["destination", "c_destination", "name", "c_name", "description"].includes(column)
      ) ?? null,
    };
    return this.columns;
  }

  private columnRef(column: string) {
    return `\`${column.replace(/`/g, "``")}\``;
  }

  private normalizeValue(value: string) {
    return value.trim().toLocaleUpperCase("en-US");
  }

  private async requireValueColumn() {
    const { valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");
    return valueColumn;
  }

  async findOptions() {
    const column = await this.requireValueColumn();

    const [rows] = await this.pool.query<DestinationOptionRow[]>(
      `SELECT DISTINCT TRIM(CAST(${this.columnRef(column)} AS CHAR)) AS destination
       FROM tb_destination
       WHERE ${this.columnRef(column)} IS NOT NULL
         AND TRIM(CAST(${this.columnRef(column)} AS CHAR)) <> ''
       ORDER BY destination ASC`,
    );

    return rows.map((row) => String(row.destination ?? "").trim()).filter(Boolean);
  }

  async findAll(): Promise<DestinationItem[]> {
    const { idColumn, valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");

    const idSelect = idColumn
      ? `CAST(${this.columnRef(idColumn)} AS CHAR) AS id`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS id`;
    const [rows] = await this.pool.query<Array<RowDataPacket & { id: string | number | null; destination: string | null }>>(
      `SELECT ${idSelect}, TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS destination
       FROM tb_destination
       WHERE ${this.columnRef(valueColumn)} IS NOT NULL
         AND TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) <> ''
       ORDER BY destination ASC`,
    );

    return rows.map((row) => ({
      id: String(row.id ?? "").trim(),
      value: String(row.destination ?? "").trim(),
    })).filter((item) => item.id && item.value);
  }

  async create(value: string): Promise<DestinationItem> {
    const column = await this.requireValueColumn();
    const normalizedValue = this.normalizeValue(value);
    const existing = await this.findByValue(normalizedValue);
    if (existing) throw new Error("Destination นี้มีอยู่แล้ว");

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO tb_destination (${this.columnRef(column)}) VALUES (?)`,
      [normalizedValue],
    );

    const created = await this.findByInsertedIdOrValue(result.insertId, normalizedValue);
    return created ?? { id: String(result.insertId || normalizedValue), value: normalizedValue };
  }

  async update(id: string, value: string): Promise<DestinationItem | null> {
    const { idColumn, valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");

    const normalizedValue = this.normalizeValue(value);
    const existing = await this.findByValue(normalizedValue);
    if (existing && existing.id !== id) throw new Error("Destination นี้มีอยู่แล้ว");

    const whereClause = idColumn
      ? `${this.columnRef(idColumn)} = ?`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) = ?`;
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE tb_destination
       SET ${this.columnRef(valueColumn)} = ?
       WHERE ${whereClause}
       LIMIT 1`,
      [normalizedValue, id],
    );
    if (result.affectedRows === 0) return null;
    return await this.findByIdOrValue(id, normalizedValue);
  }

  async delete(id: string): Promise<DestinationItem | null> {
    const item = await this.findByIdOrValue(id);
    if (!item) return null;

    const { idColumn, valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");
    const whereClause = idColumn
      ? `${this.columnRef(idColumn)} = ?`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) = ?`;

    await this.pool.execute<ResultSetHeader>(
      `DELETE FROM tb_destination
       WHERE ${whereClause}
       LIMIT 1`,
      [id],
    );

    return item;
  }

  private async findByValue(value: string) {
    const { idColumn, valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");
    const idSelect = idColumn
      ? `CAST(${this.columnRef(idColumn)} AS CHAR) AS id`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS id`;
    const [rows] = await this.pool.execute<Array<RowDataPacket & { id: string | number | null; destination: string | null }>>(
      `SELECT ${idSelect}, TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS destination
       FROM tb_destination
       WHERE TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) = ?
       LIMIT 1`,
      [value],
    );
    return rows[0] ? { id: String(rows[0].id ?? "").trim(), value: String(rows[0].destination ?? "").trim() } : null;
  }

  private async findByIdOrValue(id: string, fallbackValue?: string) {
    const { idColumn, valueColumn } = await this.findColumns();
    if (!valueColumn) throw new Error("ไม่พบ column destination ใน tb_destination");
    const idSelect = idColumn
      ? `CAST(${this.columnRef(idColumn)} AS CHAR) AS id`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS id`;
    const whereClause = idColumn
      ? `${this.columnRef(idColumn)} = ?`
      : `TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) = ?`;
    const [rows] = await this.pool.execute<Array<RowDataPacket & { id: string | number | null; destination: string | null }>>(
      `SELECT ${idSelect}, TRIM(CAST(${this.columnRef(valueColumn)} AS CHAR)) AS destination
       FROM tb_destination
       WHERE ${whereClause}
       LIMIT 1`,
      [id],
    );
    if (rows[0]) return { id: String(rows[0].id ?? "").trim(), value: String(rows[0].destination ?? "").trim() };
    return fallbackValue ? this.findByValue(fallbackValue) : null;
  }

  private async findByInsertedIdOrValue(insertId: number, value: string) {
    if (insertId > 0) {
      const item = await this.findByIdOrValue(String(insertId));
      if (item) return item;
    }
    return this.findByValue(value);
  }
}

export const destinationRepository = new DestinationRepository(pool);
