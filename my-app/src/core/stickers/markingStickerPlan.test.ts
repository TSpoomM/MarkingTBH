import { describe, expect, it } from "vitest";
import MarkingStickerPlan from "./markingStickerPlan";
import { ALL_LAYOUTS, field, markingState, templateDetail } from "@/src/core/test/fixtures";
import type { MarkingState } from "@/src/core/models/marking";

const boxGroup = (overrides = {}) =>
  field({ key: "box", label: "BOX", stickerGroup: "BOX", stickerGroupOrder: 0, ...overrides });

function stateWith(template: Parameters<typeof templateDetail>[0], overrides: Partial<MarkingState> = {}) {
  return markingState({ template: templateDetail(template), ...overrides });
}

describe("MarkingStickerPlan.outsideFields", () => {
  it("keeps only fields whose condition matches the selected sticker values", () => {
    const state = stateWith({
      outside: [
        boxGroup({ key: "always" }),
        boxGroup({ key: "tnr", condition: { stickerType: "TNR" } }),
        boxGroup({ key: "dome", condition: { stickerOther: "Dome" } }),
      ],
    });
    expect(MarkingStickerPlan.outsideFields(state).map((item) => item.key)).toEqual(["always", "dome"]);
  });

  it("is empty without a template", () => {
    expect(MarkingStickerPlan.outsideFields(markingState({ template: null }))).toEqual([]);
  });
});

describe("MarkingStickerPlan.printItems", () => {
  it("builds nothing until a print run is active", () => {
    expect(MarkingStickerPlan.printItems(markingState({ isPrintSheetActive: false }))).toEqual([]);
  });

  it("builds inside stickers from the chosen format and sides", () => {
    const items = MarkingStickerPlan.printItems(markingState({ stickerSides: "2" }));
    expect(items).toHaveLength(10);
  });
});

describe("MarkingStickerPlan.printPages", () => {
  it("splits inside stickers into pages of four", () => {
    const { framePages } = MarkingStickerPlan.printPages(markingState()); // 5 stickers
    expect(framePages.map((page) => [page.layout, page.items.length])).toEqual([["frame", 4], ["frame", 1]]);
  });

  it("drops inside pages when that section is not selected", () => {
    const state = markingState({ printSections: { insideFrame: false, outsideFrame: true, customerName: false, fscLogo: false } });
    expect(MarkingStickerPlan.printPages(state).framePages).toEqual([]);
  });

  it("puts an 8x2 outside table on vertical pages of sixteen", () => {
    const state = stateWith(
      { outside: [boxGroup({ stickerGroupLayout: "8x2" })], sticker: { ...templateDetail().sticker, layouts: { ...ALL_LAYOUTS, insideFrame: false } } },
      { stickerSides: "4" }, // 5 pallets x 4 sides = 20 stickers
    );
    const { framePages } = MarkingStickerPlan.printPages(state);
    expect(framePages.map((page) => [page.layout, page.items.length])).toEqual([["frameVertical", 16], ["frameVertical", 4]]);
  });

  it("skips an outside group the user unticked", () => {
    const state = stateWith(
      { outside: [boxGroup()] },
      { printOutsideGroups: { "0:BOX": false }, printSections: { insideFrame: false, outsideFrame: true, customerName: false, fscLogo: false } },
    );
    expect(MarkingStickerPlan.printPages(state).framePages).toEqual([]);
  });

  it("lays FSC logos out four stickers to a page, only when selected", () => {
    const fsc = { stickerType: "TNR", stickerFsc: true };
    const on = markingState({ ...fsc, printSections: { insideFrame: false, outsideFrame: false, customerName: false, fscLogo: true } });
    expect(MarkingStickerPlan.printPages(on).fscLogoPages.map((page) => page.length)).toEqual([2]);

    const off = markingState({ ...fsc, printSections: { insideFrame: false, outsideFrame: false, customerName: false, fscLogo: false } });
    expect(MarkingStickerPlan.printPages(off).fscLogoPages).toEqual([]);
  });
});

describe("MarkingStickerPlan.availableSections / printOptions", () => {
  it("offers inside frame only, for a template with no outside fields", () => {
    const state = markingState();
    expect(MarkingStickerPlan.availableSections(state)).toEqual({
      insideFrame: true, outsideFrame: false, customerName: false, fscLogo: false,
    });
    expect(MarkingStickerPlan.printOptions(state).map((option) => option.key)).toEqual(["insideFrame"]);
  });

  it("offers one option per outside table plus FSC when it applies", () => {
    const state = stateWith(
      { outside: [boxGroup(), boxGroup({ key: "other", stickerGroup: "OTHER", stickerGroupOrder: 1 })] },
      { stickerType: "TNR", stickerFsc: true },
    );
    expect(MarkingStickerPlan.printOptions(state).map((option) => option.key)).toEqual([
      "insideFrame", "outside-0:BOX", "outside-1:OTHER", "fscLogo",
    ]);
  });

  it("hides sections the template turned off", () => {
    const state = stateWith({
      sticker: { ...templateDetail().sticker, layouts: { ...ALL_LAYOUTS, insideFrame: false } },
    });
    expect(MarkingStickerPlan.availableSections(state).insideFrame).toBe(false);
  });
});

describe("MarkingStickerPlan selection helpers", () => {
  const state = stateWith(
    { outside: [boxGroup()] },
    { printOutsideGroups: { "0:BOX": false } },
  );
  const options = MarkingStickerPlan.printOptions(state);

  it("treats an unticked outside group as not selected even when the section is on", () => {
    const outside = options.find((option) => option.section === "outsideFrame")!;
    expect(MarkingStickerPlan.isOptionSelected(state, outside)).toBe(false);
    expect(MarkingStickerPlan.isOptionSelected(state, options[0])).toBe(true);
  });

  it("reports whether anything is selected at all", () => {
    expect(MarkingStickerPlan.hasSelectedPrintSection(state, options)).toBe(true);
    const none = { ...state, printSections: { insideFrame: false, outsideFrame: false, customerName: false, fscLogo: false } };
    expect(MarkingStickerPlan.hasSelectedPrintSection(none, options)).toBe(false);
  });
});

describe("MarkingStickerPlan.previewItems", () => {
  it("shows one sticker per layout, even before anything is filled in", () => {
    const state = stateWith(
      { outside: [boxGroup()] },
      { stickerFormat: "", stickerSides: "", productionDate: "" },
    );
    const items = MarkingStickerPlan.previewItems(state);
    expect(items.map((item) => item.kind)).toEqual(["insideFrame", "outsideFrame"]);
  });
});
