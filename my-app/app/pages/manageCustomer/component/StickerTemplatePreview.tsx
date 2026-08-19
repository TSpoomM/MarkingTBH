import { Component } from "react";
import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import StickerFactory from "@/app/pages/marking/component/StickerFactory";
import StickerPreviewPages from "@/app/pages/marking/component/StickerPreviewPages";
import type { TemplateField } from "@/app/types/customer";
import type { MarkingContent } from "@/app/types/marking";
import type { StickerKind } from "@/app/types/marking-sticker";
import type { StickerTemplatePreviewProps } from "@/app/types/manage-customer";

const PREVIEW_MODE_LABELS: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Customer",
  fscLogo: "โลโก้ FSC",
};

const PREVIEW_MODE_ORDER: StickerKind[] = ["insideFrame", "outsideFrame", "customerName", "fscLogo"];

export default class StickerTemplatePreview extends Component<
  StickerTemplatePreviewProps,
  { previewOpen: boolean; previewMode: StickerKind; previewGroup: string | null }
> {
  state = { previewOpen: false, previewMode: "insideFrame" as StickerKind, previewGroup: null };


  private mockFieldValue(field: Pick<TemplateField, "type">) {
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

  private previewItems(items: ReturnType<typeof StickerFactory.build>) {
    const seen = new Set<string>();
    return items.filter((item) => {
      const signature = [
        item.kind,
        item.group ?? "",
        item.details.map((detail) => (
          `${detail.label}:${detail.values.map((value) => value.label ?? "").join("|")}`
        )).join(";"),
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  private previewModes(items: ReturnType<typeof StickerFactory.build>) {
    const kinds = new Set(items.map((item) => item.kind));
    return PREVIEW_MODE_ORDER.filter((kind) => kinds.has(kind));
  }

  private firstPreviewMode(items: ReturnType<typeof StickerFactory.build>) {
    return this.previewModes(items)[0] ?? "insideFrame";
  }

  private outsideGroups(items: ReturnType<typeof StickerFactory.build>) {
    const groups: string[] = [];
    items.forEach((item) => {
      const name = item.group ?? "";
      if (!name || groups.includes(name)) return;
      groups.push(name);
    });
    return groups;
  }

  render() {
    const { customerName, insideFields, outsideFields, layouts, defaults } = this.props;
    const activeOutsideFields = outsideFields.filter((field) =>
      StickerFactory.matchesCondition(field, defaults.stickerType, defaults.stickerOther),
    );
    const { previewOpen, previewMode, previewGroup } = this.state;
    const previewItems = this.previewItems(StickerFactory.build({
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
    const previewModes = this.previewModes(previewItems);
    const activeMode = previewModes.includes(previewMode) ? previewMode : this.firstPreviewMode(previewItems);
    const modePreviewItems = previewItems.filter((item) => item.kind === activeMode);
    const outsideGroups = activeMode === "outsideFrame" ? this.outsideGroups(modePreviewItems) : [];
    const activeGroup = outsideGroups.includes(previewGroup ?? "") ? previewGroup : (outsideGroups[0] ?? null);
    const activePreviewItems = activeGroup
      ? modePreviewItems.filter((item) => item.group === activeGroup)
      : modePreviewItems;

    return (
      <div>
        <Button
          className="sticker-preview-open"
          disabled={previewItems.length === 0}
          onClick={() => this.setState({ previewOpen: true, previewMode: this.firstPreviewMode(previewItems), previewGroup: null })}
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
