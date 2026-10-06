import { ZodError } from "zod";
import { markingService } from "@/src/core/services/server/marking.service";
import type { NextLotRouteContext } from "@/src/core/models/api";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";
import { timing } from "@/src/lib/server/timing";

export const runtime = "nodejs";

class TemplateNextLotRoute {
  async get(request: Request, context: NextLotRouteContext) {
    try {
      const { id } = await context.params;
      const query = markingService.parseNextLotQuery(id);

      await requestCurrentUserService.requireCurrentUserId(request);
      const lotProgress = await markingService.getNextLotStart(query);

      return Response.json({ data: lotProgress });
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
  return timing.measure("GET /api/templates/[id]/next-lot (total)", () =>
    templateNextLotRoute.get(request, context),
  );
}
