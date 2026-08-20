import { adminAuthService } from "@/app/lib/adminAuth";
import { actionLogRepository } from "@/app/repositories/actionLog.repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await adminAuthService.requireAdmin(request);
    if (!access.isAdmin) {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
    return Response.json({ data: await actionLogRepository.findRecent(limit) });
  } catch (error) {
    console.error("GET /api/action-logs", error);
    return Response.json({ message: "โหลด Action Log ไม่สำเร็จ" }, { status: 500 });
  }
}
