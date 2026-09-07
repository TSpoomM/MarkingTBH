import { templateService } from "@/src/core/services/template.service";
import { adminAuthService } from "@/src/lib/adminAuth";
import { actionLogger } from "@/src/lib/actionLogger";
import { z, ZodError } from "zod";
import type { TemplateDetailRouteContext } from "@/src/core/models/api";

export const runtime = "nodejs";

const stickerTypeConditionSchema = z.enum(["TNR", "NON TNR", "NON-TNR", "FCS"])
  .transform((value) => value === "NON-TNR" ? "NON TNR" : value === "FCS" ? "TNR" : value);
const dateFormatSchema = z.string().regex(/^(dd|mm|mmm|yyyy)([-/.])(dd|mm|mmm|yyyy)\2(dd|mm|mmm|yyyy)$/).optional();

class TemplateDetailGetRoute {
  async get(
  _request: Request,
  context: TemplateDetailRouteContext,
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    return Response.json({ data: await templateService.getTemplate(templateId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "โหลด template ไม่สำเร็จ";
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

const fieldSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1, "กรุณากรอกชื่อ Field"),
  type: z.enum(["text", "number", "date", "textarea"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  dateFormat: dateFormatSchema,
  locked: z.boolean().optional(),
  displayFormat: z.string().optional(),
  segments: z.array(z.object({
    key: z.string().trim().min(1),
    label: z.string().trim().min(1),
    type: z.enum(["text", "number", "date", "textarea"]).optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    dateFormat: dateFormatSchema,
    showOnSticker: z.boolean().optional(),
    stickerOrder: z.number().int().min(0).optional(),
    isCounter: z.boolean().optional(),
    counterType: z.enum(["lot", "pallet", "sequence"]).optional(),
    counterPad4: z.boolean().optional(),
  })).optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  condition: z.object({
    stickerType: stickerTypeConditionSchema.optional(),
    stickerOther: z.enum(["Dome", "Inter"]).optional(),
  }).optional(),
  stickerGroup: z.string().optional(),
  stickerGroupOrder: z.number().int().min(0).optional(),
  stickerGroupLayout: z.enum(["2x2", "4x2", "8x2"]).optional(),
  uppercase: z.boolean().optional(),
  isCounter: z.boolean().optional(),
  counterType: z.enum(["lot", "pallet", "sequence"]).optional(),
  counterPad4: z.boolean().optional(),
  fontScale: z.enum(["normal", "xlarge"]).optional(),
  hideLabel: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(200).optional(),
  isActive: z.boolean().optional(),
  inside: z.array(fieldSchema),
  outside: z.array(fieldSchema),
  sticker: z.object({
    enabledFields: z.array(z.enum(["side", "format", "type", "other"])).optional(),
    layouts: z.object({
      insideFrame: z.boolean(),
      outsideFrame: z.boolean(),
      customerName: z.boolean(),
      fscLogo: z.boolean(),
    }).refine((layouts) => (
      layouts.insideFrame || layouts.outsideFrame || layouts.customerName || layouts.fscLogo
    ), "เลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ"),
    defaults: z.object({
      sideCount: z.number().int().min(1).max(6),
      format: z.enum(["5533", "555"]),
      stickerType: z.enum(["TNR", "NON TNR"]),
      stickerOther: z.enum(["Dome", "Inter"]),
      stickerFsc: z.boolean(),
    }).optional(),
  }).optional(),
  updatedBy: z.string().trim().min(1).default("ADMIN"),
});

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
    const input = updateSchema.parse(await request.json());
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
    const message = error instanceof Error ? error.message : "อัปเดต Template ไม่สำเร็จ";
    return Response.json({ message }, { status: 500 });
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
