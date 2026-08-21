"use client";

import { Component, createRef, type CSSProperties } from "react";
import { FONT_SCALE_MULTIPLIERS } from "@/app/types/constants";
import type { StickerItem } from "@/app/types/marking-sticker";

// Layer B: each row independently shrinks its OWN font size until its text fits on
// one line. Text is never wrapped and never clipped — a verify loop keeps nudging the
// size down (past any single-pass rounding error) until scrollWidth truly fits.
export default class AutoFitStickerRow extends Component<
  { detail: StickerItem["details"][number]; cardScale: number; maxFontSize?: number },
  { fontSize: number }
> {
  private readonly defaultFontSize = 35;
  private readonly minFontSize = 5;
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

  componentDidUpdate(previousProps: { detail: StickerItem["details"][number]; cardScale: number; maxFontSize?: number }) {
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

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;
    const inheritedFontSize = Number.parseFloat(getComputedStyle(element).getPropertyValue("--sticker-font"));
    const rowScale = FONT_SCALE_MULTIPLIERS[this.props.detail.fontScale ?? "normal"] ?? 1;
    const baseFontSize = (Number.isFinite(inheritedFontSize) ? inheritedFontSize : this.defaultFontSize)
      * this.props.cardScale * rowScale;
    const maxFontSize = this.props.maxFontSize ?? Number.POSITIVE_INFINITY;

    let fontSize = Math.min(baseFontSize, maxFontSize);
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
