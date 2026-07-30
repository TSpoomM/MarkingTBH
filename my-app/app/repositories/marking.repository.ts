import type { ResultSetHeader } from "mysql2";
import type { CreateMarkingInput } from "@/app/types/marking";
import { database, Database } from "../lib/db";

export class MarkingRepository {
  constructor(private readonly database: Database) {}

  async create(input: CreateMarkingInput) {
    const [result] = await this.database.pool.execute<ResultSetHeader>(
      `INSERT INTO log_marking
        (emp_id, cus_id, total_weight, sticker_sides, content_inside, content_outside, created_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        input.employeeId,
        input.customerId,
        input.totalWeight,
        input.stickerSides,
        JSON.stringify(input.contentInside),
        JSON.stringify(input.contentOutside),
      ],
    );
    return result.insertId;
  }
}

export const markingRepository = new MarkingRepository(database);
