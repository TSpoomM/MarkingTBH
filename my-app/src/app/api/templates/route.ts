import { templateService } from "@/src/core/services/server/template.service";
import { createTemplateSchema } from "@/src/core/validation/template.schema";
import { adminAuthService } from "@/src/lib/server/adminAuth";
import { actionLogger } from "@/src/lib/server/actionLogger";
import { requestCurrentUserService } from "@/src/lib/server/requestCurrentUser";
import { ZodError } from "zod";

export const runtime = "nodejs";

class TemplatesGetRoute {
  async get(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    await requestCurrentUserService.requireCurrentUserId(request);
    if (searchParams.get("history") === "1") {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isAdmin) {
        return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
      }
      return Response.json({ data: await templateService.getTemplateHistory() });
    }
    const includeInactiveParam = searchParams.get("includeInactive");
    const includeInactive = includeInactiveParam === "1" || includeInactiveParam === "visible";
    if (includeInactive) {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isAdmin) {
        return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
      }
    }
    return Response.json({
      data: await templateService.listSummaries(includeInactive),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return Response.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    console.error("GET /api/templates", error);
    return Response.json(
      { message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ XAMPP และไฟล์ .env" },
      { status: 500 },
    );
  }
  }
}

const templatesGetRoute = new TemplatesGetRoute();

export async function GET(request: Request) {
  return templatesGetRoute.get(request);
}

class TemplatesPostRoute {
  async post(request: Request) {
  try {
    const access = await adminAuthService.requireAdmin(request);
    if (!access.isAdmin) {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const input = createTemplateSchema.parse(await request.json());
    if (
      !input.configuration.sticker.enabledFields.includes("side") ||
      !input.configuration.sticker.enabledFields.includes("format") ||
      !input.configuration.sticker.enabledFields.includes("type") ||
      !input.configuration.sticker.enabledFields.includes("other")
    ) {
      return Response.json(
        { message: "ต้องเปิด Side, Format, เกรด และ Other เพื่อคำนวณจำนวนสติ๊กเกอร์" },
        { status: 400 },
      );
    }
    const data = await templateService.createTemplate(input, access.userId);
    await actionLogger.log(access.userId, `เพิ่มลูกค้าใหม่: ${data.name} (ID ${data.id})`);
    return Response.json({ data, message: "เพิ่มลูกค้าเรียบร้อยแล้ว" }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    console.error("POST /api/templates", error);
    return Response.json(
      { message: "เพิ่มลูกค้าไม่สำเร็จ กรุณาตรวจสอบชื่อซ้ำและโครงสร้างฐานข้อมูล" },
      { status: 500 },
    );
  }
  }
}

const templatesPostRoute = new TemplatesPostRoute();

export async function POST(request: Request) {
  return templatesPostRoute.post(request);
}
