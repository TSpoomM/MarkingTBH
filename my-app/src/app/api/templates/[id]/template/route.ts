import { templateService } from "@/src/core/services/server/template.service";
import { updateTemplateSchema } from "@/src/core/validation/template.schema";
import { adminAuthService } from "@/src/lib/server/adminAuth";
import { actionLogger } from "@/src/lib/server/actionLogger";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";
import { clientMessage, logUnexpected } from "@/src/lib/server/apiError";
import { ZodError } from "zod";
import type { TemplateDetailRouteContext } from "@/src/core/models/api";

export const runtime = "nodejs";

class TemplateDetailGetRoute {
  async get(
  request: Request,
  context: TemplateDetailRouteContext,
) {
  try {
    await requestCurrentUserService.requireCurrentUserId(request);
    const { id } = await context.params;
    const templateId = Number(id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    const access = await adminAuthService.requireAdmin(request);
    if (!access.isAdmin) {
      const activeTemplates = await templateService.getTemplates(false);
      if (!activeTemplates.some((template) => template.id === templateId)) {
        return Response.json({ message: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });
      }
    }
    return Response.json({ data: await templateService.getTemplate(templateId) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return Response.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    logUnexpected("GET /api/templates/[id]/template", error);
    const message = clientMessage(error, "โหลด template ไม่สำเร็จ");
    const isMissing = message === "ไม่พบข้อมูลลูกค้า" || message.includes("ยังไม่มี");
    return Response.json({ message }, { status: isMissing ? 404 : 500 });
  }
  }
}

const templateDetailGetRoute = new TemplateDetailGetRoute();

export async function GET(
  request: Request,
  context: TemplateDetailRouteContext,
) {
  return templateDetailGetRoute.get(request, context);
}

class TemplateDetailPutRoute {
  async put(
  request: Request,
  context: TemplateDetailRouteContext,
) {
  try {
    const access = await adminAuthService.requireAdmin(request);
    if (!access.isAdmin) {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const { id } = await context.params;
    const templateId = Number(id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    const input = updateTemplateSchema.parse(await request.json());
    await templateService.renameTemplateIfChanged(templateId, input.name);
    await templateService.updateTemplateActiveIfChanged(templateId, input.isActive);
    const data = await templateService.saveTemplate(
      templateId,
      input.inside,
      input.outside,
      input.sticker,
      access.userId,
    );
    await actionLogger.log(access.userId, `แก้ไข Template ลูกค้า ID ${templateId}`);
    return Response.json({ data, message: "อัปเดต Template แล้ว" });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    logUnexpected("PUT /api/templates/[id]/template", error);
    return Response.json({ message: clientMessage(error, "อัปเดต Template ไม่สำเร็จ") }, { status: 500 });
  }
  }
}

const templateDetailPutRoute = new TemplateDetailPutRoute();

export async function PUT(
  request: Request,
  context: TemplateDetailRouteContext,
) {
  return templateDetailPutRoute.put(request, context);
}
