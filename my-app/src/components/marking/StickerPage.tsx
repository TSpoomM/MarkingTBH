"use client";

import { Component } from "react";
import StickerLabel from "./StickerLabel";
import { STICKER_PAGE_CLASS, type StickerPageLayout } from "@/src/core/models/constants";
import type { StickerItem } from "@/src/core/models/marking-sticker";

export default class StickerPage extends Component<{ items: StickerItem[]; layout: StickerPageLayout }> {
  render() {
    const { items, layout } = this.props;
    return (
      <section className={`sticker-page ${STICKER_PAGE_CLASS[layout]}`}>
        {items.map((item, index) => (
          <StickerLabel item={item} key={`${item.kind}-${item.lot}-${item.pallet}-${item.side}-${index}`} />
        ))}
      </section>
    );
  }
}
