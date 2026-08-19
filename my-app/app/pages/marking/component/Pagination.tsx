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
        item.details.map((detail) => `${detail.label}:${detail.values.map((value) => value.label ?? "").join("|")}`).join(";"),
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  render() {
    const customer = this.state.customers.find(
      (item) => String(item.id) === this.state.customerId,
    );
    const previewFormat = this.state.stickerFormat || "555";
    const previewSideCount = Number(this.state.stickerSides || 1);
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      StickerFactory.matchesCondition(field, this.state.stickerType, this.state.stickerOther),
    );
    const customerName = this.state.printSections.customerName
      ? this.state.template?.customerName ?? customer?.name ?? ""
      : "";
    const previewItems = this.previewItems(StickerFactory.build({
      customerName,
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
      insideFrame: !!this.state.template,
      outsideFrame: outsideFields.length > 0,
      customerName: !!(this.state.template?.customerName ?? customer?.name ?? "").trim(),
      fscLogo: this.state.stickerType === "TNR" && this.state.stickerFsc,
    };
    const sectionCounts: Record<PrintSection, string> = {
      insideFrame: "สติ๊กเกอร์ในกรอบ",
      outsideFrame: outsideFields.length ? `สติ๊กเกอร์นอกกรอบ (${StickerFactory.outsideGroups(outsideFields).length} ชุด)` : "สติ๊กเกอร์นอกกรอบ",
      customerName: "ชื่อ Customer",
      fscLogo: "โลโก้ FSC",
    };
    const printOptions: Array<{ key: PrintSection; title: string; description: string }> = [
      { key: "insideFrame", title: "ในกรอบ", description: sectionCounts.insideFrame },
      { key: "outsideFrame", title: "นอกกรอบ", description: sectionCounts.outsideFrame },
      { key: "customerName", title: "ชื่อ Customer", description: sectionCounts.customerName },
      { key: "fscLogo", title: "FSC", description: sectionCounts.fscLogo },
    ];
    const hasSelectedPrintSection = Object.entries(this.state.printSections)
      .some(([section, enabled]) => enabled && availableSections[section as PrintSection]);

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
                const disabled = !availableSections[option.key];
                return (
                  <label className={`print-export-option ${disabled ? "disabled" : ""}`} key={option.key}>
                    <input
                      type="checkbox"
                      checked={this.state.printSections[option.key] && !disabled}
                      disabled={disabled}
                      onChange={(event) => this.actions.setPrintSection(option.key, event.target.checked)}
                    />
                    <span className="print-export-check" aria-hidden="true" />
                    <span>
                      <b>{option.title}</b>
                      <small>{disabled ? "ยังไม่มีข้อมูลสำหรับปริ้นรายการนี้" : option.description}</small>
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
