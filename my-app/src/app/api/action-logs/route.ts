import { actionLogService } from "@/src/core/services/server/actionLog.service";
import { adminAuthService } from "@/src/lib/server/adminAuth";

export const runtime = "nodejs";

class ActionLogsRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isAdmin) {
        return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
      }
      const { searchParams } = new URL(request.url);
      return Response.json({ data: await actionLogService.getRecent(searchParams.get("limit")) });
    } catch (error) {
      console.error("GET /api/action-logs", error);
      return Response.json({ message: "โหลด Action Log ไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const actionLogsRoute = new ActionLogsRoute();

export async function GET(request: Request) {
  return actionLogsRoute.get(request);
}
