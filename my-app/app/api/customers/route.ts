import { customerService } from "../../services/customer.service";
import { adminAuthService } from "@/app/lib/adminAuth";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const stickerTypeConditionSchema = z.enum(["TNR", "NON TNR", "NON-TNR", "FCS"])
  .transform((value) => value === "NON-TNR" ? "NON TNR" : value === "FCS" ? "TNR" : value);

const isActiveValue = (value: number | string | boolean | null | undefined) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return !["", "0", "false", "inactive", "disabled", "n", "no"].includes(value.trim().toLowerCase());
  return true;
};

export async function GET(request: Request) {
  try {
    const includeInactiveParam = new URL(request.url).searchParams.get("includeInactive");
    const includeInactive = includeInactiveParam === "1" || includeInactiveParam === "visible";
    const visibleInactive = includeInactiveParam === "visible";
    if (includeInactive) {
      const access = visibleInactive ? { isAdmin: false } : await adminAuthService.requireAdmin(request);
      if (!visibleInactive && !access.isAdmin) {
        return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
      }
    }
    const rows = await customerService.getCustomers(includeInactive);
    const customers = rows
      .map((row) => ({ id: row.c_id, name: row.c_name, isActive: isActiveValue(row.is_active) }))
      .filter((customer) => includeInactive || customer.isActive)
      .sort((first, second) =>
        Number(second.isActive) - Number(first.isActive) ||
        first.name.localeCompare(second.name),
      );
    return Response.json({
      data: customers,
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
  type: z.enum(["text", "number"]).optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  isCounter: z.boolean().optional(),
  counterType: z.enum(["lot", "pallet", "sequence"]).optional(),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแต่ละส่วน"),
});

const outsideFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแถว"),
  required: z.boolean(),
  condition: z.object({
    stickerType: stickerTypeConditionSchema.optional(),
    stickerOther: z.enum(["Dome", "Inter"]).optional(),
  }).optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  system: z.boolean().optional(),
  uppercase: z.boolean().optional(),
  defaultValue: z.string().optional(),
  locked: z.boolean().optional(),
  fontScale: z.enum(["normal", "xlarge"]).optional(),
  hideLabel: z.boolean().optional(),
});

const templateFieldSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1, "กรุณากรอกชื่อ Field"),
  type: z.enum(["text", "number", "date", "textarea"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  locked: z.boolean().optional(),
  displayFormat: z.string().optional(),
  segments: z.array(z.object({
    key: z.string().trim().min(1),
    label: z.string().trim().min(1),
    type: z.enum(["text", "number", "date", "textarea"]).optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    showOnSticker: z.boolean().optional(),
    stickerOrder: z.number().int().min(0).optional(),
    isCounter: z.boolean().optional(),
    counterType: z.enum(["lot", "pallet", "sequence"]).optional(),
  })).optional(),
  condition: z.object({
    stickerType: stickerTypeConditionSchema.optional(),
    stickerOther: z.enum(["Dome", "Inter"]).optional(),
  }).optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  stickerGroup: z.string().optional(),
  stickerGroupOrder: z.number().int().min(0).optional(),
  uppercase: z.boolean().optional(),
  fontScale: z.enum(["normal", "xlarge"]).optional(),
  hideLabel: z.boolean().optional(),
});

const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(200),
  isActive: z.boolean().default(true),
  configuration: z.object({
    version: z.literal(2),
    sticker: z.object({
      enabledFields: z.array(z.enum(["side", "format", "type", "other"]))
        .min(1, "เลือกช่องรายละเอียดสติ๊กเกอร์อย่างน้อย 1 ช่อง"),
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
      }),
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
        name: z.string().trim().min(1, "กรุณาระบุชื่อตารางนอกกรอบ"),
        fields: z.array(outsideFieldSchema),
      })),
    }),
  }),
  template: z.object({
    sticker: z.object({
      enabledFields: z.array(z.enum(["side", "format", "type", "other"]))
        .min(1, "เลือกช่องรายละเอียดสติ๊กเกอร์อย่างน้อย 1 ช่อง"),
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
      }),
    }),
    inside: z.array(templateFieldSchema),
    outside: z.array(templateFieldSchema),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const access = await adminAuthService.requireAdmin(request);
    if (!access.isAdmin) {
      return Response.json({ message: "เฉพาะ Admin เท่านั้น" }, { status: 403 });
    }
    const input = createCustomerSchema.parse(await request.json());
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
    const data = await customerService.createCustomer(input, access.userId);
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
