"use client";

import { Component } from "react";
import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import type { StickerItem, StickerKind } from "@/app/types/marking-sticker";
import StickerFactory from "./StickerFactory";
import StickerPreviewPages from "./StickerPreviewPages";

const PREVIEW_MODE_LABELS: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Customer",
  fscLogo: "โลโก้ FSC",
};

const PREVIEW_MODE_ORDER: StickerKind[] = ["insideFrame", "outsideFrame", "customerName", "fscLogo"];

interface StickerPreviewButtonProps {
  items: StickerItem[];
  className?: string;
}

interface StickerPreviewButtonState {
  previewOpen: boolean;
  previewMode: StickerKind;
  previewGroup: string | null;
}

export default class StickerPreviewButton extends Component<StickerPreviewButtonProps, StickerPreviewButtonState> {
  state: StickerPreviewButtonState = {
    previewOpen: false,
    previewMode: "insideFrame",
    previewGroup: null,
  };

  private previewModes() {
    const kinds = new Set(this.props.items.map((item) => item.kind));
    return PREVIEW_MODE_ORDER.filter((kind) => kinds.has(kind));
  }

  private firstPreviewMode() {
    return this.previewModes()[0] ?? "insideFrame";
  }

  private outsideGroups(items: StickerItem[]) {
    const groups: string[] = [];
    items.forEach((item) => {
      const name = item.group ?? "";
      if (!name || groups.includes(name)) return;
      groups.push(name);
    });
    return groups;
  }

  render() {
    const { items, className = "" } = this.props;
    const { previewOpen, previewMode, previewGroup } = this.state;
    const previewModes = this.previewModes();
    const activeMode = previewModes.includes(previewMode) ? previewMode : this.firstPreviewMode();
    const modePreviewItems = items.filter((item) => item.kind === activeMode);
    const outsideGroups = activeMode === "outsideFrame" ? this.outsideGroups(modePreviewItems) : [];
    const activeGroup = outsideGroups.includes(previewGroup ?? "") ? previewGroup : (outsideGroups[0] ?? null);
    const activePreviewItems = activeGroup
      ? modePreviewItems.filter((item) => item.group === activeGroup)
      : modePreviewItems;

    return (
      // <div className="sticker-preview-wrap">
      <div>
        <Button
          className={`sticker-preview-open marking-preview-open ${className}`.trim()}
          disabled={items.length === 0}
          onClick={() => this.setState({ previewOpen: true, previewMode: this.firstPreviewMode(), previewGroup: null })}
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
                    onClick={() => this.setState({ previewMode: mode, previewGroup: null })}
                    key={mode}
                  >
                    {PREVIEW_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
            {outsideGroups.length > 1 && (
              <div className="sticker-template-preview-modes sticker-template-preview-groups" aria-label="เลือกนอกกรอบ">
                {outsideGroups.map((group) => (
                  <button
                    type="button"
                    className={group === activeGroup ? "active" : ""}
                    onClick={() => this.setState({ previewGroup: group })}
                    key={group}
                  >
                    {StickerFactory.outsideGroupTitle(group)}
                  </button>
                ))}
              </div>
            )}
            <div className="container pdf-preview sticker-template-real-preview">
              <StickerPreviewPages items={activePreviewItems} mode={activeMode} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
