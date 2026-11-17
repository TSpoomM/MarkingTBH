"use client";

import { Component, createRef, type CSSProperties } from "react";
import { XLARGE_FONT_PX } from "@/src/core/stickers/stickerLabelMetrics";
import type { StickerItem } from "@/src/core/models/marking-sticker";

type Props = {
  detail: StickerItem["details"][number];
  cardScale: number;
  maxFontSize?: number;
};

// Each row keeps the largest font size that fits its own text on one line.
//
// A "xlarge" row (the "ขนาดใหญ่พิเศษ" field toggle) ignores the card's normal autofit
// size entirely and starts from its own fixed, larger ceiling instead.
export default class AutoFitStickerRow extends Component<Props, { fontSize: number }> {
  private readonly defaultFontSize = 35;
  private readonly minFontSize = 1;
  private readonly maxVerifyPasses = 35;
  private readonly ref = createRef<HTMLDivElement>();
  private resizeObserver: ResizeObserver | undefined;

  state = { fontSize: this.defaultFontSize };

  componentDidMount() {
    this.fitNow();
    window.addEventListener("beforeprint", this.fitNow);
    if (typeof ResizeObserver !== "undefined" && this.ref.current?.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.fit());
      this.resizeObserver.observe(this.ref.current.parentElement);
    }
  }

  componentDidUpdate(previousProps: Props) {
    if (
      previousProps.detail !== this.props.detail ||
      previousProps.cardScale !== this.props.cardScale ||
      previousProps.maxFontSize !== this.props.maxFontSize
    ) {
      this.fit();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.fitNow);
    this.resizeObserver?.disconnect();
  }

  private group() {
    return this.props.detail.fontScale ?? "normal";
  }

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;

    const isXlarge = this.group() === "xlarge";
    const inheritedFontSize = Number.parseFloat(getComputedStyle(element).getPropertyValue("--sticker-font"));
    const ceiling = isXlarge ? XLARGE_FONT_PX : (Number.isFinite(inheritedFontSize) ? inheritedFontSize : this.defaultFontSize);
    const baseCeiling = ceiling * this.props.cardScale;
    const maxFontSize = this.props.maxFontSize ?? Number.POSITIVE_INFINITY;

    let fontSize = Math.max(this.minFontSize, Math.min(baseCeiling, maxFontSize));
    const fits = (size: number) => {
      element.style.fontSize = `${size}px`;
      // The row's own clientWidth grows with its text (the label column is min-content),
      // so the sticker cell's content box is the real width limit.
      const availableWidth = Math.min(element.clientWidth, this.cellContentWidth(element));
      return availableWidth <= 0 || element.scrollWidth <= availableWidth;
    };

    if (!fits(fontSize)) {
      // Binary search for the largest font that fits; fixed 1px steps could stop before the text fit.
      let low = this.minFontSize;
      let high = fontSize;
      for (let pass = 0; pass < this.maxVerifyPasses && high - low > 0.25; pass += 1) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
      fontSize = low;
      element.style.fontSize = `${fontSize}px`;
    }

    if (Math.abs(fontSize - this.state.fontSize) > 0.25) this.setState({ fontSize });
  };

  private cellContentWidth(element: HTMLElement) {
    const cell = element.closest<HTMLElement>(".sticker-label");
    if (!cell) return Number.POSITIVE_INFINITY;
    const style = getComputedStyle(cell);
    const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
    return Math.max(0, cell.clientWidth - padding);
  }

  private fit = () => window.requestAnimationFrame(this.fitNow);

  render() {
    const { detail } = this.props;
    return (
      <div
        className={`sticker-detail-row${detail.hideLabel ? " sticker-detail-row-no-label" : ""}`}
        ref={this.ref}
        style={{ "--sticker-row-font": `${this.state.fontSize}px` } as CSSProperties}
      >
        {!detail.hideLabel && <dt>{detail.label}</dt>}
        {!detail.hideLabel && <dd className="sticker-detail-colon">:</dd>}
        <dd className="sticker-detail-values">
          {detail.values.map((value, valueIndex) => (
            <span key={`${value.label ?? "value"}-${value.value}-${valueIndex}`}>
              {value.value}
            </span>
          ))}
        </dd>
      </div>
    );
  }
}
