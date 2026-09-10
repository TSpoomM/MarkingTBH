/**
 * Development-only dump of the font/size variables the print sheet resolved to.
 * Lives outside the controller so state logic stays free of DOM inspection.
 */
export default class StickerDebugReporter {
  private static get enabled() {
    return process.env.NODE_ENV !== "production";
  }

  static log(label: string, payload: unknown) {
    if (!this.enabled) return;
    console.debug(`[Marking] ${label}`, payload);
  }

  static logFontMetrics(label: string) {
    if (!this.enabled || typeof document === "undefined") return;
    const stickers = Array.from(document.querySelectorAll<HTMLElement>(".print-sheet .sticker-label"));
    if (!stickers.length) {
      console.debug(`[Marking] ${label}: no print-sheet stickers found`);
      return;
    }

    const outsideStickers = stickers.filter((sticker) => sticker.classList.contains("outsideFrame"));
    const otherStickers = stickers.filter((sticker) => !sticker.classList.contains("outsideFrame"));
    const sampledStickers = [...outsideStickers.slice(0, 8), ...otherStickers.slice(0, 8 - Math.min(8, outsideStickers.length))];

    console.groupCollapsed(`[Marking] ${label}: sticker font metrics`);
    console.table(sampledStickers.map((sticker, index) => {
      const style = getComputedStyle(sticker);
      const details = sticker.querySelector<HTMLElement>(".sticker-details");
      const detailsStyle = details ? getComputedStyle(details) : null;
      return {
        index,
        kind: Array.from(sticker.classList).filter((className) => className !== "sticker-label").join(" "),
        stickerFontVar: style.getPropertyValue("--sticker-font").trim(),
        stickerLabelFontVar: style.getPropertyValue("--sticker-label-font").trim(),
        stickerGapVar: style.getPropertyValue("--sticker-gap").trim(),
        stickerLabelColumnVar: style.getPropertyValue("--sticker-label-column").trim(),
        fitScale: detailsStyle?.getPropertyValue("--sticker-fit-scale").trim() || "",
        computedFontSize: style.fontSize,
        detailsFontSize: detailsStyle?.fontSize || "",
        padding: style.padding,
        width: `${Math.round(sticker.getBoundingClientRect().width)}px`,
        height: `${Math.round(sticker.getBoundingClientRect().height)}px`,
      };
    }));

    console.table(sampledStickers.slice(0, 3).flatMap((sticker, stickerIndex) =>
      Array.from(sticker.querySelectorAll<HTMLElement>(".sticker-detail-row")).map((row, rowIndex) => {
        const style = getComputedStyle(row);
        return {
          stickerIndex,
          rowIndex,
          label: row.querySelector("dt")?.textContent?.trim() ?? "",
          rowFontVar: style.getPropertyValue("--sticker-row-font").trim(),
          computedFontSize: style.fontSize,
          width: `${Math.round(row.getBoundingClientRect().width)}px`,
          scrollWidth: `${row.scrollWidth}px`,
        };
      }),
    ));
    console.groupEnd();
  }
}
