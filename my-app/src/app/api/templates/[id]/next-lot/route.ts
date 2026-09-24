import { ZodError } from "zod";
import { markingService } from "@/src/core/services/server/marking.service";
import type { NextLotRouteContext } from "@/src/core/models/api";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";

export const runtime = "nodejs";

class TemplateNextLotRoute {
  async get(request: Request, context: NextLotRouteContext) {
    try {
      const { id } = await context.params;
      const { searchParams } = new URL(request.url);
      const query = markingService.parseNextLotQuery(id, searchParams.get("productionDate") ?? "");

      const employeeId = await requestCurrentUserService.requireCurrentUserId(request);
      const lotStart = await markingService.getNextLotStart(query, employeeId);
      if (lotStart === null) {
        return Response.json({ message: "ไม่พบสาขาของผู้ใช้" }, { status: 400 });
      }

      return Response.json({ data: { lotStart } });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }
      if (error instanceof Error && error.message === "UNAUTHENTICATED") {
        return Response.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
      }
      console.error("GET /api/templates/[id]/next-lot", error);
      return Response.json({ message: "โหลดเลข LOT ถัดไปไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const templateNextLotRoute = new TemplateNextLotRoute();

export async function GET(request: Request, context: NextLotRouteContext) {
  return templateNextLotRoute.get(request, context);
}
