"use client";

import { Component } from "react";
import Modal from "@/src/components/ui/Modal";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import HistoryTemplateSection from "./HistoryTemplateSection";
import cn from "@/src/core/ui/cn";
import {
  HISTORY_BOX, HISTORY_BOX_TITLE, HISTORY_MODAL_BODY, HISTORY_SPEC_LIST, HISTORY_SUMMARY,
} from "@/src/core/ui/history";
import type { HistoryDetailModalProps } from "@/src/core/models/history";

export default class HistoryDetailModal extends Component<HistoryDetailModalProps> {
  render() {
    const { item, onClose } = this.props;

    return (
      <Modal
        open={!!item}
        title={item?.customerName || "รายละเอียดประวัติ"}
        subtitle={item ? `${HistoryFormatter.actionLabel(item.actionType)} · ${HistoryFormatter.formatDateTime(item.createdDate)}` : undefined}
        onClose={onClose}
      >
        {item && (
          <div className={HISTORY_MODAL_BODY}>
            <section className={HISTORY_SUMMARY}>
              <div>
                <span>ผู้บันทึก</span>
                <strong>{item.employeeName || "-"}</strong>
              </div>
              <div>
                <span>สาขา</span>
                <strong>{item.employeeLocation || "-"}</strong>
              </div>
            </section>
            <section className={cn(HISTORY_BOX, HISTORY_BOX_TITLE, "bg-white")}>
              <h3>รายละเอียดสติ๊กเกอร์</h3>
              <dl className={HISTORY_SPEC_LIST}>
                <div>
                  <dt>Production</dt>
                  <dd>{item.productionDate || "-"}</dd>
                </div>
                <div>
                  <dt>LOT</dt>
                  <dd>{item.lotStart && item.lotEnd ? `${item.lotStart}-${item.lotEnd}` : "-"}</dd>
                </div>
                <div>
                  <dt>จำนวน LOT</dt>
                  <dd>{item.lotCount || "-"}</dd>
                </div>
                <div>
                  <dt>จำนวนด้าน</dt>
                  <dd>{item.stickerSides || "-"}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{item.stickerFormat || "-"}</dd>
                </div>
                <div>
                  <dt>เกรด</dt>
                  <dd>{item.stickerType || "-"}</dd>
                </div>
                <div>
                  <dt>FSC</dt>
                  <dd>{item.stickerFsc === undefined ? "-" : item.stickerFsc ? "ใช่" : "ไม่ใช่"}</dd>
                </div>
                <div>
                  <dt>Other</dt>
                  <dd>{item.stickerOther || "-"}</dd>
                </div>
                <div>
                  <dt>สิ่งที่พิมพ์</dt>
                  <dd>{HistoryFormatter.printedSections(item)}</dd>
                </div>
              </dl>
            </section>
            <section className={cn(HISTORY_BOX, HISTORY_BOX_TITLE, "bg-[#fdfefe]")}>
              <h3>ข้อมูลในสติ๊กเกอร์</h3>
              <HistoryTemplateSection title="ในกรอบ" rows={item.inside} fieldMeta={item.fieldMeta?.inside} />
              {HistoryFormatter.outsideGroups(item.outside, item.fieldMeta?.outside).map((group, index) => (
                <HistoryTemplateSection
                  key={group.name ?? `outside-${index}`}
                  title={group.name ? `นอกกรอบ · ${group.name}` : "นอกกรอบ"}
                  rows={group.rows}
                  fieldMeta={item.fieldMeta?.outside}
                />
              ))}
            </section>
          </div>
        )}
      </Modal>
    );
  }
}
