import { employeeRepository } from "@/src/core/repositories/employee.repository";
import { markingRepository } from "@/src/core/repositories/marking.repository";
import type { NextLotRouteContext } from "@/src/core/models/api";
import { requestCurrentUserService } from "@/src/lib/requestCurrentUser";

export const runtime = "nodejs";

class TemplateNextLotRoute {
  async get(request: Request, context: NextLotRouteContext) {
    try {
      const { id } = await context.params;
      const templateId = Number(id);
      const { searchParams } = new URL(request.url);
      const productionDate = searchParams.get("productionDate") ?? "";
      const productionYear = Number(productionDate.slice(0, 4));

      if (!Number.isInteger(templateId) || templateId <= 0) {
        return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
      }
      if (!Number.isInteger(productionYear) || productionYear < 2000) {
        return Response.json({ message: "Production date ไม่ถูกต้อง" }, { status: 400 });
      }

      const employeeId = await requestCurrentUserService.getCurrentUserId(request);
      const employeeLocation = employeeId ? await employeeRepository.findLocationByFsId(employeeId) : null;
      if (!employeeLocation) {
        return Response.json({ message: "ไม่พบสาขาของผู้ใช้" }, { status: 400 });
      }

      const lastLotEnd = await markingRepository.findLastLotEnd(templateId, productionYear, employeeLocation);
      return Response.json({ data: { lotStart: lastLotEnd + 1 } });
    } catch (error) {
      console.error("GET /api/templates/[id]/next-lot", error);
      return Response.json({ message: "โหลดเลข LOT ถัดไปไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const templateNextLotRoute = new TemplateNextLotRoute();

export async function GET(request: Request, context: NextLotRouteContext) {
  return templateNextLotRoute.get(request, context);
}
