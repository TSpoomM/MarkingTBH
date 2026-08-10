"use client";

import { Component } from "react";
import StickerLabel from "./StickerLabel";
import { STICKER_PAGE_CLASS } from "@/app/types/constants";
import type { StickerItem } from "@/app/types/marking-sticker";

export default class StickerPage extends Component<{ items: StickerItem[]; layout: "frame" | "customerName" | "fsc" }> {
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
