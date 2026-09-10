"use client";

import { Component, createRef, type CSSProperties } from "react";
import { FONT_SCALE_MULTIPLIERS } from "@/src/core/models/constants";
import type { StickerItem } from "@/src/core/models/marking-sticker";

type Props = {
  detail: StickerItem["details"][number];
  cardScale: number;
  maxFontSize?: number;
  rowId: string;
  /** Base (pre-fontScale) size every row in this row's scale group has agreed to use. Undefined while still measuring. */
  sharedBaseFontSize?: number;
  /** Reports the base font size this row would need on its own, so the group can settle on the smallest one. */
  onMeasured: (rowId: string, group: string, baseFontSize: number) => void;
};

// Layer B: rows in the same fontScale group render at one shared size — the smallest
// size any row in the group needs to keep its text on one line. Measurement happens in
// two passes: each row first measures its own natural fit and reports it up (Details
// takes the minimum per group), then rows re-render at that agreed size.
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
      previousProps.sharedBaseFontSize !== this.props.sharedBaseFontSize
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

  private rowScale() {
    return FONT_SCALE_MULTIPLIERS[this.group()] ?? 1;
  }

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;
    const rowScale = this.rowScale();

    if (this.props.sharedBaseFontSize !== undefined) {
      const fontSize = this.props.sharedBaseFontSize * rowScale;
      element.style.fontSize = `${fontSize}px`;
      if (Math.abs(fontSize - this.state.fontSize) > 0.5) this.setState({ fontSize });
      return;
    }

    const inheritedFontSize = Number.parseFloat(getComputedStyle(element).getPropertyValue("--sticker-font"));
    const baseCeiling = (Number.isFinite(inheritedFontSize) ? inheritedFontSize : this.defaultFontSize) * this.props.cardScale;
    const maxFontSize = this.props.maxFontSize ?? Number.POSITIVE_INFINITY;

    let baseFontSize = Math.min(baseCeiling, maxFontSize / rowScale);
    element.style.fontSize = `${baseFontSize * rowScale}px`;
    let availableWidth = element.clientWidth;
    let requiredWidth = element.scrollWidth;
    if (availableWidth > 0 && requiredWidth > availableWidth) {
      baseFontSize = Math.max(this.minFontSize, baseFontSize * (availableWidth / requiredWidth));
      element.style.fontSize = `${baseFontSize * rowScale}px`;
      for (let pass = 0; pass < this.maxVerifyPasses; pass += 1) {
        availableWidth = element.clientWidth;
        requiredWidth = element.scrollWidth;
        if (requiredWidth <= availableWidth || baseFontSize <= this.minFontSize) break;
        baseFontSize = Math.max(this.minFontSize, baseFontSize - 1);
        element.style.fontSize = `${baseFontSize * rowScale}px`;
      }
    }

    const fontSize = baseFontSize * rowScale;
    if (Math.abs(fontSize - this.state.fontSize) > 0.5) this.setState({ fontSize });
    this.props.onMeasured(this.props.rowId, this.group(), baseFontSize);
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
