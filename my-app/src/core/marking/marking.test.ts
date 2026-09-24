import { describe, expect, it } from "vitest";
import MarkingRows from "./markingRows";
import MarkingSubmission from "./markingSubmission";
import { field, markingState, templateDetail } from "@/src/core/test/fixtures";
import { MESSAGES } from "@/src/core/models/constants";

const lotCounter = (overrides = {}) => field({ key: "lotNo", label: "LOT NO.", isCounter: true, counterType: "lot", ...overrides });
const palletCounter = (overrides = {}) => field({ key: "palletNo", label: "PALLET NO.", isCounter: true, counterType: "pallet", ...overrides });

describe("MarkingRows.emptyRow", () => {
  it("starts counters at the lot start (lot) or 1 (pallet)", () => {
    expect(MarkingRows.emptyRow([lotCounter(), palletCounter()], 12)).toEqual({ lotNo: "12", palletNo: "1" });
  });

  it("falls back to 1 when the lot start is 0", () => {
    expect(MarkingRows.emptyRow([lotCounter()], 0)).toEqual({ lotNo: "1" });
  });

  it("pads counters to four digits or to the width of their default value", () => {
    expect(MarkingRows.emptyRow([lotCounter({ counterPad4: true })], 7)).toEqual({ lotNo: "0007" });
    expect(MarkingRows.emptyRow([lotCounter({ defaultValue: "00100" })], 7)).toEqual({ lotNo: "00007" });
  });

  it("upper-cases default values except for dates and fields that opt out", () => {
    const row = MarkingRows.emptyRow([
      field({ key: "a", defaultValue: "abc" }),
      field({ key: "b", defaultValue: "abc", uppercase: false }),
      field({ key: "c", type: "date", defaultValue: "02 Sep 2026" }),
    ], 1);
    expect(row).toEqual({ a: "ABC", b: "abc", c: "02 Sep 2026" });
  });

  it("uses the label as the value of a locked field without a default", () => {
    expect(MarkingRows.emptyRow([field({ key: "a", label: "Fixed", locked: true })], 1)).toEqual({ a: "FIXED" });
  });

  it("makes a cell per section, filling only counter sections", () => {
    const sectioned = field({
      key: "lot",
      segments: [{ key: "s1", label: "S1", isCounter: true, counterType: "lot" }, { key: "s2", label: "S2" }],
    });
    expect(MarkingRows.emptyRow([sectioned], 5)).toEqual({ s1: "5", s2: "" });
  });
});

describe("MarkingRows.templateLotStart", () => {
  it("defaults to 1", () => {
    expect(MarkingRows.templateLotStart(null)).toBe(1);
    expect(MarkingRows.templateLotStart([field()])).toBe(1);
  });

  it("uses the default value of the lot counter", () => {
    expect(MarkingRows.templateLotStart([palletCounter({ defaultValue: "9" }), lotCounter({ defaultValue: "250" })])).toBe(250);
  });

  it("ignores defaults that are not positive integers", () => {
    for (const bad of ["0", "-3", "abc", "1.5", ""]) {
      expect(MarkingRows.templateLotStart([lotCounter({ defaultValue: bad })])).toBe(1);
    }
  });

  it("looks inside sections for a lot counter", () => {
    const sectioned = field({
      key: "lot",
      defaultValue: "40",
      segments: [{ key: "s", label: "S", isCounter: true, counterType: "lot" }],
    });
    expect(MarkingRows.templateLotStart([sectioned])).toBe(40);
  });
});

describe("MarkingRows.withCounterDefaults", () => {
  it("moves counters that still hold the old default to the new lot start", () => {
    const [row] = MarkingRows.withCounterDefaults([{ lotNo: "5", palletNo: "1" }], [lotCounter(), palletCounter()], 9, 5);
    expect(row).toEqual({ lotNo: "9", palletNo: "1" });
  });

  it("leaves a counter the user edited alone", () => {
    const [row] = MarkingRows.withCounterDefaults([{ lotNo: "77" }], [lotCounter()], 9, 5);
    expect(row.lotNo).toBe("77");
  });

  it("fills an empty counter cell", () => {
    const [row] = MarkingRows.withCounterDefaults([{ lotNo: "" }], [lotCounter()], 9, 5);
    expect(row.lotNo).toBe("9");
  });

  it("recognizes a padded old default", () => {
    const padded = lotCounter({ counterPad4: true });
    const [row] = MarkingRows.withCounterDefaults([{ lotNo: "0005" }], [padded], 9, 5);
    expect(row.lotNo).toBe("0009");
  });

  it("handles counter sections and does not mutate its input", () => {
    const sectioned = field({ key: "lot", segments: [{ key: "s1", label: "S1", isCounter: true, counterType: "lot" }] });
    const rows = [{ s1: "5" }];
    const [next] = MarkingRows.withCounterDefaults(rows, [sectioned], 9, 5);
    expect(next.s1).toBe("9");
    expect(rows[0].s1).toBe("5");
  });
});

describe("MarkingRows.normalizeInput", () => {
  it("upper-cases by default and keeps case for fields that opt out", () => {
    const fields = [field({ key: "a" }), field({ key: "b", uppercase: false })];
    expect(MarkingRows.normalizeInput(fields, "a", "abc")).toBe("ABC");
    expect(MarkingRows.normalizeInput(fields, "b", "abc")).toBe("abc");
  });

  it("never upper-cases a date field or a date section", () => {
    const fields = [
      field({ key: "d", type: "date" }),
      field({ key: "lot", segments: [{ key: "sd", label: "SD", type: "date" }] }),
    ];
    expect(MarkingRows.normalizeInput(fields, "d", "02 Sep 2026")).toBe("02 Sep 2026");
    expect(MarkingRows.normalizeInput(fields, "sd", "02 Sep 2026")).toBe("02 Sep 2026");
  });

  it("keeps only digits in a counter", () => {
    expect(MarkingRows.normalizeInput([lotCounter()], "lotNo", "1a2-3")).toBe("123");
  });

  it("always returns the fixed text of a locked field", () => {
    const fields = [field({ key: "a", label: "Fixed", locked: true })];
    expect(MarkingRows.normalizeInput(fields, "a", "anything")).toBe("FIXED");
  });

  it("upper-cases keys it knows nothing about", () => {
    expect(MarkingRows.normalizeInput(undefined, "x", "abc")).toBe("ABC");
  });
});

describe("MarkingRows.isLotCounterKey", () => {
  it("is true only for lot counters", () => {
    const fields = [lotCounter(), palletCounter(), field({ key: "plain" })];
    expect(MarkingRows.isLotCounterKey(fields, "lotNo")).toBe(true);
    expect(MarkingRows.isLotCounterKey(fields, "palletNo")).toBe(false);
    expect(MarkingRows.isLotCounterKey(fields, "plain")).toBe(false);
  });

  it("guesses from the key name when there is no template", () => {
    expect(MarkingRows.isLotCounterKey(undefined, "Lot_1")).toBe(true);
    expect(MarkingRows.isLotCounterKey(undefined, "gross")).toBe(false);
  });
});

describe("MarkingRows.withLockedDefaults", () => {
  it("writes the locked value into every row and leaves other cells", () => {
    const fields = [field({ key: "a", label: "Fixed", locked: true }), field({ key: "b" })];
    expect(MarkingRows.withLockedDefaults(fields, [{ a: "", b: "x" }])).toEqual([{ a: "FIXED", b: "x" }]);
  });

  it("returns the same rows when nothing is locked", () => {
    const rows = [{ b: "x" }];
    expect(MarkingRows.withLockedDefaults([field({ key: "b" })], rows)).toBe(rows);
  });
});

describe("MarkingSubmission.validate", () => {
  const template = (inside = [field({ key: "a", label: "GROSS" })], outside = [field({ key: "o", label: "BOX" })]) =>
    templateDetail({ inside, outside });
  const valid = () => markingState({ template: template(), insideRows: [{ a: "1" }], outsideRows: [{ o: "2" }] });

  it("passes a complete form", () => {
    expect(MarkingSubmission.validate(valid())).toBe("");
  });

  it("asks for a template first", () => {
    expect(MarkingSubmission.validate(markingState({ templateId: "" }))).toBe(MESSAGES.selectTemplate);
  });

  it.each([
    [{ productionDate: "" }, "กรุณาเลือก Production Date"],
    [{ lotCount: "0" }, "กรุณากรอกจำนวน Lot"],
    [{ lotCount: "abc" }, "กรุณากรอกจำนวน Lot"],
    [{ stickerSides: "" }, "กรุณาเลือก Side"],
    [{ stickerFormat: "" }, "กรุณาเลือก Format"],
    [{ stickerType: "" }, "กรุณาเลือกเกรด"],
    [{ stickerOther: "" }, "กรุณาเลือก Other"],
  ])("reports %j", (patch, message) => {
    expect(MarkingSubmission.validate({ ...valid(), ...patch })).toBe(message);
  });

  it("names the first empty required inside field and its row", () => {
    const state = { ...valid(), insideRows: [{ a: "1" }, { a: "  " }] };
    expect(MarkingSubmission.validate(state)).toBe("Inside แถว 2: กรุณากรอก GROSS");
  });

  it("names the first empty required outside field", () => {
    const state = { ...valid(), outsideRows: [{ o: "" }] };
    expect(MarkingSubmission.validate(state)).toBe("Outside แถว 1: กรุณากรอก BOX");
  });

  it("ignores fields whose condition does not match, and counter sections", () => {
    const conditional = field({ key: "c", label: "TNR ONLY", condition: { stickerType: "TNR" } });
    const sectioned = field({ key: "s", label: "SEC", segments: [{ key: "s1", label: "S1", isCounter: true }, { key: "s2", label: "S2" }] });
    const state = markingState({ template: template([conditional, sectioned]), insideRows: [{ s2: "x" }], outsideRows: [] });
    expect(MarkingSubmission.validate(state)).toBe("");
    expect(MarkingSubmission.validate({ ...state, insideRows: [{}] })).toBe("Inside แถว 1: กรุณากรอก SEC");
  });
});

describe("MarkingSubmission.buildPayload", () => {
  const state = markingState({
    template: templateDetail({ inside: [field({ key: "a", label: "Fixed", locked: true })] }),
    insideRows: [{ a: "" }],
    outsideRows: [{ o: "1" }],
    totalLot: "10",
    lotCount: "3",
    lotStart: 20,
    stickerType: "TNR",
    stickerFsc: true,
  });

  it("copies the form into the request and stamps lot range and sticker options on inside rows", () => {
    const payload = MarkingSubmission.buildPayload(state);
    expect(payload).toMatchObject({ templateId: 1, totalLot: 10, stickerSides: 1, lotCount: 3, lotStart: 20, actionType: "save" });
    expect(payload.contentInside[0]).toMatchObject({
      a: "FIXED",
      production_date: "2026-09-02",
      lot_count: "3",
      lot_start: "20",
      lot_end: "22",
      sticker_format: "555",
      sticker_type: "TNR",
      sticker_fsc: "YES",
      sticker_other: "Dome",
    });
    expect(payload.contentOutside).toEqual([{ o: "1" }]);
  });

  it("only records the FSC choice for TNR stickers", () => {
    const payload = MarkingSubmission.buildPayload({ ...state, stickerType: "NON TNR" });
    expect(payload.contentInside[0]).not.toHaveProperty("sticker_fsc");
  });

  it("includes the chosen print sections only when printing", () => {
    expect(MarkingSubmission.buildPayload(state, "save")).not.toHaveProperty("printSections");
    expect(MarkingSubmission.buildPayload(state, "print").printSections).toEqual(state.printSections);
  });

  it("uses safe defaults for blank numeric fields", () => {
    const payload = MarkingSubmission.buildPayload({ ...state, totalLot: "", stickerSides: "", lotCount: "" });
    expect(payload).toMatchObject({ totalLot: 0, stickerSides: 1, lotCount: 1 });
    expect(payload.contentInside[0].lot_end).toBe("20");
  });
});
