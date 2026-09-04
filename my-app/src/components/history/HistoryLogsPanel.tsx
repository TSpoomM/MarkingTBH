"use client";

import Button from "@/src/components/ui/Button";
import HistoryComponent from "./HistoryComponent";
import HistoryFormatter from "@/src/core/history/historyFormatter";

export default class HistoryLogsPanel extends HistoryComponent {
  render() {
    if (this.state.mode !== "logs") return null;
    const filteredItems = HistoryFormatter.filteredItems(
      this.state.items,
      this.state.templateQuery,
      this.state.employeeQuery,
      this.state.action,
      this.state.date,
    );
    const visibleCount = filteredItems.length;
    const totalCount = this.state.items.length;

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

        {this.state.isLoading ? (
          <div className="history-empty">กำลังโหลด...</div>
        ) : filteredItems.length === 0 ? (
          <div className="history-empty">ไม่พบรายการ</div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>ผู้บันทึก</th>
                  <th>สาขา</th>
                  <th>ลูกค้า</th>
                  <th>การทำรายการ</th>
                  <th>รายละเอียด</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr className="history-row" key={item.id}>
                    <td>{HistoryFormatter.formatDateTime(item.createdDate)}</td>
                    <td>{item.employeeName || "-"}</td>
                    <td>{item.employeeLocation || "-"}</td>
                    <td>{item.customerName || `Template #${item.templateId}`}</td>
                    <td><span className={`history-badge ${item.actionType}`}>{HistoryFormatter.actionLabel(item.actionType)}</span></td>
                    <td>{HistoryFormatter.detailText(item)}</td>
                    <td>
                      <Button className="history-toggle" onClick={() => this.actions.openDetail(item.id)}>
                        ดู
                      </Button>
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
