import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/db";
import type { DestinationColumnRow, DestinationOptionRow } from "@/src/core/models/database";

export class DestinationRepository {
  private valueColumn: string | null | undefined;

  constructor(private readonly pool: Pool) {}

  private async findValueColumn() {
    if (this.valueColumn !== undefined) return this.valueColumn;
    const [rows] = await this.pool.query<DestinationColumnRow[]>(
      `SELECT COLUMN_NAME AS column_name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'tb_destination'
         AND COLUMN_NAME IN ('destination', 'c_destination', 'name', 'c_name', 'description')
       ORDER BY FIELD(COLUMN_NAME, 'destination', 'c_destination', 'name', 'c_name', 'description')
       LIMIT 1`,
    );
    this.valueColumn = rows[0]?.column_name ?? null;
    return this.valueColumn;
  }

  async findOptions() {
    const column = await this.findValueColumn();
    if (!column) throw new Error("ไม่พบ column destination ใน tb_destination");

    const [rows] = await this.pool.query<DestinationOptionRow[]>(
      `SELECT DISTINCT TRIM(CAST(\`${column}\` AS CHAR)) AS destination
       FROM tb_destination
       WHERE \`${column}\` IS NOT NULL
         AND TRIM(CAST(\`${column}\` AS CHAR)) <> ''
       ORDER BY destination ASC`,
    );

    return rows.map((row) => String(row.destination ?? "").trim()).filter(Boolean);
  }
}

export const destinationRepository = new DestinationRepository(pool);
