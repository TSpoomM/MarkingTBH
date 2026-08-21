"use client";

import { Component, type CSSProperties } from "react";
import Image from "next/image";
import AutoFitStickerDetails from "./AutoFitStickerDetails";
import AutoFitStickerText from "./AutoFitStickerText";
import type { StickerItem } from "@/app/types/marking-sticker";

const VERTICAL_OUTSIDE_MAX_FONT_PT = 50;
const VERTICAL_OUTSIDE_MAX_FONT_PX = VERTICAL_OUTSIDE_MAX_FONT_PT * (96 / 72);

export default class StickerLabel extends Component<{ item: StickerItem }> {
  private isVerticalOutside() {
    const { item } = this.props;
    return item.kind === "outsideFrame" &&
      (item.groupLayout === "8x2" || item.groupLayout === "4x2");
  }

  private style(): CSSProperties {
    const { item } = this.props;
    if (item.kind === "customerName") return {};

    const isVerticalOutside = this.isVerticalOutside();
    const countPressure = item.kind === "outsideFrame" ? 0 : Math.max(0, item.details.length - 5) * 1.1;
    // 8x2 rows are forced to a single merged line (see StickerFactory.mergeDetailsToSingleRow),
    // so there's no row count to shrink for — width-based fit in AutoFitStickerRow handles the rest.
    const fontSize = isVerticalOutside
      ? VERTICAL_OUTSIDE_MAX_FONT_PX
      : Math.max(22, 35 - countPressure);
    const gap = isVerticalOutside ? 0.8 : Math.max(1.4, Math.min(4.5, fontSize / 6));
    const longestLabelLength = Math.max(
      ...item.details.filter((detail) => !detail.hideLabel).map((detail) => detail.label.length),
      0,
    );
    const labelColumnMm = Math.min(46, Math.max(28, longestLabelLength * 3.2));

    return {
      "--sticker-font": `${fontSize}px`,
      "--sticker-label-font": `${fontSize}px`,
      "--sticker-gap": `${gap}mm`,
      "--sticker-label-column": `${labelColumnMm}mm`,
    } as CSSProperties;
  }

  render() {
    const { item } = this.props;
    const isVerticalOutside = this.isVerticalOutside();
    return (
      <article className={`sticker-label ${item.kind}`} style={this.style()}>
        {item.kind === "customerName" ? (
          <AutoFitStickerText text={item.customerName} />
        ) : item.kind === "fscLogo" ? (
          Array.from({ length: item.logoCount ?? 1 }, (_, index) => (
            <Image
              className="sticker-fsc-logo"
              src="/FSC_Logo.png"
              alt="โลโก้ FSC"
              width={200}
              height={300}
              unoptimized
              priority
              key={index}
            />
          ))
        ) : (
          <AutoFitStickerDetails
            details={item.details}
            maxRowFontSize={isVerticalOutside ? VERTICAL_OUTSIDE_MAX_FONT_PX : undefined}
          />
        )}
      </article>
    );
  }
}
