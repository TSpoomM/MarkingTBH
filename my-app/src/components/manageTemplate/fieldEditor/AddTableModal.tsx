import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { MODAL_ACTIONS, MODAL_BODY } from "@/src/core/ui/fieldEditor";
import { CHOICE, CHOICE_LIST, CHOICE_SELECTED } from "@/src/core/ui/template";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import { OUTSIDE_TABLE_LAYOUT_OPTIONS } from "@/src/core/templates/fieldEditorOptions";
import type { AddTableModalProps } from "@/src/core/models/manage-template";

/** Asks for the starting layout (2x2 landscape or 8x2 portrait) of a new outside-frame table. */
export default class AddTableModal extends Component<AddTableModalProps> {
  render() {
    const { open, pendingLayout, onLayoutChange, onClose, onConfirm } = this.props;

    return (
      <Modal
        open={open}
        title="เลือกรูปแบบตารางนอกกรอบ"
        subtitle="เลือกรูปแบบเริ่มต้นของ Table (สามารถเปลี่ยนภายหลังได้)"
        onClose={onClose}
        footer={(
          <div className={MODAL_ACTIONS}>
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="button" variant="primary" onClick={onConfirm}>
              เพิ่ม Table
            </Button>
          </div>
        )}
      >
        <div className={cn(MODAL_BODY, CHOICE_LIST)}>
          {OUTSIDE_TABLE_LAYOUT_OPTIONS.map((option) => (
            <label
              className={cn(CHOICE, pendingLayout === option.value && CHOICE_SELECTED)}
              key={option.value}
            >
              <Input
                bare
                type="radio"
                name="outside-table-layout"
                checked={pendingLayout === option.value}
                onChange={() => onLayoutChange(option.value)}
              />
              <span><b>{option.label}</b><small>{option.description}</small></span>
            </label>
          ))}
        </div>
      </Modal>
    );
  }
}
