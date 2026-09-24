import { describe, expect, it } from "vitest";
import TemplateParser from "./templateParser";
import { UserFacingError } from "@/src/core/errors/userFacingError";

const json = (value: unknown) => JSON.stringify(value);

describe("TemplateParser.parseSticker", () => {
  it("falls back to the defaults for old templates without sticker settings", () => {
    for (const value of [null, "", "not json", json({ fields: [] })]) {
      const sticker = TemplateParser.parseSticker(value);
      expect(sticker.enabledFields).toEqual(["side", "format", "type", "other"]);
      expect(sticker.isActive).toBe(true);
    }
  });

  it("merges stored layouts and defaults over the defaults", () => {
    const sticker = TemplateParser.parseSticker(json({
      sticker: { enabledFields: ["side"], layouts: { insideFrame: false }, defaults: { sideCount: 3 }, isActive: false },
    }));
    expect(sticker.enabledFields).toEqual(["side", "format", "type", "other"]); // always all four
    expect(sticker.layouts.insideFrame).toBe(false);
    expect(sticker.layouts.outsideFrame).toBeDefined();
    expect(sticker.defaults.sideCount).toBe(3);
    expect(sticker.isActive).toBe(false);
  });
});

describe("TemplateParser.parseFields", () => {
  it("requires inside data but tolerates empty outside data when optional", () => {
    expect(() => TemplateParser.parseFields("  ", "Inside")).toThrow("Template Inside ยังไม่มีข้อมูล");
    expect(() => TemplateParser.parseFields(null, "Outside")).toThrow("Template Outside ยังไม่มีข้อมูล");
    expect(TemplateParser.parseFields(null, "Outside", true)).toEqual([]);
  });

  it("reads the plain-text shape: labels split by commas or line breaks", () => {
    const fields = TemplateParser.parseFields("Gross, Nett\nDestination", "Inside");
    expect(fields.map((field) => [field.key, field.label, field.stickerOrder])).toEqual([
      ["gross", "Gross", 0], ["nett", "Nett", 1], ["destination", "Destination", 2],
    ]);
  });

  it("reports a truncated JSON column instead of treating it as text", () => {
    expect(() => TemplateParser.parseFields('{"fields":[{"key":"a"', "Inside"))
      .toThrow("Template Inside JSON ไม่สมบูรณ์");
    expect(() => TemplateParser.parseFields("[1,2", "Outside"))
      .toThrow("Template Outside JSON ไม่สมบูรณ์");
  });

  it("does not put table or column names in the message shown to users", () => {
    expect(() => TemplateParser.parseFields('{"fields":[', "Inside")).toThrow(/^(?!.*tb_template)/);
  });

  it("reports data problems as user-facing errors", () => {
    for (const run of [
      () => TemplateParser.parseFields(null, "Inside"),
      () => TemplateParser.parseFields(json("text"), "Inside"),
      () => TemplateParser.parseFields("[1,2", "Inside"),
    ]) {
      expect(run).toThrow(UserFacingError);
    }
  });

  it("rejects JSON that is neither an object of a known shape nor an array", () => {
    expect(() => TemplateParser.parseFields(json("text"), "Inside")).toThrow("Template Inside ต้องเป็น JSON Array");
    expect(() => TemplateParser.parseFields(json({ other: 1 }), "Outside")).toThrow("Template Outside ต้องเป็น JSON Array");
  });

  describe("array shape", () => {
    it("accepts bare strings and objects", () => {
      const fields = TemplateParser.parseFields(json(["Gross", { key: "nett", label: "NETT", type: "number", required: true }]), "Inside");
      expect(fields[0]).toMatchObject({ key: "gross", label: "Gross", type: "text", required: false, stickerOrder: 0 });
      expect(fields[1]).toMatchObject({ key: "nett", type: "number", required: true, showOnSticker: true, stickerOrder: 1 });
    });

    it("falls back to text for an unknown type and slugs a missing key from the label", () => {
      const [field] = TemplateParser.parseFields(json([{ label: "Contract No.", type: "weird" }]), "Inside");
      expect(field).toMatchObject({ key: "contract_no", type: "text" });
    });

    it("defaults uppercase on for outside fields only", () => {
      const [inside] = TemplateParser.parseFields(json([{ key: "a", label: "A" }]), "Inside");
      const [outside] = TemplateParser.parseFields(json([{ key: "a", label: "A" }]), "Outside");
      expect(inside.uppercase).toBeUndefined();
      expect(outside.uppercase).toBe(true);
    });

    it("maps the legacy 4x2 layout to 8x2 and drops other layout values", () => {
      const fields = TemplateParser.parseFields(json([
        { key: "a", label: "A", stickerGroupLayout: "4x2" },
        { key: "b", label: "B", stickerGroupLayout: "2x2" },
      ]), "Outside");
      expect(fields.map((field) => field.stickerGroupLayout)).toEqual(["8x2", undefined]);
    });

    it("normalizes legacy condition values and the legacy 'large' font scale", () => {
      const fields = TemplateParser.parseFields(json([
        { key: "a", label: "A", condition: { stickerType: "FCS" }, fontScale: "large" },
        { key: "b", label: "B", condition: { stickerType: "NON-TNR" }, fontScale: "bogus" },
      ]), "Outside");
      expect(fields[0]).toMatchObject({ condition: { stickerType: "TNR" }, fontScale: "xlarge" });
      expect(fields[1]).toMatchObject({ condition: { stickerType: "NON TNR" }, fontScale: undefined });
    });

    it("gives sections unique keys and numbers them from the field order", () => {
      const [field] = TemplateParser.parseFields(json([{
        key: "lot", label: "LOT", stickerOrder: 2,
        segments: [{ key: "s", label: "S1", isCounter: true }, { key: "s", label: "S2" }],
      }]), "Inside");
      const [first, second] = field.segments!;
      expect(first.key).not.toBe(second.key);
      expect(first).toMatchObject({ type: "number", counterType: "lot", showOnSticker: true, stickerOrder: 20 });
      expect(second.stickerOrder).toBe(21);
    });
  });

  describe("inside { fields } shape", () => {
    it("reads the editor's shape and ignores stored group settings", () => {
      const fields = TemplateParser.parseFields(json({
        version: 2,
        fields: [{ key: "a", label: "A", uppercase: false, stickerGroup: "X" }],
      }), "Inside");
      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({ key: "a", label: "A", showOnSticker: true, stickerOrder: 0 });
      expect(fields[0].uppercase).toBeUndefined();
      expect(fields[0].stickerGroup).toBeUndefined();
    });
  });

  describe("inside { groups, fields } shape", () => {
    const stored = json({
      groups: [
        { label: "LOT NO.", segments: [{ key: "l1", label: "L", isCounter: true, counterType: "lot" }] },
        { label: "PALLET NO.", segments: [{ isCounter: true }] },
      ],
      fields: [{ key: "gross", label: "GROSS" }, { label: "NETT" }],
    });

    it("turns each group into a section field, followed by the fixed rows", () => {
      const fields = TemplateParser.parseFields(stored, "Inside");
      expect(fields.map((field) => [field.key, field.label, field.stickerOrder])).toEqual([
        ["inside_group_1", "LOT NO.", 0],
        ["inside_group_2", "PALLET NO.", 1],
        ["gross", "GROSS", 2],
        ["inside_fixed_2", "NETT", 3],
      ]);
    });

    it("keeps counter sections numeric, fills in missing keys and labels, and infers the counter type from the group name", () => {
      const [lot, pallet] = TemplateParser.parseFields(stored, "Inside");
      expect(lot.segments![0]).toMatchObject({ key: "l1", type: "number", counterType: "lot", stickerOrder: 0 });
      expect(pallet.segments![0]).toMatchObject({ key: "inside_2_1", label: "Section 1", counterType: "pallet", stickerOrder: 10 });
    });

    it("infers a pallet counter for a group named after pallets", () => {
      const [, pallet] = TemplateParser.parseFields(json({
        groups: [{ label: "LOT" }, { label: "PALLET NO.", segments: [{ isCounter: true }] }],
      }), "Inside");
      // keys are generated (inside_group_N), so the label decides here
      expect(pallet.segments![0].counterType).toBe("pallet");
    });
  });

  describe("outside { tables } shape", () => {
    const stored = json({
      tables: [
        { name: "BOX A", fields: [{ key: "x", label: "Weight", required: true }, { label: "Size" }] },
        { fields: [{ key: "y", label: "Note" }] },
      ],
    });

    it("flattens tables into one list, one group per table", () => {
      const fields = TemplateParser.parseFields(stored, "Outside");
      expect(fields.map((field) => [field.key, field.label, field.stickerGroup, field.stickerGroupOrder])).toEqual([
        ["x", "BOX A — Weight", "BOX A", 0],
        ["outside_1_2", "BOX A — Size", "BOX A", 0],
        ["y", "นอกกรอบ 2 — Note", "นอกกรอบ 2", 1],
      ]);
    });

    it("defaults uppercase on and keeps required", () => {
      const [first] = TemplateParser.parseFields(stored, "Outside");
      expect(first).toMatchObject({ uppercase: true, required: true, showOnSticker: true });
    });
  });
});
