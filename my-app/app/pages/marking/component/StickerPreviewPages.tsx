"use client";

import { Component } from "react";
import type { StickerItem, StickerKind } from "@/app/types/marking-sticker";
import StickerFactory from "./StickerFactory";
import StickerPage from "./StickerPage";

interface StickerPreviewPagesProps {
  items: StickerItem[];
  mode: StickerKind;
}

export default class StickerPreviewPages extends Component<StickerPreviewPagesProps> {
  private isVerticalOutside() {
    const { mode, items } = this.props;
    return mode === "outsideFrame" && StickerFactory.isVerticalGroupLayout(items[0]?.groupLayout);
  }

  private layout() {
    const { mode } = this.props;
    if (mode === "customerName") return "customerName" as const;
    if (mode === "fscLogo") return "fsc" as const;
    if (this.isVerticalOutside()) return "frameVertical" as const;
    return "frame" as const;
  }

  private pageSize() {
    if (this.props.mode === "customerName") return 16;
    if (this.isVerticalOutside()) return 16;
    return 4;
  }

  render() {
    const pages = StickerFactory.chunk(this.props.items, this.pageSize());
    const layout = this.layout();

    return (
      <>
        {pages.map((page, index) => (
          <StickerPage items={page} layout={layout} key={`preview-page-${layout}-${index}`} />
        ))}
      </>
    );
  }
}
