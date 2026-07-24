import { customerService } from "../../services/customer.service";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await customerService.getCustomers();
    return Response.json({
      data: rows.map((row) => ({ id: row.c_id, name: row.c_name })),
    });
  } catch (error) {
    console.error("GET /api/customers", error);
    return Response.json(
      { message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ XAMPP และไฟล์ .env" },
      { status: 500 },
    );
  }
}

const segmentSchema = z.object({
  key: z.string().min(1),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแต่ละส่วน"),
});

const outsideFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแถว"),
  required: z.boolean(),
  condition: z.object({ stickerType: z.literal("TNR") }).optional(),
  system: z.boolean().optional(),
});

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(200),
  configuration: z.object({
    version: z.literal(2),
    sticker: z.object({
      enabledFields: z.array(z.enum(["side", "format", "type", "other"]))
        .min(1, "เลือกช่องรายละเอียดสติ๊กเกอร์อย่างน้อย 1 ช่อง"),
    }),
    inside: z.object({
      groups: z.array(z.object({
        key: z.enum(["lotNo", "palletNo"]),
        label: z.string().min(1),
        segments: z.array(segmentSchema).min(1).max(6),
      })).length(2),
      fields: z.tuple([
        z.object({ key: z.literal("gross"), label: z.literal("GROSS"), required: z.literal(true) }),
        z.object({ key: z.literal("nett"), label: z.literal("NETT"), required: z.literal(true) }),
        z.object({ key: z.literal("destination"), label: z.literal("DESTINATION"), required: z.literal(true) }),
        z.object({ key: z.literal("contractNo"), label: z.literal("CONTRACT NO."), required: z.literal(true) }),
      ]),
    }),
    outside: z.object({
      tables: z.array(z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1, "กรุณาระบุชื่อ Outside table"),
        fields: z.array(outsideFieldSchema),
      })),
    }),
  }),
});

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-user-role") !== "admin") {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const input = createCustomerSchema.parse(await request.json());
    const hasTypeField = input.configuration.sticker.enabledFields.includes("type");
    const hasTraceableField = input.configuration.outside.tables.every((table) =>
      table.fields.some((field) =>
        field.condition?.stickerType === "TNR" &&
        field.label.toLowerCase().includes("traceable natural rubber"),
      ),
    );
    if (hasTypeField && input.configuration.outside.tables.length > 0 && !hasTraceableField) {
      return Response.json(
        { message: "Outside ทุกตารางต้องมี Traceable Natural Rubber สำหรับ Type TNR" },
        { status: 400 },
      );
    }
    const data = await customerService.createCustomer(input, "ADMIN");
    return Response.json({ data, message: "เพิ่มลูกค้าเรียบร้อยแล้ว" }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    console.error("POST /api/customers", error);
    return Response.json(
      { message: "เพิ่มลูกค้าไม่สำเร็จ กรุณาตรวจสอบชื่อซ้ำและโครงสร้างฐานข้อมูล" },
      { status: 500 },
    );
  }
}

