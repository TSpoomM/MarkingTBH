import { ZodError } from "zod";
import { markingRepository } from "@/src/core/repositories/marking.repository";
import { markingService } from "@/src/core/services/marking.service";
import { actionLogger } from "@/src/lib/actionLogger";
import { adminAuthService } from "@/src/lib/adminAuth";
import { requestCurrentUserService } from "@/src/lib/requestCurrentUser";

export const runtime = "nodejs";

class MarkingsRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isAdmin) {
        return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
      }
      const { searchParams } = new URL(request.url);
      const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 300);
      return Response.json({ data: await markingRepository.findHistory(limit) });
    } catch (error) {
      console.error("GET /api/markings", error);
      return Response.json({ message: "โหลด history ไม่สำเร็จ" }, { status: 500 });
    }
  }

  async post(request: Request) {
    try {
      const payload = await request.json();
      const employeeId = await requestCurrentUserService.getCurrentUserId(request);
      const result = await markingService.save(payload, employeeId);
      const actionType = (payload as { actionType?: string })?.actionType === "print"
        ? "พิมพ์สติ๊กเกอร์"
        : "บันทึกข้อมูล";
      const templateId = (payload as { templateId?: number | string })?.templateId;
      await actionLogger.log(employeeId, `${actionType} Marking ลูกค้า ID ${templateId} (Marking ID ${result.id})`);
      return Response.json(
        { data: result, message: "บันทึกข้อมูลเรียบร้อยแล้ว" },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json(
          { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", issues: error.issues },
          { status: 400 },
        );
      }
      console.error("POST /api/markings", error);
      return Response.json({ message: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const markingsRoute = new MarkingsRoute();

export async function GET(request: Request) {
  return markingsRoute.get(request);
}

export async function POST(request: Request) {
  return markingsRoute.post(request);
}
