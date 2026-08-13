"use client";

import Button from "@/app/components/Button";
import DownloadIcon from "./DownloadIcon";
import MarkingComponent from "./MarkingComponent";

export default class Pagination extends MarkingComponent {
  render() {
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
    );
  }
}
