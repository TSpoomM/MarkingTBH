import { describe, expect, it } from "vitest";
import TemplateDraftEditor from "./templateDraftEditor";
import { field } from "@/src/core/test/fixtures";

const tableField = (key: string, order: number, layout: "2x2" | "8x2" = "2x2") =>
  field({ key, label: key.toUpperCase(), stickerGroup: `TABLE ${order}`, stickerGroupOrder: order, stickerGroupLayout: layout });

describe("TemplateDraftEditor.patchField", () => {
  it("patches only the chosen field and normalizes it", () => {
    const fields = [field({ key: "a", label: "A" }), field({ key: "b", label: "B" })];
    const next = TemplateDraftEditor.patchField("inside", fields, 1, { label: "renamed" });
    expect(next[0]).toBe(fields[0]);
    expect(next[1].label).toBe("RENAMED");
  });

  it("makes a counter field numeric", () => {
    const next = TemplateDraftEditor.patchField("inside", [field()], 0, { isCounter: true });
    expect(next[0]).toMatchObject({ isCounter: true, type: "number" });
  });
});

describe("TemplateDraftEditor.addField", () => {
  it("appends a blank field to an inside draft and renumbers", () => {
    const next = TemplateDraftEditor.addField("inside", [field({ key: "a" })], undefined, "field")!;
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ label: "", type: "text", required: true, showOnSticker: true, stickerOrder: 1 });
  });

  it("adds a DESTINATION field once, then falls back to a generated key", () => {
    const first = TemplateDraftEditor.addField("inside", [], undefined, "destination")!;
    expect(first[0]).toMatchObject({ key: "destination", label: "DESTINATION" });
    const second = TemplateDraftEditor.addField("inside", first, undefined, "destination")!;
    expect(second[1].key).not.toBe("destination");
    expect(second[1].key.startsWith("inside_destination_")).toBe(true);
  });

  it("adds a section preset with one starting counter section", () => {
    const [added] = TemplateDraftEditor.addField("inside", [], undefined, "section")!;
    expect(added.label).toBe("SECTION");
    expect(added.segments).toEqual([expect.objectContaining({ label: "SECTION 1", isCounter: true, counterType: "lot" })]);
  });

  it("starts the first outside table at 2x2 when the draft is empty", () => {
    const [added] = TemplateDraftEditor.addField("outside", [], undefined, "field")!;
    expect(added).toMatchObject({ stickerGroup: "นอกกรอบ 1", stickerGroupOrder: 0, stickerGroupLayout: "2x2" });
  });

  it("inserts a row at the end of the requested outside table", () => {
    const fields = [tableField("a", 0), tableField("b", 0), tableField("c", 1)];
    const next = TemplateDraftEditor.addField("outside", fields, 0, "field")!;
    expect(next.map((item) => item.stickerGroupOrder)).toEqual([0, 0, 0, 1]);
    expect(next[2].label).toBe("");
    expect(next[3].key).toBe("c");
  });

  it("refuses to add a row to a vertical table", () => {
    expect(TemplateDraftEditor.addField("outside", [tableField("a", 0, "8x2")], 0, "field")).toBeUndefined();
  });
});

describe("TemplateDraftEditor.removeField / moveField", () => {
  it("removes a field and renumbers the rest", () => {
    const next = TemplateDraftEditor.removeField([field({ key: "a" }), field({ key: "b" }), field({ key: "c" })], 0);
    expect(next.map((item) => [item.key, item.stickerOrder])).toEqual([["b", 0], ["c", 1]]);
  });

  it("ignores the table order for inside drafts", () => {
    const fields = [field({ key: "a" }), field({ key: "b", stickerGroupOrder: 3, stickerGroup: "T" })];
    const next = TemplateDraftEditor.moveField("inside", fields, 0, 1, 3);
    expect(next.map((item) => item.key)).toEqual(["b", "a"]);
    expect(next[1].stickerGroup).toBeUndefined();
  });

  it("moves an outside field into the target table", () => {
    const fields = [tableField("a", 0), tableField("b", 1)];
    const next = TemplateDraftEditor.moveField("outside", fields, 0, 1, 1);
    expect(next[1]).toMatchObject({ key: "a", stickerGroupOrder: 1, stickerGroup: "TABLE 1" });
  });
});

describe("outside tables", () => {
  it("adds a table after the last one, named by its position", () => {
    const next = TemplateDraftEditor.addTable([tableField("a", 0), tableField("b", 1)], "8x2");
    expect(next).toHaveLength(3);
    expect(next[2]).toMatchObject({ stickerGroup: "นอกกรอบ 3", stickerGroupOrder: 2, stickerGroupLayout: "8x2", label: "" });
  });

  it("starts numbering at zero when there are no tables yet", () => {
    expect(TemplateDraftEditor.addTable([], "2x2")[0]).toMatchObject({ stickerGroupOrder: 0, stickerGroup: "นอกกรอบ 1" });
  });

  it("renames every row of one table", () => {
    const next = TemplateDraftEditor.renameTable([tableField("a", 0), tableField("b", 1)], 1, "NEW");
    expect(next.map((item) => item.stickerGroup)).toEqual(["TABLE 0", "NEW"]);
  });

  it("switching to a vertical layout clears font scale and keeps a single row", () => {
    const fields = [
      { ...tableField("a", 0), fontScale: "xlarge" as const },
      { ...tableField("b", 0), fontScale: "xlarge" as const },
      tableField("c", 1),
    ];
    const next = TemplateDraftEditor.changeTableLayout(fields, 0, "8x2");
    expect(next.map((item) => item.key)).toEqual(["a", "c"]);
    expect(next[0]).toMatchObject({ stickerGroupLayout: "8x2", fontScale: undefined });
  });

  it("switching back to 2x2 keeps every row and font scale", () => {
    const fields = [{ ...tableField("a", 0), fontScale: "xlarge" as const }];
    const next = TemplateDraftEditor.changeTableLayout(fields, 0, "2x2");
    expect(next[0]).toMatchObject({ stickerGroupLayout: "2x2", fontScale: "xlarge" });
  });

  it("removes a table and closes the numbering gap", () => {
    const next = TemplateDraftEditor.removeTable([tableField("a", 0), tableField("b", 1), tableField("c", 2)], 1);
    expect(next.map((item) => [item.key, item.stickerGroupOrder])).toEqual([["a", 0], ["c", 1]]);
  });

  it("reorders tables", () => {
    const next = TemplateDraftEditor.moveTable([tableField("a", 0), tableField("b", 1)], 0, 1);
    expect(next.map((item) => item.key)).toEqual(["b", "a"]);
  });
});

describe("TemplateDraftEditor.assignPreviewSlot", () => {
  const fields = [
    field({ key: "a", stickerOrder: 0, showOnSticker: true }),
    field({ key: "b", stickerOrder: 1, showOnSticker: true }),
    field({ key: "c", stickerOrder: 2, showOnSticker: false }),
  ];

  it("puts the chosen field into the slot and hides whoever held it", () => {
    const next = TemplateDraftEditor.assignPreviewSlot(fields, 1, "c");
    expect(next.map((item) => [item.key, item.showOnSticker, item.stickerOrder])).toEqual([
      ["a", true, 0],
      ["b", false, undefined],
      ["c", true, 1],
    ]);
  });

  it("targets a section with a field.section key", () => {
    const sectioned = [field({
      key: "lot",
      segments: [
        { key: "s1", label: "S1", showOnSticker: true, stickerOrder: 0 },
        { key: "s2", label: "S2", showOnSticker: false },
      ],
    })];
    const [next] = TemplateDraftEditor.assignPreviewSlot(sectioned, 0, "lot.s2");
    expect(next.segments).toEqual([
      { key: "s1", label: "S1", showOnSticker: false, stickerOrder: undefined },
      { key: "s2", label: "S2", showOnSticker: true, stickerOrder: 0 },
    ]);
  });
});
