import type { ResultSetHeader } from "mysql2";
import { db } from "../lib/db";
import type { CreateMarkingInput } from "../types/marking";

export async function createMarking(input: CreateMarkingInput) {
  const [result] = await db.execute<ResultSetHeader>(
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

