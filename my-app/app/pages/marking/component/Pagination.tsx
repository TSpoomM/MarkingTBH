"use client";

import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import DownloadIcon from "./DownloadIcon";
import MarkingComponent from "./MarkingComponent";
import StickerFactory from "./StickerFactory";
import StickerPreviewButton from "./StickerPreviewButton";
import type { PrintSection } from "@/app/types/marking";

export default class Pagination extends MarkingComponent {
  private previewItems(items: ReturnType<typeof StickerFactory.build>) {
    const seen = new Set<string>();
    return items.filter((item) => {
      const signature = [
        item.kind,
        item.group ?? "",
        item.groupOrder ?? "",
        item.details.map((detail) => `${detail.label}:${detail.values.map((value) => value.label ?? "").join("|")}`).join(";"),
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  render() {
    const previewFormat = this.state.stickerFormat || "555";
    const previewSideCount = Number(this.state.stickerSides || 1);
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      StickerFactory.matchesCondition(field, this.state.stickerType, this.state.stickerOther),
    );
    const outsideGroups = StickerFactory.outsideGroups(outsideFields);
    const previewItems = this.previewItems(StickerFactory.build({
      customerName: "",
      format: previewFormat,
      sideCount: previewSideCount,
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate || "xxx",
      stickerType: this.state.stickerType,
      stickerFsc: this.state.stickerFsc,
      layouts: this.state.template?.sticker.layouts,
      insideFields: this.state.template?.inside ?? [],
      outsideFields,
      insideRow: this.state.insideRows[0],
      outsideRow: this.state.outsideRows[0],
    }));
    const availableSections: Record<PrintSection, boolean> = {
      insideFrame: !!this.state.template && this.state.template.sticker.layouts.insideFrame !== false,
      outsideFrame: this.state.template?.sticker.layouts.outsideFrame !== false && outsideGroups.length > 0,
      customerName: false,
      fscLogo: this.state.stickerType === "TNR" && this.state.stickerFsc,
    };
    const printOptions: Array<{
      key: string;
      section: PrintSection;
      title: string;
      description: string;
      outsideGroupKey?: string;
    }> = [
      ...(availableSections.insideFrame
        ? [{ key: "insideFrame", section: "insideFrame" as const, title: "ในกรอบ", description: "สติ๊กเกอร์ในกรอบ" }]
        : []),
      ...(availableSections.outsideFrame
        ? outsideGroups.map((group) => ({
          key: `outside-${StickerFactory.outsideGroupKey(group)}`,
          section: "outsideFrame" as const,
          title: group.name,
          description: "สติ๊กเกอร์นอกกรอบ",
          outsideGroupKey: StickerFactory.outsideGroupKey(group),
        }))
        : []),
      ...(availableSections.fscLogo
        ? [{ key: "fscLogo", section: "fscLogo" as const, title: "FSC", description: "โลโก้ FSC" }]
        : []),
    ];
    const isOptionSelected = (option: (typeof printOptions)[number]) => (
      this.state.printSections[option.section] &&
      (!option.outsideGroupKey || this.state.printOutsideGroups[option.outsideGroupKey] !== false)
    );
    const hasSelectedPrintSection = printOptions.some(isOptionSelected);

    return (
      <>
        <div className="container bottom-action">
          <div className="save-summary">
            <strong>พร้อมส่งออก PDF</strong>
          </div>
          <div className="bottom-action-buttons">
            <StickerPreviewButton items={previewItems} className="bottom-preview-open" />
            <Button
              className="export-button"
              onClick={() => this.actions.openExportModal()}
              disabled={this.state.isSaving || !this.state.template}
              loading={this.state.isSaving}
              loadingText="กำลังส่งออก..."
            >
              <DownloadIcon />
              ส่งออก PDF
            </Button>
          </div>
        </div>
        <Modal
          open={this.state.isExportModalOpen}
          title="เลือกสติ๊กเกอร์ที่จะปริ้น"
          subtitle="เลือกได้มากกว่า 1 แบบ แล้วระบบจะบันทึกและเปิดหน้าพิมพ์ PDF"
          onClose={() => this.actions.closeExportModal()}
          footer={(
            <div className="print-export-actions">
              <Button type="button" className="print-export-secondary" onClick={() => this.actions.closeExportModal()}>
                ยกเลิก
              </Button>
              <Button
                type="button"
                className="export-button"
                onClick={() => void this.actions.saveAndExport()}
                disabled={!hasSelectedPrintSection}
                loading={this.state.isSaving}
                loadingText="กำลังส่งออก..."
              >
                <DownloadIcon />
                ปริ้นรายการที่เลือก
              </Button>
            </div>
          )}
        >
          <div className="print-export-body">
            <div className="print-export-options">
              {printOptions.map((option) => {
                return (
                  <label className="print-export-option" key={option.key}>
                    <input
                      type="checkbox"
                      checked={isOptionSelected(option)}
                      onChange={(event) => option.outsideGroupKey
                        ? this.actions.setPrintOutsideGroup(option.outsideGroupKey, event.target.checked)
                        : this.actions.setPrintSection(option.section, event.target.checked)}
                    />
                    <span className="print-export-check" aria-hidden="true" />
                    <span>
                      <b>{option.title}</b>
                      <small>{option.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </Modal>
      </>
    );
  }
}
