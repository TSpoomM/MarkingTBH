"use client";

import { Component } from "react";
import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import type { StickerItem, StickerKind } from "@/app/types/marking-sticker";
import StickerLabel from "./StickerLabel";

const PREVIEW_MODE_LABELS: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Customer",
  fscLogo: "โลโก้ FSC",
};

const PREVIEW_MODE_ORDER: StickerKind[] = ["insideFrame", "outsideFrame", "customerName", "fscLogo"];

interface StickerPreviewButtonProps {
  items: StickerItem[];
}

interface StickerPreviewButtonState {
  previewOpen: boolean;
  previewMode: StickerKind;
}

export default class StickerPreviewButton extends Component<StickerPreviewButtonProps, StickerPreviewButtonState> {
  state: StickerPreviewButtonState = {
    previewOpen: false,
    previewMode: "insideFrame",
  };

  private previewModes() {
    const kinds = new Set(this.props.items.map((item) => item.kind));
    return PREVIEW_MODE_ORDER.filter((kind) => kinds.has(kind));
  }

  private firstPreviewMode() {
    return this.previewModes()[0] ?? "insideFrame";
  }

  render() {
    const { items } = this.props;
    const { previewOpen, previewMode } = this.state;
    const previewModes = this.previewModes();
    const activeMode = previewModes.includes(previewMode) ? previewMode : this.firstPreviewMode();
    const activePreviewItems = items.filter((item) => item.kind === activeMode);

    return (
      <div className="sticker-preview-wrap">
        <Button
          className="sticker-preview-open marking-preview-open"
          disabled={items.length === 0}
          onClick={() => this.setState({ previewOpen: true, previewMode: this.firstPreviewMode() })}
          title={items.length === 0 ? "ยังไม่มีข้อมูลสำหรับ Preview Sticker" : "ดู Preview Sticker"}
        >
          ดู Preview Sticker
        </Button>
        <Modal
          open={previewOpen}
          title="Preview Sticker"
          subtitle="ตัวอย่างจากข้อมูลที่กรอกในหน้าหลัก"
          onClose={() => this.setState({ previewOpen: false })}
        >
          <div className="editor-body sticker-template-preview-modal-body">
            {previewModes.length > 1 && (
              <div className="sticker-template-preview-modes" aria-label="เลือกโหมด Preview">
                {previewModes.map((mode) => (
                  <button
                    type="button"
                    className={mode === activeMode ? "active" : ""}
                    onClick={() => this.setState({ previewMode: mode })}
                    key={mode}
                  >
                    {PREVIEW_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
            <div className="container pdf-preview sticker-template-real-preview">
              {activePreviewItems.map((item, index) => (
                <StickerLabel item={item} key={`marking-preview-${item.kind}-${index}`} />
              ))}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
