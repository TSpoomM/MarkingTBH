import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { COUNTER_PAD_TOGGLE, COUNTER_STOP_BUTTON, MODAL_ACTIONS, MODAL_BODY, TOGGLE_BOX, TOGGLE_COPY } from "@/src/core/ui/fieldEditor";
import { CHOICE, CHOICE_LIST, CHOICE_SELECTED } from "@/src/core/ui/template";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import { COUNTER_TYPE_OPTIONS } from "@/src/core/templates/fieldEditorOptions";
import type { CounterModalProps } from "@/src/core/models/manage-template";

/** Counter setup dialog shared by plain fields and individual sections. */
export default class CounterModal extends Component<CounterModalProps> {
  render() {
    const { open, isCounting, pendingType, pendingPad4, onTypeChange, onPad4Change, onClose, onConfirm, onStop } = this.props;

    return (
      <Modal
        open={open}
        title="ตั้งค่าการนับ"
        subtitle="เลือกรูปแบบการนับเลข และรูปแบบตัวเลขที่จะแสดง"
        onClose={onClose}
        footer={(
          <div className={MODAL_ACTIONS}>
            {isCounting && (
              <Button type="button" variant="secondary" size="lg" className={COUNTER_STOP_BUTTON} onClick={onStop}>
                เลิกนับ
              </Button>
            )}
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="button" variant="primary" onClick={onConfirm}>
              ยืนยัน
            </Button>
          </div>
        )}
      >
        <div className={MODAL_BODY}>
          <div className={CHOICE_LIST}>
            {COUNTER_TYPE_OPTIONS.map((option) => (
              <label
                className={cn(CHOICE, pendingType === option.value && CHOICE_SELECTED)}
                key={option.value}
              >
                <Input
                  bare
                  type="radio"
                  name="counter-type-prompt"
                  checked={pendingType === option.value}
                  onChange={() => onTypeChange(option.value)}
                />
                <span><b>{option.label}</b><small>{option.description}</small></span>
              </label>
            ))}
          </div>
          <label className={cn(TOGGLE_BOX, COUNTER_PAD_TOGGLE)}>
            <Input
              bare
              type="checkbox"
              checked={pendingPad4}
              onChange={(event) => onPad4Change(event.target.checked)}
            />
            <span className={TOGGLE_COPY}>
              <strong>Default 4 หลัก (0001)</strong>
            </span>
          </label>
        </div>
      </Modal>
    );
  }
}
