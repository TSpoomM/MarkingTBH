import StickerFactory from "./stickerFactory";
import type { StickerItem } from "@/src/core/models/marking-sticker";

const PT_TO_PX = 96 / 72;

/** 8x2 cells are printed sideways and get the largest font the cell allows. */
export const VERTICAL_OUTSIDE_MAX_FONT_PX = 50 * PT_TO_PX;

const COMFORTABLE_ROW_COUNT = 5;
const FONT = { max: 35, min: 22, pressurePerRow: 1.1 };
const GAP_MM = { min: 1.4, max: 4.5, fontDivisor: 6 };
const LABEL_COLUMN_MM = { min: 28, max: 46, perCharacter: 3.2 };

/**
 * The CSS custom properties one sticker is rendered with.
 * StickerLabel used to compute these inline; the numbers are pure geometry.
 */
export default class StickerLabelMetrics {
  static isVerticalOutside(item: StickerItem) {
    return item.kind === "outsideFrame" && StickerFactory.isVerticalGroupLayout(item.groupLayout);
  }

  /** Font size the sticker starts at, before AutoFit shrinks it to fit. */
  static maxRowFontSize(item: StickerItem) {
    return this.isVerticalOutside(item) ? VERTICAL_OUTSIDE_MAX_FONT_PX : undefined;
  }

  private static fontSize(item: StickerItem) {
    if (this.isVerticalOutside(item)) return VERTICAL_OUTSIDE_MAX_FONT_PX;
    // Outside stickers hold few rows, so only inside stickers shrink by row count.
    const rowPressure = item.kind === "outsideFrame"
      ? 0
      : Math.max(0, item.details.length - COMFORTABLE_ROW_COUNT) * FONT.pressurePerRow;
    return Math.max(FONT.min, FONT.max - rowPressure);
  }

  private static gapMm(item: StickerItem, fontSize: number) {
    if (this.isVerticalOutside(item)) return 0.8;
    return Math.max(GAP_MM.min, Math.min(GAP_MM.max, fontSize / GAP_MM.fontDivisor));
  }

  /** The label column is sized to the longest visible label. */
  private static labelColumnMm(item: StickerItem) {
    const longestLabelLength = Math.max(
      ...item.details.filter((detail) => !detail.hideLabel).map((detail) => detail.label.length),
      0,
    );
    return Math.min(
      LABEL_COLUMN_MM.max,
      Math.max(LABEL_COLUMN_MM.min, longestLabelLength * LABEL_COLUMN_MM.perCharacter),
    );
  }

  static cssVariables(item: StickerItem): Record<string, string> {
    if (item.kind === "customerName") return {};
    const fontSize = this.fontSize(item);
    return {
      "--sticker-font": `${fontSize}px`,
      "--sticker-label-font": `${fontSize}px`,
      "--sticker-gap": `${this.gapMm(item, fontSize)}mm`,
      "--sticker-label-column": `${this.labelColumnMm(item)}mm`,
    };
  }
}
