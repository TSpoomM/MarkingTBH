"use client";

import { Component, type CSSProperties } from "react";
import Image from "next/image";
import AutoFitStickerDetails from "./AutoFitStickerDetails";
import type { StickerItem } from "@/app/types/marking-sticker";

export default class StickerLabel extends Component<{ item: StickerItem }> {
  private style(): CSSProperties {
    const { item } = this.props;
    if (item.kind === "customerName") return {};

    const countPressure = item.kind === "outsideFrame" ? 0 : Math.max(0, item.details.length - 5) * 1.1;
    const fontSize = Math.max(22, 35 - countPressure);
    const gap = Math.max(1.4, Math.min(4.5, fontSize / 6));
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
    return (
      <article className={`sticker-label ${item.kind}`} style={this.style()}>
        {item.kind === "customerName" ? (
          <p>{item.customerName}</p>
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
          <AutoFitStickerDetails details={item.details} />
        )}
      </article>
    );
  }
}
