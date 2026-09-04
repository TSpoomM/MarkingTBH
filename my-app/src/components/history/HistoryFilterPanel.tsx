"use client";

import type { ChangeEvent } from "react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import Button from "@/src/components/ui/Button";
import CalendarInput from "@/src/components/ui/CalendarInput";
import Select from "@/src/components/ui/Select";
import HistoryComponent from "./HistoryComponent";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import type { HistoryPageState } from "@/src/core/models/history";

export default class HistoryFilterPanel extends HistoryComponent {
  render() {
    const isTemplateMode = this.state.mode === "templates";
    const activeFilters = [
      this.state.templateQuery,
      isTemplateMode ? "" : this.state.employeeQuery,
      !isTemplateMode && this.state.action !== "all" ? this.state.action : "",
      this.state.date,
    ].filter(Boolean).length;

    return (
      <section className={`panel history-filter ${isTemplateMode ? "template-history-filter" : ""}`}>
        <div className="history-filter-title">
          <strong>ค้นหารายการ</strong>
          <span>กรองจากTemplate ผู้บันทึก การทำรายการ หรือวันที่</span>
        </div>
        <Autocomplete
          label="Template"
          options={isTemplateMode
            ? HistoryFormatter.uniqueTemplateValues(this.state.templateItems)
            : HistoryFormatter.uniqueValues(this.state.items, (item) => item.customerName)}
          value={this.state.templateQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => this.actions.setTemplateQuery(event.target.value)}
          placeholder="พิมพ์เพื่อเลือกTemplate"
        />
        <Autocomplete
          label="ผู้บันทึก"
          options={HistoryFormatter.uniqueValues(this.state.items, (item) => item.employeeName)}
          value={this.state.employeeQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => this.actions.setEmployeeQuery(event.target.value)}
          placeholder="พิมพ์เพื่อเลือกผู้บันทึก"
        />
        <Select
          label="การทำรายการ"
          value={this.state.action}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            this.actions.setAction(event.target.value as HistoryPageState["action"])}
        >
          <option value="all">ทั้งหมด</option>
          <option value="print">พิมพ์/PDF</option>
          <option value="save">บันทึก</option>
          <option value="unknown">ข้อมูลเก่า</option>
        </Select>
        <CalendarInput
          label="วันที่"
          value={this.state.date}
          onChange={(value) => this.actions.setDate(value)}
        />
        <div className="history-filter-actions">
          <Button
            type="button"
            className="history-clear"
            onClick={() => this.actions.clearFilters()}
            disabled={activeFilters === 0}
          >
            ล้าง Filter
          </Button>
        </div>
      </section>
    );
  }
}
