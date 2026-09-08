"use client";

import { Component } from "react";
import Button from "@/src/components/ui/Button";
import cn from "@/src/core/ui/cn";
import {
  ADMIN_TOP, MODE_HELP, MODE_SWITCH, MODE_SWITCH_BTN, MODE_SWITCH_BTN_CREATE_ACTIVE, MODE_SWITCH_BTN_EDIT_ACTIVE,
} from "@/src/core/ui/template";
import type { TemplateManageMode } from "@/src/core/models/manage-template";

interface TemplateModeSwitchProps {
  mode: TemplateManageMode;
  onChangeMode: (mode: TemplateManageMode) => void;
}

export default class TemplateModeSwitch extends Component<TemplateModeSwitchProps> {
  render() {
    const { mode, onChangeMode } = this.props;
    return (
      <div className={ADMIN_TOP}>
        <div className={MODE_SWITCH} aria-label="เลือกโหมดจัดการ Template">
          <Button
            type="button"
            className={cn(MODE_SWITCH_BTN, mode === "edit" && MODE_SWITCH_BTN_EDIT_ACTIVE)}
            onClick={() => onChangeMode("edit")}
          >
            แก้ไข Template
          </Button>
          <Button
            type="button"
            className={cn(MODE_SWITCH_BTN, mode === "create" && MODE_SWITCH_BTN_CREATE_ACTIVE)}
            onClick={() => onChangeMode("create")}
          >
            เพิ่ม Template
          </Button>
        </div>
        <div className={MODE_HELP}>
          <strong>
            {mode === "edit"
              ? "เลือก Tempate เดิม แล้วปรับช่องบนสติ๊กเกอร์"
              : "สร้าง Template ใหม่ แล้วกำหนดช่องที่ User ต้องกรอก"}
          </strong>
          <span>
            {mode === "edit"
              ? "เหมาะกับการแก้ Field, ลำดับ Preview และ Template ที่ใช้อยู่"
              : "ทำตามลำดับ 1 ถึง 4 แล้วกดบันทึกด้านล่าง"}
          </span>
        </div>
      </div>
    );
  }
}
