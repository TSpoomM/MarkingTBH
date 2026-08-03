import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateMarkingInput } from "@/app/types/marking";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";

export class MarkingRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateMarkingInput) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO log_marking
        (emp_id, cus_id, total_lot, sticker_sides, content_inside, content_outside, created_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        input.employeeId,
        input.customerId,
        input.totalLot,
        input.stickerSides,
        JSON.stringify(input.contentInside),
        JSON.stringify(input.contentOutside),
      ],
    );
    return result.insertId;
  }

  async findLastLotEnd(customerId: number, productionYear: number) {
    const [rows] = await this.pool.execute<Array<RowDataPacket & { content_inside: string | null }>>(
      `SELECT content_inside
       FROM log_marking
       WHERE cus_id = ?
       ORDER BY created_date DESC
       LIMIT 200`,
      [customerId],
    );

    let lastLotEnd = 0;
    rows.forEach((row) => {
      try {
        const parsed = JSON.parse(row.content_inside ?? "[]") as Array<Record<string, unknown>>;
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        const productionDate = String(first.production_date ?? "");
        const year = Number(productionDate.slice(0, 4));
        if (year !== productionYear) return;
        const lotEnd = Number(first.lot_end ?? 0);
        const lotStart = Number(first.lot_start ?? 0);
        const lotCount = Number(first.lot_count ?? 0);
        lastLotEnd = Math.max(lastLotEnd, lotEnd || (lotStart && lotCount ? lotStart + lotCount - 1 : 0));
      } catch {
        // Ignore old rows without JSON metadata.
      }
    });
    return lastLotEnd;
  }
}

export const markingRepository = new MarkingRepository(pool);
