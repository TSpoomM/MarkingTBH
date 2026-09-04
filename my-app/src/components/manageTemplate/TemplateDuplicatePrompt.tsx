"use client";

import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import TemplateManageComponent from "./TemplateManageComponent";

export default class TemplateDuplicatePrompt extends TemplateManageComponent {
  render() {
    return (
      <Modal
        open={!!this.state.duplicateNamePrompt}
        title="มี template นี้อยู่แล้ว"
        subtitle={``}
        onClose={this.actions.dismissDuplicatePrompt}
        footer={(
          <div className="duplicate-template-actions">
            <Button type="button" className="duplicate-template-secondary" onClick={this.actions.dismissDuplicatePrompt}>
              เปลี่ยนชื่อ
            </Button>
            <Button
              type="button"
              className="duplicate-template-primary"
              onClick={() => void this.actions.replaceDuplicateTemplate()}
              loading={this.state.saving}
              loadingText="กำลังแทนที่..."
            >
              แทนที่ Template เดิม
            </Button>
          </div>
        )}
      >
        <div className="duplicate-template-alert">
          <div className="duplicate-template-icon" aria-hidden="true">!</div>
          <div className="duplicate-template-copy">
            <span className="duplicate-template-eyebrow">พบชื่อซ้ำในระบบ</span>
            <strong>{this.state.duplicateNamePrompt?.name ?? ""}</strong>
            <div className="duplicate-template-note">
              <b>แนะนำ:</b>
              <span>เลือก “เปลี่ยนชื่อ” ถ้านี่เป็น Template คนละราย หรือ คนละ template</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
