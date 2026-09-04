"use client";

import Modal from "@/src/components/ui/Modal";
import HistoryComponent from "./HistoryComponent";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import HistoryTemplateSection from "./HistoryTemplateSection";

export default class HistoryDetailModal extends HistoryComponent {
  render() {
    const item = this.state.openId
      ? this.state.items.find((entry) => entry.id === this.state.openId)
      : undefined;

    return (
      <Modal
        open={!!item}
        title={item?.customerName || "รายละเอียดประวัติ"}
        subtitle={item ? `${HistoryFormatter.actionLabel(item.actionType)} · ${HistoryFormatter.formatDateTime(item.createdDate)}` : undefined}
        onClose={() => this.actions.closeDetail()}
      >
        {item && (
          <div className="editor-body history-template-modal">
            <section className="history-template-summary">
              <div>
                <span>ผู้บันทึก</span>
                <strong>{item.employeeName || "-"}</strong>
              </div>
              <div>
                <span>สาขา</span>
                <strong>{item.employeeLocation || "-"}</strong>
              </div>
            </section>
            <section className="history-sticker-details">
              <h3>รายละเอียดสติ๊กเกอร์</h3>
              <dl>
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
              </dl>
            </section>
            <section className="history-sticker-content">
              <h3>ข้อมูลในสติ๊กเกอร์</h3>
              <HistoryTemplateSection title="ในกรอบ" rows={item.inside} fieldMeta={item.fieldMeta?.inside} />
              <HistoryTemplateSection title="นอกกรอบ" rows={item.outside} fieldMeta={item.fieldMeta?.outside} />
            </section>
          </div>
        )}
      </Modal>
    );
  }
}
