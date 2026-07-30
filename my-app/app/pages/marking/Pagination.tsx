"use client";

import Button from "@/app/components/Button";
import MarkingComponent from "./MarkingComponent";

export default class Pagination extends MarkingComponent {
  render() {
    return (
      <div className="container bottom-action">
        <span>
          Inside {this.state.insideRows.length} ชุด
          {this.state.template?.outside.length
            ? ` · Outside ${this.state.outsideRows.length} ชุด`
            : " · ลูกค้ารายนี้ไม่มี Outside"}
        </span>
        <Button
          className="export-button"
          onClick={() => void this.actions.save()}
          disabled={this.state.isSaving || !this.state.template}
          loading={this.state.isSaving}
        >
          บันทึก
        </Button>
      </div>
    );
  }
}
