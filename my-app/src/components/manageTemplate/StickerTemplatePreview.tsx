import { Component } from "react";
import { MODAL_BODY } from "@/src/core/ui/fieldEditor";
import { CONTAINER, PREVIEW_FAB } from "@/src/core/ui/surfaces";
import cn from "@/src/core/ui/cn";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import StickerPreview, { PREVIEW_MODE_LABELS } from "@/src/core/stickers/stickerPreview";
import StickerPreviewPages from "@/src/components/marking/StickerPreviewPages";
import type { TemplateField } from "@/src/core/models/template";
import type { MarkingContent } from "@/src/core/models/marking";
import type { StickerKind } from "@/src/core/models/marking-sticker";
import type { StickerTemplatePreviewProps } from "@/src/core/models/manage-template";

export default class StickerTemplatePreview extends Component<
  StickerTemplatePreviewProps,
  { previewOpen: boolean; previewMode: StickerKind; previewGroup: string | null }
> {
  state = { previewOpen: false, previewMode: "insideFrame" as StickerKind, previewGroup: null };


  private mockFieldValue(field: Pick<TemplateField, "type"> & Partial<Pick<TemplateField, "label" | "defaultValue" | "locked">>) {
    if (field.locked) return String(field.defaultValue ?? field.label ?? "");
    return field.type === "number" ? "0" : "xxx";
  }

  private mockRow(fields: TemplateField[]) {
    return fields.reduce<MarkingContent>((row, field) => {
      if (field.segments?.length) {
        field.segments.forEach((segment) => {
          row[segment.key] = this.mockFieldValue({ type: segment.type ?? field.type });
        });
        return row;
      }

      row[field.key] = this.mockFieldValue(field);
      return row;
    }, {});
  }

  render() {
    const { customerName, insideFields, outsideFields, layouts, defaults } = this.props;
    const activeOutsideFields = outsideFields.filter((field) =>
      StickerFactory.matchesCondition(field, defaults.stickerType, defaults.stickerOther),
    );
    const { previewOpen, previewMode, previewGroup } = this.state;
    const previewItems = StickerPreview.unique(StickerFactory.build({
      customerName,
      format: defaults.format,
      sideCount: defaults.sideCount,
      lotCount: 1,
      lotStart: 0,
      productionDate: "xxx",
      stickerType: defaults.stickerType,
      stickerFsc: defaults.stickerFsc,
      layouts,
      insideFields,
      outsideFields: activeOutsideFields,
      insideRow: this.mockRow(insideFields),
      outsideRow: this.mockRow(activeOutsideFields),
    }));
    const previewModes = StickerPreview.modes(previewItems);
    const activeMode = previewModes.includes(previewMode) ? previewMode : StickerPreview.firstMode(previewItems);
    const modePreviewItems = previewItems.filter((item) => item.kind === activeMode);
    const outsideGroups = activeMode === "outsideFrame" ? StickerPreview.outsideGroupNames(modePreviewItems) : [];
    const activeGroup = outsideGroups.includes(previewGroup ?? "") ? previewGroup : (outsideGroups[0] ?? null);
    const activePreviewItems = activeGroup
      ? modePreviewItems.filter((item) => item.group === activeGroup)
      : modePreviewItems;

    return (
      <div>
        <Button
          className={PREVIEW_FAB}
          disabled={previewItems.length === 0}
          onClick={() => this.setState({ previewOpen: true, previewMode: StickerPreview.firstMode(previewItems), previewGroup: null })}
          title={previewItems.length === 0 ? "ยังไม่ได้เลือกรูปแบบสติกเกอร์" : "ดู Preview Sticker"}
        >
          ดู Preview Sticker
        </Button>
        <Modal
          open={previewOpen}
          title="Preview Sticker"
          subtitle="ตัวอย่างจากข้อมูลจำลอง: string = xxx, number = 0"
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
            {outsideGroups.length > 1 && (
              <div className="sticker-template-preview-modes sticker-template-preview-groups" aria-label="เลือกนอกกรอบ">
                {outsideGroups.map((group) => (
                  <Button
                    type="button"
                    className={group === activeGroup ? "active" : ""}
                    onClick={() => this.setState({ previewGroup: group })}
                    key={group}
                  >
                    {StickerFactory.outsideGroupTitle(group)}
                  </Button>
                ))}
              </div>
            )}
            <div className={cn(CONTAINER, "pdf-preview sticker-template-real-preview")}>
              <StickerPreviewPages items={activePreviewItems} mode={activeMode} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
