"use client";

import { Component } from "react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import type { StickerItem, StickerKind } from "@/src/core/models/marking-sticker";
import StickerPreviewPages from "./StickerPreviewPages";

const PREVIEW_MODE_LABELS: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Template",
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

  private outsideGroups(items: StickerItem[]) {
    const groups: Array<{ key: string; name: string; items: StickerItem[] }> = [];
    items.forEach((item) => {
      const name = item.group?.trim() || "นอกกรอบ";
      const key = `${item.groupOrder ?? 0}:${name}`;
      const group = groups.find((entry) => entry.key === key);
      if (group) group.items.push(item);
      else groups.push({ key, name, items: [item] });
    });
    return groups;
  }

  private firstPreviewMode() {
    return this.previewModes()[0] ?? "insideFrame";
  }

  render() {
    const { items, className = "" } = this.props;
    const { previewOpen, previewMode, previewGroup } = this.state;
    const previewModes = this.previewModes();
    const activeMode = previewModes.includes(previewMode) ? previewMode : this.firstPreviewMode();
    const modeItems = items.filter((item) => item.kind === activeMode);
    const outsideGroups = activeMode === "outsideFrame" ? this.outsideGroups(modeItems) : [];
    const activeOutsideGroup = outsideGroups.find((group) => group.key === previewGroup) ?? outsideGroups[0];
    const activeItems = activeOutsideGroup?.items ?? modeItems;

    return (
      // <div className="sticker-preview-wrap">
      <div>
        <Button
          className={`sticker-preview-open marking-preview-open ${className}`.trim()}
          disabled={items.length === 0}
          onClick={() => this.setState({
            previewOpen: true,
            previewMode: this.firstPreviewMode(),
            previewGroup: null,
          })}
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
            {outsideGroups.length > 0 && (
              <div className="sticker-template-preview-modes sticker-template-preview-groups" aria-label="เลือก Table นอกกรอบ">
                {outsideGroups.map((group) => (
                  <button
                    type="button"
                    className={group.key === activeOutsideGroup?.key ? "active" : ""}
                    onClick={() => this.setState({ previewGroup: group.key })}
                    key={group.key}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
            <div className="container pdf-preview sticker-template-real-preview">
              <StickerPreviewPages items={activeItems} mode={activeMode} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
