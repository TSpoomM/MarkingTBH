import { describe, expect, it } from "vitest";
import TemplateFieldUtils from "./templateFieldUtils";
import { field } from "@/src/core/test/fixtures";

const seg = (key: string, overrides = {}) => ({ key, label: key.toUpperCase(), ...overrides });

describe("counter types", () => {
  it("infers pallet from the key or label and defaults to lot", () => {
    expect(TemplateFieldUtils.inferCounterType({ key: "palletNo", label: "X" })).toBe("pallet");
    expect(TemplateFieldUtils.inferCounterType({ key: "x", label: "PALLET NO." })).toBe("pallet");
    expect(TemplateFieldUtils.inferCounterType({ key: "lotNo", label: "LOT NO." })).toBe("lot");
  });

  it("labels each counter type", () => {
    expect(TemplateFieldUtils.counterTypeLabel("lot")).toBe("Lot");
    expect(TemplateFieldUtils.counterTypeLabel("pallet")).toBe("Pallet");
    expect(TemplateFieldUtils.counterTypeLabel("sequence")).toBe("+1 ไปเรื่อยๆ");
  });
});

describe("TemplateFieldUtils.segmentPreview", () => {
  it("shows XXX per visible section separated by spaces", () => {
    const preview = TemplateFieldUtils.segmentPreview(field({
      segments: [seg("a"), seg("b"), seg("c", { showOnSticker: false })],
    }));
    expect(preview).toBe("XXX XXX");
  });

  it("wraps each section in its prefix and suffix", () => {
    const preview = TemplateFieldUtils.segmentPreview(field({
      segments: [seg("a", { prefix: "(" }), seg("b", { suffix: ")" })],
    }));
    expect(preview).toBe("(XXXXXX)");
  });

  it("fills a display format by position, key or label and drops leftovers", () => {
    const preview = TemplateFieldUtils.segmentPreview(field({
      displayFormat: "{1}-{b}-{missing}",
      segments: [seg("a"), seg("b")],
    }));
    expect(preview).toBe("XXX-XXX-");
  });

  it("is empty when no section is visible", () => {
    expect(TemplateFieldUtils.segmentPreview(field({ segments: [] }))).toBe("");
  });
});

describe("TemplateFieldUtils.uniqueSegmentKey", () => {
  it("keeps a free key and reserves it", () => {
    const used = new Set<string>();
    expect(TemplateFieldUtils.uniqueSegmentKey("f", "a", 0, used)).toBe("a");
    expect(used.has("a")).toBe(true);
  });

  it("falls back to field_position for a blank key", () => {
    expect(TemplateFieldUtils.uniqueSegmentKey("f", "  ", 1, new Set())).toBe("f_2");
  });

  it("renames a duplicate so every key stays unique", () => {
    const used = new Set<string>();
    const first = TemplateFieldUtils.uniqueSegmentKey("f", "a", 0, used);
    const second = TemplateFieldUtils.uniqueSegmentKey("f", "a", 1, used);
    expect(first).toBe("a");
    expect(second).toBe("f_a_2");
    expect(new Set([first, second]).size).toBe(2);
  });
});

describe("TemplateFieldUtils.normalizeCounterField", () => {
  it("makes a counter field numeric and infers its counter type", () => {
    const normalized = TemplateFieldUtils.normalizeCounterField(field({ key: "palletNo", isCounter: true }));
    expect(normalized).toMatchObject({ type: "number", counterType: "pallet" });
  });

  it("dedupes segment keys and makes counter sections numeric and visible", () => {
    const normalized = TemplateFieldUtils.normalizeCounterField(field({
      key: "lotNo",
      segments: [seg("s", { isCounter: true, showOnSticker: false }), seg("s")],
    }));
    const [first, second] = normalized.segments!;
    expect(first.key).not.toBe(second.key);
    expect(first).toMatchObject({ type: "number", counterType: "lot", showOnSticker: true });
  });

  it("rewrites the legacy 'large' font scale to xlarge", () => {
    const legacy = field({ fontScale: "large" as unknown as "xlarge" });
    expect(TemplateFieldUtils.normalizeCounterField(legacy).fontScale).toBe("xlarge");
  });

  it("only keeps a date format on date fields", () => {
    expect(TemplateFieldUtils.normalizeCounterField(field({ type: "date", dateFormat: "dd/mm/yyyy" })).dateFormat).toBe("dd/mm/yyyy");
    expect(TemplateFieldUtils.normalizeCounterField(field({ type: "text", dateFormat: "dd/mm/yyyy" })).dateFormat).toBeUndefined();
  });
});

describe("sticker field selection", () => {
  const fields = [
    field({ key: "b", label: "B", stickerOrder: 1 }),
    field({ key: "a", label: "A", stickerOrder: 0, segments: [seg("s1", { stickerOrder: 1 }), seg("s2", { stickerOrder: 0, isCounter: true })] }),
    field({ key: "hidden", label: "H", showOnSticker: false, stickerOrder: 2 }),
  ];

  it("flattens sections into their own selectable entries", () => {
    const keys = TemplateFieldUtils.stickerSelectableFields(fields).map((item) => item.key);
    expect(keys).toEqual(["b", "a.s1", "a.s2", "hidden"]);
  });

  it("labels a counter section with its counter type", () => {
    const counter = TemplateFieldUtils.stickerSelectableFields(fields).find((item) => item.key === "a.s2");
    expect(counter?.label).toBe("A - S2 (+lot)");
  });

  it("selects only visible entries, ordered by parent then own order", () => {
    const keys = TemplateFieldUtils.selectedStickerFields(fields).map((item) => item.key);
    expect(keys).toEqual(["a.s2", "a.s1", "b"]);
  });

  it("groups selected entries by their parent field", () => {
    const groups = TemplateFieldUtils.groupSelectedStickerFields(TemplateFieldUtils.selectedStickerFields(fields));
    expect(groups.map((group) => [group.key, group.fields.length])).toEqual([["a", 2], ["b", 1]]);
  });
});

describe("moving and renumbering", () => {
  const list = ["a", "b", "c", "d"];

  it("moves an item to a new position", () => {
    expect(TemplateFieldUtils.moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(TemplateFieldUtils.moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("returns the same list for a no-op or out-of-range move", () => {
    expect(TemplateFieldUtils.moveItem(list, 1, 1)).toBe(list);
    expect(TemplateFieldUtils.moveItem(list, -1, 2)).toBe(list);
    expect(TemplateFieldUtils.moveItem(list, 0, 4)).toBe(list);
  });

  it("does not mutate the input list", () => {
    const copy = [...list];
    TemplateFieldUtils.moveItem(list, 0, 3);
    expect(list).toEqual(copy);
  });

  it("renumbers sticker order by position and clears hidden fields and sections", () => {
    const renumbered = TemplateFieldUtils.renumberStickerOrders([
      field({ key: "a", stickerOrder: 9 }),
      field({ key: "b", showOnSticker: false, stickerOrder: 9 }),
      field({ key: "c", segments: [seg("s1"), seg("s2", { showOnSticker: false })] }),
    ]);
    expect(renumbered.map((item) => item.stickerOrder)).toEqual([0, undefined, 2]);
    expect(renumbered[2].segments?.map((segment) => segment.stickerOrder)).toEqual([20, undefined]);
  });

  it("closes gaps in outside table numbers, keeping their relative order", () => {
    const renumbered = TemplateFieldUtils.renumberOutsideTableOrders([
      field({ key: "a", stickerGroupOrder: 4 }),
      field({ key: "b", stickerGroupOrder: 4 }),
      field({ key: "c", stickerGroupOrder: 9 }),
    ]);
    expect(renumbered.map((item) => item.stickerGroupOrder)).toEqual([0, 0, 1]);
  });

  it("moves a field into another table and adopts that table's group settings", () => {
    const fields = [
      field({ key: "a", stickerGroup: "ONE", stickerGroupOrder: 0, stickerGroupLayout: "2x2" }),
      field({ key: "b", stickerGroup: "TWO", stickerGroupOrder: 1, stickerGroupLayout: "8x2" }),
    ];
    const moved = TemplateFieldUtils.moveField(fields, 0, 1, 1);
    expect(moved.map((item) => item.key)).toEqual(["b", "a"]);
    expect(moved[1]).toMatchObject({ stickerGroup: "TWO", stickerGroupOrder: 1, stickerGroupLayout: "8x2" });
  });

  it("swaps whole outside tables and renumbers them", () => {
    const fields = [
      field({ key: "a1", stickerGroupOrder: 0 }),
      field({ key: "a2", stickerGroupOrder: 0 }),
      field({ key: "b1", stickerGroupOrder: 1 }),
    ];
    const moved = TemplateFieldUtils.moveOutsideTable(fields, 0, 1);
    expect(moved.map((item) => [item.key, item.stickerGroupOrder])).toEqual([["b1", 0], ["a1", 1], ["a2", 1]]);
  });

  it("leaves tables alone when a table number does not exist", () => {
    const fields = [field({ stickerGroupOrder: 0 })];
    expect(TemplateFieldUtils.moveOutsideTable(fields, 0, 5)).toBe(fields);
    expect(TemplateFieldUtils.moveOutsideTable(fields, 0, 0)).toBe(fields);
  });
});
