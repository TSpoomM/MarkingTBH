"use client";

import { Component } from "react";
import StickerPreview from "@/src/core/stickers/stickerPreview";
import StickerPage from "./StickerPage";
import type { StickerItem, StickerKind } from "@/src/core/models/marking-sticker";

interface StickerPreviewPagesProps {
  items: StickerItem[];
  mode: StickerKind;
}

export default class StickerPreviewPages extends Component<StickerPreviewPagesProps> {
  render() {
    const { layout, pages } = StickerPreview.pages(this.props.items, this.props.mode);

    return (
      <>
        {pages.map((page, index) => (
          <StickerPage items={page} layout={layout} key={`preview-page-${layout}-${index}`} />
        ))}
      </>
    );
  }
}
