"use client";

import HistoryComponent from "./HistoryComponent";
import HistoryFormatter from "@/src/core/history/historyFormatter";

export default class HistoryOverview extends HistoryComponent {
  render() {
    const isTemplateMode = this.state.mode === "templates";
    const visibleCount = isTemplateMode
      ? HistoryFormatter.filteredTemplateItems(this.state.templateItems, this.state.templateQuery, this.state.date).length
      : HistoryFormatter.filteredItems(
        this.state.items,
        this.state.templateQuery,
        this.state.employeeQuery,
        this.state.action,
        this.state.date,
      ).length;
    const totalCount = isTemplateMode ? this.state.templateItems.length : this.state.items.length;

    return (
      <section className="history-overview history-overview-single" aria-label="สรุปประวัติ">
        <div>
          <span>รายการทั้งหมด</span>
          <strong>{visibleCount}</strong>
          <small>จากทั้งหมด {totalCount} รายการ</small>
        </div>
      </section>
    );
  }
}
