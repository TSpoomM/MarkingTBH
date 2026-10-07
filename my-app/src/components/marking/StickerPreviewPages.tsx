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
          <div className="sticker-preview-page" key={`preview-page-${layout}-${index}`}>
            <div className="sticker-preview-page-title">หน้าที่ {index + 1} / {pages.length}</div>
            <StickerPage items={page} layout={layout} />
          </div>
        ))}
      </>
    );
  }
}
