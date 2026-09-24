import { actionLogRepository, ActionLogRepository } from "@/src/core/repositories/actionLog.repository";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export class ActionLogService {
  constructor(private readonly repository: ActionLogRepository) {}

  /** `rawLimit` is the untrusted query-string value; it is clamped to 1..MAX_LIMIT. */
  getRecent(rawLimit: string | null) {
    const limit = Math.min(Math.max(Number(rawLimit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
    return this.repository.findRecent(limit);
  }
}

export const actionLogService = new ActionLogService(actionLogRepository);
