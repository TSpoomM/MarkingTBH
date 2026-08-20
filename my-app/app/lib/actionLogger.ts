// Fire-and-forget action logging: a failed log write must never break the
// caller's actual request, so failures are swallowed and only console-logged.
import { actionLogRepository } from "@/app/repositories/actionLog.repository";

export async function logAction(empId: string | undefined | null, action: string) {
  if (!empId) return;
  try {
    await actionLogRepository.create(empId, action);
  } catch (error) {
    console.error("logAction failed:", error);
  }
}
