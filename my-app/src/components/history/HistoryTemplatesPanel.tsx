"use client";

import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { PANEL } from "@/src/core/ui/surfaces";
import HistoryPanelHeading from "./HistoryPanelHeading";
import {
  HISTORY_EMPTY, HISTORY_FIELD_COUNT, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP,
} from "@/src/core/ui/history";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import type { HistoryTemplatesPanelProps } from "@/src/core/models/history";

export default class HistoryTemplatesPanel extends Component<HistoryTemplatesPanelProps> {
  render() {
    const { items, totalCount, isLoading } = this.props;

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
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[17%]" />
                <col className="w-[17%]" />
                <col className="w-[14%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead>
                <tr>
                  <th>Template</th>
                  <th className="!text-center">สร้างเมื่อ</th>
                  <th className="!text-center">แก้ไขล่าสุด</th>
                  <th className="!text-center">ผู้แก้ล่าสุด</th>
                  <th className="!text-center">Fields</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className={HISTORY_ROW} key={item.id}>
                    <td>{item.name || `Template #${item.id}`}</td>
                    <td className="!text-center">{HistoryFormatter.formatDateTime(item.createdAt)}</td>
                    <td className="!text-center">{HistoryFormatter.formatDateTime(item.updatedAt)}</td>
                    <td className="!text-center">{item.updatedBy || "-"}</td>
                    <td className="!text-center">
                      <span className={HISTORY_FIELD_COUNT}>
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
