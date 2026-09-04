"use client";

import Button from "@/src/components/ui/Button";
import TemplateManageComponent from "./TemplateManageComponent";

export default class TemplateModeSwitch extends TemplateManageComponent {
  render() {
    if (this.state.checkingRole || !this.state.isAdmin) return null;
    return (
      <div className="template-admin-top">
        <div className="template-mode-switch" aria-label="เลือกโหมดจัดการ Template">
          <Button
            type="button"
            className={this.state.mode === "edit" ? "active" : ""}
            onClick={() => this.actions.changeMode("edit")}
          >
            แก้ไข Template
          </Button>
          <Button
            type="button"
            className={this.state.mode === "create" ? "active" : ""}
            onClick={() => this.actions.changeMode("create")}
          >
            เพิ่ม Template
          </Button>
        </div>
        <div className="template-mode-help">
          <strong>
            {this.state.mode === "edit"
              ? "เลือก Tempate เดิม แล้วปรับช่องบนสติ๊กเกอร์"
              : "สร้าง Template ใหม่ แล้วกำหนดช่องที่ User ต้องกรอก"}
          </strong>
          <span>
            {this.state.mode === "edit"
              ? "เหมาะกับการแก้ Field, ลำดับ Preview และ Template ที่ใช้อยู่"
              : "ทำตามลำดับ 1 ถึง 4 แล้วกดบันทึกด้านล่าง"}
          </span>
        </div>
      </div>
    );
  }
}
