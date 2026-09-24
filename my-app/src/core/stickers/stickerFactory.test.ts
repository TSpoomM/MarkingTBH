import { describe, expect, it } from "vitest";
import StickerFactory from "./stickerFactory";
import { ALL_LAYOUTS, field } from "@/src/core/test/fixtures";
import type { StickerBuildOptions } from "@/src/core/models/marking-sticker";

function buildOptions(overrides: Partial<StickerBuildOptions> = {}): StickerBuildOptions {
  return {
    customerName: "",
    format: "555",
    sideCount: 1,
    lotCount: 1,
    lotStart: 1,
    productionDate: "2026-09-02",
    stickerType: "NON TNR",
    stickerFsc: false,
    layouts: { ...ALL_LAYOUTS },
    insideFields: [],
    outsideFields: [],
    insideRow: undefined,
    outsideRow: undefined,
    ...overrides,
  };
}

describe("StickerFactory helpers", () => {
  it("chunks a list into fixed-size pages", () => {
    expect(StickerFactory.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(StickerFactory.chunk([], 4)).toEqual([]);
  });

  it("maps the legacy 4x2 layout onto 8x2 and defaults to 2x2", () => {
    expect(StickerFactory.normalizeGroupLayout("4x2")).toBe("8x2");
    expect(StickerFactory.normalizeGroupLayout("8x2")).toBe("8x2");
    expect(StickerFactory.normalizeGroupLayout(undefined)).toBe("2x2");
    expect(StickerFactory.isVerticalGroupLayout("4x2")).toBe(true);
    expect(StickerFactory.isVerticalGroupLayout("2x2")).toBe(false);
  });

  it("matches conditions only when the selected sticker values equal the required ones", () => {
    const tnrOnly = field({ condition: { stickerType: "TNR" } });
    expect(StickerFactory.matchesCondition(field(), "", "")).toBe(true);
    expect(StickerFactory.matchesCondition(tnrOnly, "TNR", "")).toBe(true);
    expect(StickerFactory.matchesCondition(tnrOnly, "NON TNR", "")).toBe(false);
    expect(StickerFactory.matchesCondition(tnrOnly, "", "")).toBe(false);
  });

  it("reports which sticker selectors the fields depend on", () => {
    const fields = [field({ condition: { stickerOther: "Dome" } })];
    expect(StickerFactory.needsStickerOther(fields)).toBe(true);
    expect(StickerFactory.needsStickerType(fields)).toBe(false);
  });

  it("renames legacy 'Box N' groups", () => {
    expect(StickerFactory.outsideGroupTitle("Box 3")).toBe("นอกกรอบ 3");
    expect(StickerFactory.outsideGroupTitle("CUSTOM")).toBe("CUSTOM");
  });
});

describe("StickerFactory.outsideGroups", () => {
  it("groups fields by stickerGroup and order, sorted by order", () => {
    const groups = StickerFactory.outsideGroups([
      field({ key: "a", label: "A", stickerGroup: "SECOND", stickerGroupOrder: 1 }),
      field({ key: "b", label: "B", stickerGroup: "FIRST", stickerGroupOrder: 0, stickerGroupLayout: "4x2" }),
      field({ key: "c", label: "C", stickerGroup: "FIRST", stickerGroupOrder: 0 }),
    ]);
    expect(groups.map((group) => [group.name, group.order, group.layout, group.fields.length])).toEqual([
      ["FIRST", 0, "8x2", 2],
      ["SECOND", 1, "2x2", 1],
    ]);
  });

  it("builds a stable key from order and name", () => {
    expect(StickerFactory.outsideGroupKey({ name: "BOX", order: 2 })).toBe("2:BOX");
  });
});

describe("StickerFactory.build", () => {
  it("builds nothing for an unknown format or an empty run", () => {
    expect(StickerFactory.build(buildOptions({ format: "nope" }))).toEqual([]);
    expect(StickerFactory.build(buildOptions({ sideCount: 0 }))).toEqual([]);
    expect(StickerFactory.build(buildOptions({ lotCount: 0 }))).toEqual([]);
  });

  it("makes one inside sticker per pallet and side", () => {
    const items = StickerFactory.build(buildOptions({ sideCount: 2, lotStart: 7 }));
    expect(items).toHaveLength(5 * 2); // "555" -> 5 pallets in the lot
    expect(items.every((item) => item.kind === "insideFrame" && item.lot === 7)).toBe(true);
    expect(items.map((item) => [item.pallet, item.side]).slice(0, 3)).toEqual([[1, 1], [1, 2], [2, 1]]);
  });

  it("follows the pallet pattern of the 5533 format across lots", () => {
    const items = StickerFactory.build(buildOptions({ format: "5533", lotCount: 4 }));
    const perLot = [1, 2, 3, 4].map((lot) => items.filter((item) => item.lot === lot).length);
    expect(perLot).toEqual([5, 5, 3, 3]);
  });

  it("only builds outside stickers when there are outside fields and the layout is on", () => {
    const outsideFields = [field({ key: "o", label: "O", stickerGroup: "BOX", stickerGroupOrder: 0 })];
    const withOutside = StickerFactory.build(buildOptions({ outsideFields }));
    expect(withOutside.filter((item) => item.kind === "outsideFrame")).toHaveLength(5);
    expect(withOutside.find((item) => item.kind === "outsideFrame")).toMatchObject({ group: "BOX", groupOrder: 0 });

    const layoutOff = StickerFactory.build(buildOptions({ outsideFields, layouts: { ...ALL_LAYOUTS, outsideFrame: false } }));
    expect(layoutOff.some((item) => item.kind === "outsideFrame")).toBe(false);
    expect(StickerFactory.build(buildOptions()).some((item) => item.kind === "outsideFrame")).toBe(false);
  });

  it("needs a customer name before it builds name stickers", () => {
    const layouts = { ...ALL_LAYOUTS, customerName: true };
    expect(StickerFactory.build(buildOptions({ layouts, customerName: "  " })).some((i) => i.kind === "customerName")).toBe(false);
    expect(StickerFactory.build(buildOptions({ layouts, customerName: "ACME" })).filter((i) => i.kind === "customerName")).toHaveLength(5);
  });

  it("packs FSC logos three to a sticker", () => {
    const items = StickerFactory.build(buildOptions({ stickerType: "TNR", stickerFsc: true, layouts: { ...ALL_LAYOUTS, insideFrame: false } }));
    expect(items.map((item) => [item.kind, item.logoCount])).toEqual([["fscLogo", 3], ["fscLogo", 2]]);
  });

  it("skips FSC logos unless the type is TNR and FSC is on", () => {
    expect(StickerFactory.build(buildOptions({ stickerType: "NON TNR", stickerFsc: true })).some((i) => i.kind === "fscLogo")).toBe(false);
    expect(StickerFactory.build(buildOptions({ stickerType: "TNR", stickerFsc: false })).some((i) => i.kind === "fscLogo")).toBe(false);
  });

  describe("field values", () => {
    it("leaves out fields with no value and appends KG to gross/nett", () => {
      const [item] = StickerFactory.build(buildOptions({
        insideFields: [
          field({ key: "gross", label: "GROSS", stickerOrder: 0 }),
          field({ key: "nett", label: "NETT", stickerOrder: 1 }),
          field({ key: "note", label: "NOTE", stickerOrder: 2 }),
        ],
        insideRow: { gross: "1300", nett: "1260 kg" },
      }));
      expect(item.details.map((detail) => [detail.label, detail.values[0].value])).toEqual([
        ["GROSS", "1300 KG"],
        ["NETT", "1260 kg"],
      ]);
    });

    it("hides fields switched off for the sticker", () => {
      const [item] = StickerFactory.build(buildOptions({
        insideFields: [field({ key: "a", label: "A", showOnSticker: false })],
        insideRow: { a: "value" },
      }));
      expect(item.details).toEqual([]);
    });

    it("orders details by stickerOrder", () => {
      const [item] = StickerFactory.build(buildOptions({
        insideFields: [
          field({ key: "b", label: "B", stickerOrder: 1 }),
          field({ key: "a", label: "A", stickerOrder: 0 }),
        ],
        insideRow: { a: "1", b: "2" },
      }));
      expect(item.details.map((detail) => detail.label)).toEqual(["A", "B"]);
    });
  });

  describe("counters", () => {
    const lotCounter = field({ key: "lotNo", label: "LOT NO.", isCounter: true, counterType: "lot" });
    const detailValue = (items: ReturnType<typeof StickerFactory.build>, lot: number, pallet = 1) =>
      items.find((item) => item.lot === lot && item.pallet === pallet)?.details[0]?.values[0].value;

    it("counts the lot counter up from lotStart", () => {
      const items = StickerFactory.build(buildOptions({ lotStart: 10, lotCount: 2, insideFields: [lotCounter] }));
      expect(detailValue(items, 10)).toBe("10");
      expect(detailValue(items, 11)).toBe("11");
    });

    it("counts the pallet counter within each lot", () => {
      const palletCounter = field({ key: "palletNo", label: "PALLET NO.", isCounter: true, counterType: "pallet" });
      const items = StickerFactory.build(buildOptions({ insideFields: [palletCounter] }));
      expect([1, 2, 3, 4, 5].map((pallet) => detailValue(items, 1, pallet))).toEqual(["1", "2", "3", "4", "5"]);
    });

    it("keeps counting across lots for a sequence counter", () => {
      const sequence = field({ key: "seq", label: "SEQ", isCounter: true, counterType: "sequence" });
      const items = StickerFactory.build(buildOptions({ lotCount: 2, insideFields: [sequence] }));
      expect(detailValue(items, 1, 1)).toBe("1");
      expect(detailValue(items, 2, 1)).toBe("6"); // first lot used 5 pallets
    });

    it("pads to four digits when asked", () => {
      const items = StickerFactory.build(buildOptions({ insideFields: [{ ...lotCounter, counterPad4: true }] }));
      expect(detailValue(items, 1)).toBe("0001");
    });

    it("continues from a typed seed and keeps its width", () => {
      const items = StickerFactory.build(buildOptions({
        lotCount: 2,
        insideFields: [lotCounter],
        insideRow: { lotNo: "0100" },
      }));
      expect(detailValue(items, 1)).toBe("0100");
      expect(detailValue(items, 2)).toBe("0101");
    });

    it("infers a pallet counter from the field name when no type is set", () => {
      const inferred = field({ key: "pallet_no", label: "PALLET", isCounter: true });
      const items = StickerFactory.build(buildOptions({ insideFields: [inferred] }));
      expect(detailValue(items, 1, 3)).toBe("3");
    });
  });

  describe("multi-section fields", () => {
    const sectioned = field({
      key: "lotNo",
      label: "LOT NO.",
      segments: [
        { key: "s1", label: "S1", showOnSticker: true, stickerOrder: 0 },
        { key: "s2", label: "S2", showOnSticker: true, stickerOrder: 1 },
      ],
    });

    it("shows each filled section under the field label", () => {
      const [item] = StickerFactory.build(buildOptions({ insideFields: [sectioned], insideRow: { s1: "A", s2: "B" } }));
      expect(item.details).toHaveLength(1);
      expect(item.details[0].values).toEqual([{ label: "S1", value: "A" }, { label: "S2", value: "B" }]);
    });

    it("joins sections with their affixes into a single value", () => {
      const withAffixes = {
        ...sectioned,
        segments: [
          { key: "s1", label: "S1", showOnSticker: true, stickerOrder: 0, prefix: "(" },
          { key: "s2", label: "S2", showOnSticker: true, stickerOrder: 1, suffix: ")" },
        ],
      };
      const [item] = StickerFactory.build(buildOptions({ insideFields: [withAffixes], insideRow: { s1: "A", s2: "B" } }));
      expect(item.details[0].values).toEqual([{ value: "(AB)" }]);
    });

    it("renders a display format, dropping placeholders that have no value", () => {
      const formatted = { ...sectioned, displayFormat: "{1}/{2}/{3}" };
      const [item] = StickerFactory.build(buildOptions({ insideFields: [formatted], insideRow: { s1: "A", s2: "B" } }));
      expect(item.details[0].values).toEqual([{ value: "A/B/" }]);
    });

    it("omits sections switched off for the sticker", () => {
      const hidden = { ...sectioned, segments: [{ ...sectioned.segments![0], showOnSticker: false }, sectioned.segments![1]] };
      const [item] = StickerFactory.build(buildOptions({ insideFields: [hidden], insideRow: { s1: "A", s2: "B" } }));
      expect(item.details[0].values).toEqual([{ label: "S2", value: "B" }]);
    });
  });

  it("folds a vertical (8x2) outside table onto a single row", () => {
    const outsideFields = [
      field({ key: "a", label: "A", stickerGroup: "BOX", stickerGroupOrder: 0, stickerGroupLayout: "8x2", stickerOrder: 0 }),
      field({ key: "b", label: "B", stickerGroup: "BOX", stickerGroupOrder: 0, stickerGroupLayout: "8x2", stickerOrder: 1 }),
    ];
    const items = StickerFactory.build(buildOptions({ layouts: { ...ALL_LAYOUTS, insideFrame: false }, outsideFields, outsideRow: { a: "1", b: "2" } }));
    expect(items[0].details).toHaveLength(1);
    expect(items[0].details[0].values.map((value) => value.value).join("")).toBe("A: 1    B: 2");
  });
});

describe("StickerFactory.previewCounterValue", () => {
  it("previews the first counter value for the lot start", () => {
    const counter = field({ isCounter: true, counterType: "lot" });
    expect(StickerFactory.previewCounterValue(counter, 12)).toBe("12");
    expect(StickerFactory.previewCounterValue({ ...counter, counterPad4: true }, 12)).toBe("0012");
  });
});
