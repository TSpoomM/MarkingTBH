import { z } from "zod";

/**
 * Request schemas shared by the template API routes. POST /api/templates and
 * PUT /api/templates/[id]/template used to each carry their own copy of the field schema.
 */

const stickerTypeConditionSchema = z.enum(["TNR", "NON TNR", "NON-TNR", "FCS"])
  .transform((value) => value === "NON-TNR" ? "NON TNR" : value === "FCS" ? "TNR" : value);
const dateFormatSchema = z.string().regex(/^(dd|mm|mmm|yy|yyyy)([-/. ])(dd|mm|mmm|yy|yyyy)\2(dd|mm|mmm|yy|yyyy)$/).optional();
const counterTypeSchema = z.enum(["lot", "pallet", "sequence"]);
const conditionSchema = z.object({
  stickerType: stickerTypeConditionSchema.optional(),
  stickerOther: z.enum(["Dome", "Inter"]).optional(),
});

const segmentSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["text", "number", "date"]).optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  dateFormat: dateFormatSchema,
  isCounter: z.boolean().optional(),
  counterType: counterTypeSchema.optional(),
  counterPad4: z.boolean().optional(),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแต่ละส่วน"),
});

const outsideFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().trim().min(1, "กรุณาระบุชื่อแถว"),
  required: z.boolean(),
  condition: conditionSchema.optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  system: z.boolean().optional(),
  uppercase: z.boolean().optional(),
  isCounter: z.boolean().optional(),
  counterType: counterTypeSchema.optional(),
  counterPad4: z.boolean().optional(),
  defaultValue: z.string().optional(),
  locked: z.boolean().optional(),
  fontScale: z.enum(["normal", "xlarge"]).optional(),
  hideLabel: z.boolean().optional(),
});

export const templateFieldSchema = z.object({
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
    counterType: counterTypeSchema.optional(),
    counterPad4: z.boolean().optional(),
  })).optional(),
  condition: conditionSchema.optional(),
  showOnSticker: z.boolean().optional(),
  stickerOrder: z.number().int().min(0).optional(),
  stickerGroup: z.string().optional(),
  stickerGroupOrder: z.number().int().min(0).optional(),
  stickerGroupLayout: z.enum(["2x2", "4x2", "8x2"]).optional(),
  uppercase: z.boolean().optional(),
  isCounter: z.boolean().optional(),
  counterType: counterTypeSchema.optional(),
  counterPad4: z.boolean().optional(),
  fontScale: z.enum(["normal", "xlarge"]).optional(),
  hideLabel: z.boolean().optional(),
});

const stickerLayoutsSchema = z.object({
  insideFrame: z.boolean(),
  outsideFrame: z.boolean(),
  customerName: z.boolean(),
  fscLogo: z.boolean(),
}).refine((layouts) => (
  layouts.insideFrame || layouts.outsideFrame || layouts.customerName || layouts.fscLogo
), "เลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ");

const stickerDefaultsSchema = z.object({
  sideCount: z.number().int().min(1).max(6),
  format: z.enum(["5533", "555"]),
  stickerType: z.enum(["TNR", "NON TNR"]),
  stickerOther: z.enum(["Dome", "Inter"]),
  stickerFsc: z.boolean(),
});

const stickerFieldNameSchema = z.enum(["side", "format", "type", "other"]);

const createStickerSchema = z.object({
  enabledFields: z.array(stickerFieldNameSchema).min(1, "เลือกช่องรายละเอียดสติ๊กเกอร์อย่างน้อย 1 ช่อง"),
  layouts: stickerLayoutsSchema,
  defaults: stickerDefaultsSchema,
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(200),
  isActive: z.boolean().default(true),
  configuration: z.object({
    version: z.literal(2),
    sticker: createStickerSchema,
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
    sticker: createStickerSchema,
    inside: z.array(templateFieldSchema),
    outside: z.array(templateFieldSchema),
  }).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(200).optional(),
  isActive: z.boolean().optional(),
  inside: z.array(templateFieldSchema),
  outside: z.array(templateFieldSchema),
  sticker: z.object({
    enabledFields: z.array(stickerFieldNameSchema).optional(),
    layouts: stickerLayoutsSchema,
    defaults: stickerDefaultsSchema.optional(),
  }).optional(),
  updatedBy: z.string().trim().min(1).default("ADMIN"),
});
