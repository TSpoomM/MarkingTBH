import { describe, expect, it } from "vitest";
import TemplateDraftSubmission from "./templateDraftSubmission";
import { ALL_LAYOUTS, field } from "@/src/core/test/fixtures";

describe("TemplateDraftSubmission.cleanFields", () => {
  it("trims and uppercases labels, defaults flags and numbers the sticker order", () => {
    const [first, second] = TemplateDraftSubmission.cleanFields("inside", [
      field({ key: "a", label: " gross " }),
      field({ key: "b", label: "nett", showOnSticker: false }),
    ]);
    expect(first).toMatchObject({ label: "GROSS", required: true, showOnSticker: true, uppercase: true, stickerOrder: 0 });
    expect(second).toMatchObject({ showOnSticker: false, stickerOrder: undefined });
  });

  it("generates a key for a field that has none", () => {
    const [cleaned] = TemplateDraftSubmission.cleanFields("outside", [field({ key: "  " })]);
    expect(cleaned.key.startsWith("outside_field_")).toBe(true);
  });

  it("uses the label as the default value of a locked field", () => {
    const [cleaned] = TemplateDraftSubmission.cleanFields("inside", [field({ label: "fixed", locked: true })]);
    expect(cleaned).toMatchObject({ locked: true, defaultValue: "fixed" });
  });

  it("drops empty default values and locks nothing on multi-section fields", () => {
    const [plain] = TemplateDraftSubmission.cleanFields("inside", [field({ defaultValue: "   " })]);
    expect(plain.defaultValue).toBeUndefined();

    const [sectioned] = TemplateDraftSubmission.cleanFields("inside", [
      field({ locked: true, segments: [{ key: "s", label: "s" }] }),
    ]);
    expect(sectioned.locked).toBe(false);
  });

  it("cleans sections: uppercase labels, default affixes, ordered by field position", () => {
    const cleaned = TemplateDraftSubmission.cleanFields("inside", [
      field({ key: "a" }),
      field({ key: "b", segments: [{ key: "s1", label: "part" }, { key: "s1", label: "other", prefix: "(" }] }),
    ]);
    const segments = cleaned[1].segments!;
    expect(segments.map((segment) => segment.label)).toEqual(["PART", "OTHER"]);
    expect(segments[0]).toMatchObject({ prefix: "", suffix: "", showOnSticker: true, stickerOrder: 10 });
    expect(new Set(segments.map((segment) => segment.key)).size).toBe(2);
  });

  it("drops the display format once any section has an affix", () => {
    const [cleaned] = TemplateDraftSubmission.cleanFields("inside", [
      field({ displayFormat: "{1}-{2}", segments: [{ key: "a", label: "a", prefix: "(" }, { key: "b", label: "b" }] }),
    ]);
    expect(cleaned.displayFormat).toBeUndefined();
  });

  it("keeps one row per vertical outside table and clears its font scale", () => {
    const cleaned = TemplateDraftSubmission.cleanFields("outside", [
      field({ key: "a", stickerGroupOrder: 0, stickerGroupLayout: "8x2", fontScale: "xlarge" }),
      field({ key: "b", stickerGroupOrder: 0, stickerGroupLayout: "8x2" }),
      field({ key: "c", stickerGroupOrder: 5, stickerGroupLayout: "2x2", fontScale: "xlarge" }),
    ]);
    expect(cleaned.map((item) => [item.key, item.stickerGroupOrder, item.fontScale])).toEqual([
      ["a", 0, undefined],
      ["c", 1, "xlarge"],
    ]);
  });

  it("only keeps a date format on date fields", () => {
    const [date, text] = TemplateDraftSubmission.cleanFields("inside", [
      field({ key: "d", type: "date", dateFormat: "dd/mm/yyyy" }),
      field({ key: "t", type: "text", dateFormat: "dd/mm/yyyy" }),
    ]);
    expect(date.dateFormat).toBe("dd/mm/yyyy");
    expect(text.dateFormat).toBeUndefined();
  });
});

describe("TemplateDraftSubmission.validate", () => {
  const ok = [field({ key: "a", label: "A" })];

  it("accepts a complete draft", () => {
    expect(TemplateDraftSubmission.validate("edit", ok, [], ALL_LAYOUTS)).toBeUndefined();
    expect(TemplateDraftSubmission.validate("create", ok, [], ALL_LAYOUTS)).toBeUndefined();
  });

  it("uses the wording of the draft being validated", () => {
    const blank = [field({ key: "a", label: "" })];
    expect(TemplateDraftSubmission.validate("edit", blank, [], ALL_LAYOUTS)).toBe("กรุณากรอกชื่อ Field ให้ครบ");
    expect(TemplateDraftSubmission.validate("create", blank, [], ALL_LAYOUTS)).toBe("กรุณากรอกชื่อ Field ให้ครบทุกช่อง");
  });

  it("checks empty labels on the outside draft too", () => {
    expect(TemplateDraftSubmission.validate("edit", ok, [field({ key: "o", label: "" })], ALL_LAYOUTS)).toBeDefined();
  });

  it("rejects empty section labels only for the create draft", () => {
    const blankSection = [field({ key: "a", label: "A", segments: [{ key: "s", label: "" }] })];
    expect(TemplateDraftSubmission.validate("create", blankSection, [], ALL_LAYOUTS)).toBe("กรุณากรอกชื่อ Field ให้ครบทุกช่อง");
    expect(TemplateDraftSubmission.validate("edit", blankSection, [], ALL_LAYOUTS)).toBeUndefined();
  });

  it("requires at least one sticker layout", () => {
    const none = { insideFrame: false, outsideFrame: false, customerName: false, fscLogo: false };
    expect(TemplateDraftSubmission.validate("edit", ok, [], none)).toBe("เลือกรูปแบบสติ๊กเกอร์ที่ต้องพิมพ์อย่างน้อย 1 แบบ");
    expect(TemplateDraftSubmission.validate("create", ok, [], none)).toBe("กรุณาเลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ");
    expect(TemplateDraftSubmission.validate("edit", ok, [], { ...none, fscLogo: true })).toBeUndefined();
  });

  it("rejects duplicate keys within a section, not across sections", () => {
    const dup = [field({ key: "a", label: "A" }), field({ key: "a", label: "B" })];
    expect(TemplateDraftSubmission.validate("create", dup, [], ALL_LAYOUTS)).toBe("มี Field ที่ซ้ำกัน กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง");
    expect(TemplateDraftSubmission.validate("create", ok, ok, ALL_LAYOUTS)).toBeUndefined();
  });
});
