"use client";

import Button from "@/app/components/Button";
import DownloadIcon from "./DownloadIcon";
import MarkingComponent from "./MarkingComponent";
import StickerFactory from "./StickerFactory";
import StickerPreviewButton from "./StickerPreviewButton";

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
    const previewItems = this.previewItems(StickerFactory.build({
      customerName: this.state.template?.customerName ?? customer?.name ?? "",
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

    return (
      <div className="container bottom-action">
        <div className="save-summary">
          <strong>พร้อมส่งออก PDF</strong>
          <span>
            สติ๊กเกอร์ในกรอบ {this.state.insideRows.length} ชุด
            {this.state.template?.outside.length
              ? ` · สติ๊กเกอร์นอกกรอบ ${this.state.outsideRows.length} ชุด`
              : " · ลูกค้ารายนี้ไม่มีสติ๊กเกอร์นอกกรอบ"}
          </span>
        </div>
        <div className="bottom-action-buttons">
          <StickerPreviewButton items={previewItems} className="bottom-preview-open" />
          <Button
            className="export-button"
            onClick={() => void this.actions.saveAndExport()}
            disabled={this.state.isSaving || !this.state.template}
            loading={this.state.isSaving}
            loadingText="กำลังส่งออก..."
          >
            <DownloadIcon />
            ส่งออก PDF
          </Button>
        </div>
      </div>
    );
  }
}
