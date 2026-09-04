"use client";

import HistoryComponent from "./HistoryComponent";
import HistoryFormatter from "@/src/core/history/historyFormatter";

export default class HistoryTemplatesPanel extends HistoryComponent {
  render() {
    if (this.state.mode !== "templates") return null;
    const filteredTemplateItems = HistoryFormatter.filteredTemplateItems(
      this.state.templateItems,
      this.state.templateQuery,
      this.state.date,
    );
    const visibleCount = filteredTemplateItems.length;
    const totalCount = this.state.templateItems.length;

    return (
      <section className="panel history-panel">
        <div className="table-heading history-heading-with-total">
          <div className="section-title">
            <div>
              <span>{visibleCount}</span>
              <div>
                <h2>ประวัติ Marking</h2>
                <p>รายการล่าสุด</p>
              </div>
            </div>
          </div>
          <div className="history-total-inline">
            <span>รายการทั้งหมด</span>
            <strong>{visibleCount}</strong>
            <small>จากทั้งหมด {totalCount} รายการ</small>
          </div>
        </div>

        {this.state.isTemplateLoading ? (
          <div className="history-empty">กำลังโหลด...</div>
        ) : filteredTemplateItems.length === 0 ? (
          <div className="history-empty">ไม่พบรายการ</div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table history-template-list">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>สร้างเมื่อ</th>
                  <th>แก้ไขล่าสุด</th>
                  <th>ผู้แก้ล่าสุด</th>
                  <th>Fields</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplateItems.map((item) => (
                  <tr className="history-row" key={item.id}>
                    <td>{item.name || `Template #${item.id}`}</td>
                    <td>{HistoryFormatter.formatDateTime(item.createdAt)}</td>
                    <td>{HistoryFormatter.formatDateTime(item.updatedAt)}</td>
                    <td>{item.updatedBy || "-"}</td>
                    <td>
                      <span className="history-field-count">
                        ในกรอบ {item.insideFieldCount} / นอกกรอบ {item.outsideFieldCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
}
