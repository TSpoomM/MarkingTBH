"use client";

import { Component, createRef, type CSSProperties } from "react";
import { XLARGE_FONT_PX } from "@/src/core/stickers/stickerLabelMetrics";
import type { StickerItem } from "@/src/core/models/marking-sticker";

type Props = {
  detail: StickerItem["details"][number];
  cardScale: number;
  maxFontSize?: number;
  rowId: string;
  /** Size every row in this row's scale group has agreed to use. Undefined while still measuring. */
  sharedFontSize?: number;
  /** Reports the font size this row would need on its own, so the group can settle on the smallest one. */
  onMeasured: (rowId: string, group: string, fontSize: number) => void;
};

// Layer B: rows in the same fontScale group render at one shared size — the smallest
// size any row in the group needs to keep its text on one line. Measurement happens in
// two passes: each row first measures its own natural fit and reports it up (Details
// takes the minimum per group), then rows re-render at that agreed size.
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
    this.fit();
    window.addEventListener("beforeprint", this.fitNow);
    if (typeof ResizeObserver !== "undefined" && this.ref.current) {
      this.resizeObserver = new ResizeObserver(() => this.fit());
      this.resizeObserver.observe(this.ref.current);
      if (this.ref.current.parentElement) {
        this.resizeObserver.observe(this.ref.current.parentElement);
      }
    }
  }

  componentDidUpdate(previousProps: Props) {
    if (
      previousProps.detail !== this.props.detail ||
      previousProps.cardScale !== this.props.cardScale ||
      previousProps.maxFontSize !== this.props.maxFontSize ||
      previousProps.sharedFontSize !== this.props.sharedFontSize
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

    if (this.props.sharedFontSize !== undefined) {
      const fontSize = this.props.sharedFontSize;
      element.style.fontSize = `${fontSize}px`;
      if (Math.abs(fontSize - this.state.fontSize) > 0.5) this.setState({ fontSize });
      return;
    }

    const isXlarge = this.group() === "xlarge";
    const inheritedFontSize = Number.parseFloat(getComputedStyle(element).getPropertyValue("--sticker-font"));
    const ceiling = isXlarge ? XLARGE_FONT_PX : (Number.isFinite(inheritedFontSize) ? inheritedFontSize : this.defaultFontSize);
    const baseCeiling = ceiling * this.props.cardScale;
    const maxFontSize = this.props.maxFontSize ?? Number.POSITIVE_INFINITY;

    let fontSize = Math.min(baseCeiling, maxFontSize);
    element.style.fontSize = `${fontSize}px`;
    let availableWidth = element.clientWidth;
    let requiredWidth = element.scrollWidth;
    if (availableWidth > 0 && requiredWidth > availableWidth) {
      fontSize = Math.max(this.minFontSize, fontSize * (availableWidth / requiredWidth));
      element.style.fontSize = `${fontSize}px`;
      for (let pass = 0; pass < this.maxVerifyPasses; pass += 1) {
        availableWidth = element.clientWidth;
        requiredWidth = element.scrollWidth;
        if (requiredWidth <= availableWidth || fontSize <= this.minFontSize) break;
        fontSize = Math.max(this.minFontSize, fontSize - 1);
        element.style.fontSize = `${fontSize}px`;
      }
    }

    if (Math.abs(fontSize - this.state.fontSize) > 0.5) this.setState({ fontSize });
    this.props.onMeasured(this.props.rowId, this.group(), fontSize);
  };

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
