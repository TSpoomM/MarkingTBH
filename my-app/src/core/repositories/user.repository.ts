import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/server/db";
import type { TbhUserRow } from "@/src/core/models/database";

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserInv(userInv: string) {
    const [rows] = await this.pool.query<TbhUserRow[]>(
      `SELECT userInv, passwordInv, fs_id
       FROM db_tbh_user
       WHERE userInv = ?
       LIMIT 1`,
      [userInv],
    );
    return rows[0] ?? null;
  }
}

export const userRepository = new UserRepository(pool);
