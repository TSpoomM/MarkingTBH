import { describe, expect, it } from "vitest";
import StickerPreview from "./stickerPreview";
import type { StickerItem } from "@/src/core/models/marking-sticker";

const item = (pallet: number, groupLayout?: "8x2"): StickerItem => ({
  kind: groupLayout ? "outsideFrame" : "insideFrame",
  customerName: "Test",
  lot: 1,
  pallet,
  side: 1,
  stickerType: "TNR",
  details: [{ label: "Pallet", values: [{ value: String(pallet) }], order: 0 }],
  groupLayout,
});

describe("StickerPreview.pages", () => {
  it("fills each preview page while preserving the items available on that page", () => {
    const { pages } = StickerPreview.pages([1, 2, 3, 4, 5].map((pallet) => item(pallet)), "insideFrame");
    expect(pages.map((page) => page.map((sticker) => sticker.pallet))).toEqual([
      [1, 2, 3, 4],
      [5, 5, 5, 5],
    ]);
  });

  it("fills all sixteen slots of a vertical outside page", () => {
    const { layout, pages } = StickerPreview.pages([item(1, "8x2")], "outsideFrame");
    expect(layout).toBe("frameVertical");
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(16);
  });

  it("keeps an empty preview empty", () => {
    expect(StickerPreview.pages([], "insideFrame").pages).toEqual([]);
  });
});
