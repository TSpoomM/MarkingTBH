import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CreateMarkingInput, MarkingContent, MarkingHistoryItem } from "@/app/types/marking";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";

export class MarkingRepository {
  constructor(private readonly pool: Pool) {}

  private parseContent(value: unknown): MarkingContent[] {
    try {
      const parsed = JSON.parse(String(value ?? "[]")) as MarkingContent | MarkingContent[];
      if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object");
      return parsed && typeof parsed === "object" ? [parsed] : [];
    } catch {
      return [];
    }
  }

  private firstContentValue(rows: MarkingContent[], key: string) {
    return rows.find((row) => row[key])?.[key] ?? "";
  }

  private numberValue(value: unknown) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

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

  async findLastLotEnd(customerId: number, productionYear: number, employeeLocation: string) {
    const [rows] = await this.pool.execute<Array<RowDataPacket & { content_inside: string | null }>>(
      `SELECT l.content_inside
       FROM log_marking l
       INNER JOIN tb_employee_list e ON TRIM(e.fs_id) = TRIM(l.emp_id)
       WHERE l.cus_id = ?
         AND TRIM(COALESCE(e.location_emp, '')) = ?
       ORDER BY l.created_date DESC`,
      [customerId, employeeLocation],
    );

    let lastLotEnd = 0;
    rows.forEach((row) => {
      try {
        const parsed = JSON.parse(row.content_inside ?? "[]") as Array<Record<string, unknown>> | Record<string, unknown>;
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!first) return;
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

  async findHistory(limit = 100): Promise<MarkingHistoryItem[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT l.*, c.c_name, e.emp_name, e.emp_name_en, e.location_emp
       FROM log_marking l
       LEFT JOIN tb_customer c ON c.c_id = l.cus_id
       LEFT JOIN tb_employee_list e ON TRIM(e.fs_id) = TRIM(l.emp_id)
       ORDER BY l.created_date DESC
       LIMIT ?`,
      [limit],
    );

    return rows.map((row, index) => {
      const record = row as Record<string, unknown>;
      const inside = this.parseContent(record.content_inside);
      const outside = this.parseContent(record.content_outside);
      const lotStart = this.numberValue(this.firstContentValue(inside, "lot_start"));
      const lotCount = this.numberValue(this.firstContentValue(inside, "lot_count")) || this.numberValue(record.total_lot);
      const lotEnd = this.numberValue(this.firstContentValue(inside, "lot_end")) || (lotStart && lotCount ? lotStart + lotCount - 1 : 0);
      const actionType = this.firstContentValue(inside, "action_type");

      return {
        id: String(record.id ?? record.log_id ?? record.marking_id ?? index + 1),
        employeeId: String(record.emp_id ?? ""),
        employeeName: String(record.emp_name ?? record.emp_name_en ?? record.emp_id ?? ""),
        employeeLocation: String(record.location_emp ?? ""),
        customerId: this.numberValue(record.cus_id),
        customerName: String(record.c_name ?? ""),
        totalLot: this.numberValue(record.total_lot),
        stickerSides: this.numberValue(record.sticker_sides),
        lotStart,
        lotEnd,
        lotCount,
        productionDate: this.firstContentValue(inside, "production_date"),
        actionType: actionType === "save" || actionType === "print" ? actionType : "unknown",
        stickerFormat: this.firstContentValue(inside, "sticker_format"),
        stickerType: this.firstContentValue(inside, "sticker_type"),
        stickerOther: this.firstContentValue(inside, "sticker_other"),
        createdDate: record.created_date instanceof Date
          ? record.created_date.toISOString()
          : String(record.created_date ?? ""),
        inside,
        outside,
      };
    });
  }
}

export const markingRepository = new MarkingRepository(pool);
