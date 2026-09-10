"use client";

import { Component, createRef, type CSSProperties } from "react";
import AutoFitStickerRow from "./AutoFitStickerRow";
import type { StickerItem } from "@/src/core/models/marking-sticker";

// Layer A: squeezes row gaps first so the card can keep the largest readable font.
// Font scale is reduced only when the measured height still overflows the card.
//
// Layer B (rows) settles in two passes: each row first measures the size it would need
// on its own and reports it here; once every row has reported, the smallest size per
// fontScale group is picked and handed back down so same-scale rows render at one
// consistent size instead of each shrinking independently.
export default class AutoFitStickerDetails extends Component<
  { details: StickerItem["details"]; maxRowFontSize?: number },
  { fontScale: number; gapScale: number; sharedRowFontSizes: Record<string, number> }
> {
  private readonly comfortableRowCount = 5;
  private readonly maxRowCount = 10;
  private readonly minGapScale = 0.15;
  private readonly minFontSize = 1;
  private readonly ref = createRef<HTMLDListElement>();
  private resizeObserver: ResizeObserver | undefined;
  private rowMeasurements = new Map<string, { group: string; fontSize: number }>();

  state = { fontScale: 1, gapScale: this.getGapScale(this.props.details), sharedRowFontSizes: {} as Record<string, number> };

  componentDidMount() {
    this.fit();
    window.addEventListener("beforeprint", this.handleBeforePrint);
    if (typeof ResizeObserver !== "undefined" && this.ref.current) {
      this.resizeObserver = new ResizeObserver(() => this.fit());
      this.resizeObserver.observe(this.ref.current);
      if (this.ref.current.parentElement) {
        this.resizeObserver.observe(this.ref.current.parentElement);
      }
    }
  }

  componentDidUpdate(previousProps: { details: StickerItem["details"]; maxRowFontSize?: number }) {
    if (
      previousProps.details !== this.props.details ||
      previousProps.maxRowFontSize !== this.props.maxRowFontSize
    ) {
      this.resetRowMeasurements();
      this.fit();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.handleBeforePrint);
    this.resizeObserver?.disconnect();
  }

  private handleBeforePrint = () => {
    this.resetRowMeasurements();
    this.fitNow();
  };

  private resetRowMeasurements() {
    this.rowMeasurements.clear();
    if (Object.keys(this.state.sharedRowFontSizes).length > 0) {
      this.setState({ sharedRowFontSizes: {} });
    }
  }

  private handleRowMeasured = (rowId: string, group: string, fontSize: number) => {
    this.rowMeasurements.set(rowId, { group, fontSize });
    if (this.rowMeasurements.size < this.props.details.length) return;

    const minByGroup: Record<string, number> = {};
    for (const measurement of this.rowMeasurements.values()) {
      minByGroup[measurement.group] = minByGroup[measurement.group] !== undefined
        ? Math.min(minByGroup[measurement.group], measurement.fontSize)
        : measurement.fontSize;
    }
    this.setState({ sharedRowFontSizes: minByGroup });
  };

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;
    const gapScale = this.getGapScale(this.props.details);
    element.style.setProperty("--sticker-fit-scale", `${gapScale}`);
    const parent = element.parentElement;
    const parentStyle = parent ? getComputedStyle(parent) : undefined;
    const verticalPadding = parentStyle
      ? Number.parseFloat(parentStyle.paddingTop) + Number.parseFloat(parentStyle.paddingBottom)
      : 0;
    const availableHeight = parent
      ? Math.max(0, parent.clientHeight - verticalPadding)
      : element.clientHeight;
    const requiredHeight = element.scrollHeight;
    const heightRatio = availableHeight > 0 && requiredHeight > availableHeight
      ? availableHeight / requiredHeight
      : 1;
    const nextFontScale = heightRatio < 1
      ? Math.max(this.getMinimumFontScale(), Math.min(1, this.state.fontScale * heightRatio))
      : 1;
    if (
      Math.abs(nextFontScale - this.state.fontScale) > 0.01 ||
      Math.abs(gapScale - this.state.gapScale) > 0.01
    ) {
      if (Math.abs(nextFontScale - this.state.fontScale) > 0.01) this.resetRowMeasurements();
      this.setState({ fontScale: nextFontScale, gapScale });
    }
  };

  private fit = () => window.requestAnimationFrame(this.fitNow);

  private getGapScale(details: StickerItem["details"]) {
    const visibleRowCount = Math.max(1, details.length);
    if (visibleRowCount <= this.comfortableRowCount) return 1;

    const pressure = Math.min(
      1,
      (visibleRowCount - this.comfortableRowCount) / (this.maxRowCount - this.comfortableRowCount),
    );
    return 1 - (1 - this.minGapScale) * pressure;
  }

  private getMinimumFontScale() {
    const maxRowFontSize = this.props.maxRowFontSize ?? Number.POSITIVE_INFINITY;
    const fontSize = Number.isFinite(maxRowFontSize) ? maxRowFontSize : 35;
    return this.minFontSize / fontSize;
  }

  render() {
    const { details, maxRowFontSize } = this.props;
    return (
      <dl
        className="sticker-details"
        ref={this.ref}
        style={{ "--sticker-fit-scale": this.state.gapScale } as CSSProperties}
      >
        {details.map((detail, index) => {
          const rowId = `${detail.label}-${detail.values.map((value) => value.value).join("-")}-${index}`;
          return (
            <AutoFitStickerRow
              detail={detail}
              cardScale={this.state.fontScale}
              maxFontSize={maxRowFontSize}
              rowId={rowId}
              sharedFontSize={this.state.sharedRowFontSizes[detail.fontScale ?? "normal"]}
              onMeasured={this.handleRowMeasured}
              key={rowId}
            />
          );
        })}
      </dl>
    );
  }
}
