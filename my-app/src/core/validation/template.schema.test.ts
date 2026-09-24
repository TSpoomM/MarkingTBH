import { describe, expect, it } from "vitest";
import { createTemplateSchema, templateFieldSchema, updateTemplateSchema } from "./template.schema";

const layouts = { insideFrame: true, outsideFrame: true, customerName: false, fscLogo: false };
const defaults = { sideCount: 1, format: "555", stickerType: "TNR", stickerOther: "Dome", stickerFsc: false };
const validField = { key: "a", label: "A", type: "text", required: true };

describe("templateFieldSchema", () => {
  it("accepts a minimal field and trims text", () => {
    expect(templateFieldSchema.parse({ ...validField, key: " a ", label: " A " })).toMatchObject({ key: "a", label: "A" });
  });

  it("rejects a blank label with the Thai message", () => {
    const result = templateFieldSchema.safeParse({ ...validField, label: "  " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("กรุณากรอกชื่อ Field");
  });

  it("rejects a date format that is not three parts with one separator", () => {
    expect(templateFieldSchema.safeParse({ ...validField, dateFormat: "dd/mm-yyyy" }).success).toBe(false);
    expect(templateFieldSchema.safeParse({ ...validField, dateFormat: "dd mmm yyyy" }).success).toBe(true);
  });

  it("maps legacy sticker types in a condition", () => {
    const parsed = templateFieldSchema.parse({ ...validField, condition: { stickerType: "FCS" } });
    expect(parsed.condition?.stickerType).toBe("TNR");
    expect(templateFieldSchema.parse({ ...validField, condition: { stickerType: "NON-TNR" } }).condition?.stickerType).toBe("NON TNR");
  });
});

describe("updateTemplateSchema", () => {
  const base = { inside: [validField], outside: [] };

  it("only needs the field lists", () => {
    expect(updateTemplateSchema.parse(base).updatedBy).toBe("ADMIN");
  });

  it("requires at least one sticker layout when layouts are sent", () => {
    const none = { ...layouts, insideFrame: false, outsideFrame: false };
    const result = updateTemplateSchema.safeParse({ ...base, sticker: { layouts: none } });
    expect(result.error?.issues[0].message).toBe("เลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ");
  });

  it("rejects a name that is only whitespace", () => {
    expect(updateTemplateSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
  });
});

describe("createTemplateSchema", () => {
  const sticker = { enabledFields: ["side", "format", "type", "other"], layouts, defaults };
  const configuration = {
    version: 2,
    sticker,
    inside: {
      groups: [
        { key: "lotNo", label: "LOT", segments: [{ key: "s", label: "S" }] },
        { key: "palletNo", label: "PALLET", segments: [{ key: "s", label: "S" }] },
      ],
      fields: [
        { key: "gross", label: "GROSS", required: true },
        { key: "nett", label: "NETT", required: true },
        { key: "destination", label: "DESTINATION", required: true },
        { key: "contractNo", label: "CONTRACT NO.", required: true },
      ],
    },
    outside: { tables: [] },
  };

  it("accepts a full payload and defaults isActive to true", () => {
    expect(createTemplateSchema.parse({ name: "ACME", configuration }).isActive).toBe(true);
  });

  it("requires a customer name", () => {
    const result = createTemplateSchema.safeParse({ name: " ", configuration });
    expect(result.error?.issues[0].message).toBe("กรุณากรอกชื่อลูกค้า");
  });

  it("validates the sticker settings inside the optional template block too", () => {
    const badSticker = { ...sticker, enabledFields: [] };
    const result = createTemplateSchema.safeParse({
      name: "ACME",
      configuration,
      template: { sticker: badSticker, inside: [], outside: [] },
    });
    expect(result.error?.issues[0].message).toBe("เลือกช่องรายละเอียดสติ๊กเกอร์อย่างน้อย 1 ช่อง");
  });
});
