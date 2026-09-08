"use client";

import { Component } from "react";
import { MODAL_BODY } from "@/src/core/ui/fieldEditor";
import { CONTAINER } from "@/src/core/ui/surfaces";
import cn from "@/src/core/ui/cn";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import StickerPreview, { PREVIEW_MODE_LABELS } from "@/src/core/stickers/stickerPreview";
import type { StickerItem, StickerKind } from "@/src/core/models/marking-sticker";
import StickerPreviewPages from "./StickerPreviewPages";

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

  render() {
    const { items, className = "" } = this.props;
    const { previewOpen, previewMode, previewGroup } = this.state;
    const previewModes = StickerPreview.modes(items);
    const activeMode = previewModes.includes(previewMode) ? previewMode : StickerPreview.firstMode(items);
    const modeItems = items.filter((item) => item.kind === activeMode);
    const outsideGroups = activeMode === "outsideFrame" ? StickerPreview.outsideItemGroups(modeItems) : [];
    const activeOutsideGroup = outsideGroups.find((group) => group.key === previewGroup) ?? outsideGroups[0];
    const activeItems = activeOutsideGroup?.items ?? modeItems;

    return (
      <div>
        <Button
          variant="secondary"
          size="md"
          className={className}
          disabled={items.length === 0}
          onClick={() => this.setState({
            previewOpen: true,
            previewMode: StickerPreview.firstMode(items),
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
          <div className={cn(MODAL_BODY, "sticker-template-preview-modal-body")}>
            {previewModes.length > 1 && (
              <div className="sticker-template-preview-modes" aria-label="เลือกโหมด Preview">
                {previewModes.map((mode) => (
                  <Button
                    type="button"
                    className={mode === activeMode ? "active" : ""}
                    onClick={() => this.setState({ previewMode: mode, previewGroup: null })}
                    key={mode}
                  >
                    {PREVIEW_MODE_LABELS[mode]}
                  </Button>
                ))}
              </div>
            )}
            {outsideGroups.length > 0 && (
              <div className="sticker-template-preview-modes sticker-template-preview-groups" aria-label="เลือก Table นอกกรอบ">
                {outsideGroups.map((group) => (
                  <Button
                    type="button"
                    className={group.key === activeOutsideGroup?.key ? "active" : ""}
                    onClick={() => this.setState({ previewGroup: group.key })}
                    key={group.key}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            )}
            <div className={cn(CONTAINER, "pdf-preview sticker-template-real-preview")}>
              <StickerPreviewPages items={activeItems} mode={activeMode} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
