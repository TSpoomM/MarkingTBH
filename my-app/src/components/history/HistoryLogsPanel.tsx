"use client";

import { Component } from "react";
import Button from "@/src/components/ui/Button";
import cn from "@/src/core/ui/cn";
import { PANEL } from "@/src/core/ui/surfaces";
import HistoryPanelHeading from "./HistoryPanelHeading";
import {
  HISTORY_EMPTY, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP,
  HISTORY_TOGGLE, historyBadge,
} from "@/src/core/ui/history";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import type { HistoryLogsPanelProps } from "@/src/core/models/history";

export default class HistoryLogsPanel extends Component<HistoryLogsPanelProps> {
  render() {
    const { items, totalCount, isLoading, onOpenDetail } = this.props;

    return (
      <section className={cn(PANEL, "overflow-hidden")}>
        <HistoryPanelHeading
          title="ประวัติ Marking"
          subtitle="รายการล่าสุด"
          visibleCount={items.length}
          totalCount={totalCount}
        />

        {isLoading ? (
          <div className={HISTORY_EMPTY}>กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className={HISTORY_EMPTY}>ไม่พบรายการ</div>
        ) : (
          <div className={HISTORY_TABLE_WRAP}>
            <table className={HISTORY_TABLE}>
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
                {items.map((item) => (
                  <tr className={HISTORY_ROW} key={item.id}>
                    <td>{HistoryFormatter.formatDateTime(item.createdDate)}</td>
                    <td>{item.employeeName || "-"}</td>
                    <td>{item.employeeLocation || "-"}</td>
                    <td>{item.customerName || `Template #${item.templateId}`}</td>
                    <td><span className={historyBadge(item.actionType)}>{HistoryFormatter.actionLabel(item.actionType)}</span></td>
                    <td>{HistoryFormatter.detailText(item)}</td>
                    <td>
                      <Button className={HISTORY_TOGGLE} onClick={() => onOpenDetail(item.id)}>
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
