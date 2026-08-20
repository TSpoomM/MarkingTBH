import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { pool } from "../lib/db";
import type { ActionLogRow } from "@/app/types/database";

export class ActionLogRepository {
  constructor(private readonly pool: Pool) {}

  async create(empId: string, action: string) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO tb_action_log (empId, createdDate, action) VALUES (?, NOW(), ?)`,
      [empId, action],
    );
    return result.insertId;
  }

  async findRecent(limit = 100) {
    const [rows] = await this.pool.execute<ActionLogRow[]>(
      `SELECT Logid, empId, createdDate, action
       FROM tb_action_log
       ORDER BY createdDate DESC
       LIMIT ?`,
      [limit],
    );
    return rows;
  }
}

export const actionLogRepository = new ActionLogRepository(pool);
