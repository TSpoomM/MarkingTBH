import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { MODAL_ACTIONS, MODAL_BODY } from "@/src/core/ui/fieldEditor";
import { CHOICE, CHOICE_LIST, CHOICE_SELECTED } from "@/src/core/ui/template";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import { ADD_FIELD_OPTIONS } from "@/src/core/templates/fieldEditorOptions";
import type { AddFieldModalProps } from "@/src/core/models/manage-template";

/** Asks which kind of field (plain, destination, section) to add. */
export default class AddFieldModal extends Component<AddFieldModalProps> {
  render() {
    const { open, section, pendingPreset, onPresetChange, onClose, onConfirm } = this.props;

    return (
      <Modal
        open={open}
        title="เพิ่ม Field"
        subtitle="เลือกชนิด Field ที่ต้องการเพิ่ม"
        onClose={onClose}
        footer={(
          <div className={MODAL_ACTIONS}>
            <Button type="button" variant="secondary" size="lg" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="button" variant="primary" onClick={onConfirm}>
              เพิ่ม Field
            </Button>
          </div>
        )}
      >
        <div className={cn(MODAL_BODY, CHOICE_LIST)}>
          {ADD_FIELD_OPTIONS.map((option) => (
            <label
              className={cn(CHOICE, pendingPreset === option.value && CHOICE_SELECTED)}
              key={option.value}
            >
              <Input
                bare
                type="radio"
                name={`${section}-add-field-preset`}
                checked={pendingPreset === option.value}
                onChange={() => onPresetChange(option.value)}
              />
              <span><b>{option.label}</b><small>{option.description}</small></span>
            </label>
          ))}
        </div>
      </Modal>
    );
  }
}
