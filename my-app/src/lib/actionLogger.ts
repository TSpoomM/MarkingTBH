// Fire-and-forget action logging: a failed log write must never break the
// caller's actual request, so failures are swallowed and only console-logged.
import { actionLogRepository } from "@/src/core/repositories/actionLog.repository";

export class ActionLogger {
  async log(empId: string | undefined | null, action: string) {
    if (!empId) return;
    try {
      await actionLogRepository.create(empId, action);
    } catch (error) {
      console.error("logAction failed:", error);
    }
  }
}

export const actionLogger = new ActionLogger();
