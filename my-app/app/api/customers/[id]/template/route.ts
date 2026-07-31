import { customerService } from "../../../../services/customer.service";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

type CustomerTemplateRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: CustomerTemplateRouteContext,
) {
  try {
    const { id } = await context.params;
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    return Response.json({ data: await customerService.getCustomerTemplate(customerId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "โหลด template ไม่สำเร็จ";
    const isMissing = message === "ไม่พบข้อมูลลูกค้า" || message.includes("ยังไม่มี");
    return Response.json({ message }, { status: isMissing ? 404 : 500 });
  }
}

const fieldSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1, "กรุณากรอกชื่อ Field"),
  type: z.enum(["text", "number", "date", "textarea"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  segments: z.array(z.object({
    key: z.string().trim().min(1),
    label: z.string().trim().min(1),
    type: z.enum(["text", "number", "date", "textarea"]).optional(),
    showOnSticker: z.boolean().optional(),
    stickerOrder: z.number().int().min(0).optional(),
    isCounter: z.boolean().optional(),
  })).optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  stickerGroup: z.string().optional(),
  stickerGroupOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  inside: z.array(fieldSchema),
  outside: z.array(fieldSchema),
  updatedBy: z.string().trim().min(1).default("ADMIN"),
});

export async function PUT(
  request: Request,
  context: CustomerTemplateRouteContext,
) {
  try {
    if (request.headers.get("x-user-role") !== "admin") {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const { id } = await context.params;
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    const input = updateSchema.parse(await request.json());
    const data = await customerService.saveTemplate(
      customerId,
      input.inside,
      input.outside,
      input.updatedBy,
    );
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
