"use client";

import { Component, createRef, type CSSProperties } from "react";
import AutoFitStickerRow from "./AutoFitStickerRow";
import type { StickerItem } from "@/app/types/marking-sticker";

// Layer A: shrinks the whole card (font + gap) only as far as needed to stop the
// row COUNT from overflowing the card vertically. It never touches per-row width fit.
export default class AutoFitStickerDetails extends Component<{ details: StickerItem["details"] }, { scale: number }> {
  private readonly minScale = 0.15;
  private readonly ref = createRef<HTMLDListElement>();
  private resizeObserver: ResizeObserver | undefined;

  state = { scale: 1 };

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

  componentDidUpdate(previousProps: { details: StickerItem["details"] }) {
    if (previousProps.details !== this.props.details) this.fit();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.fitNow);
    this.resizeObserver?.disconnect();
  }

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;
    element.style.setProperty("--sticker-fit-scale", "1");
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
    const nextScale = Math.max(this.minScale, Math.min(1, heightRatio));
    element.style.setProperty("--sticker-fit-scale", `${nextScale}`);
    if (Math.abs(nextScale - this.state.scale) > 0.01) this.setState({ scale: nextScale });
  };

  private fit = () => window.requestAnimationFrame(this.fitNow);

  render() {
    const { details } = this.props;
    return (
      <dl
        className="sticker-details"
        ref={this.ref}
        style={{ "--sticker-fit-scale": this.state.scale } as CSSProperties}
      >
        {details.map((detail, index) => (
          <AutoFitStickerRow
            detail={detail}
            cardScale={this.state.scale}
            key={`${detail.label}-${detail.values.map((value) => value.value).join("-")}-${index}`}
          />
        ))}
      </dl>
    );
  }
}
