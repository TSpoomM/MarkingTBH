"use client";

import { Component, type CSSProperties } from "react";
import Image from "next/image";
import AutoFitStickerDetails from "./AutoFitStickerDetails";
import AutoFitStickerText from "./AutoFitStickerText";
import StickerLabelMetrics from "@/src/core/stickers/stickerLabelMetrics";
import type { StickerItem } from "@/src/core/models/marking-sticker";

export default class StickerLabel extends Component<{ item: StickerItem }> {
  render() {
    const { item } = this.props;
    return (
      <article className={`sticker-label ${item.kind}`} style={StickerLabelMetrics.cssVariables(item) as CSSProperties}>
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
            maxRowFontSize={StickerLabelMetrics.maxRowFontSize(item)}
          />
        )}
      </article>
    );
  }
}
