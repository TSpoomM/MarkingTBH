import { Component } from "react";
import cn from "@/src/core/ui/cn";
import {
  COUNT_BUTTON, COUNT_BUTTON_ACTIVE, EDITOR_FIELD, MODAL_ACTIONS, MODAL_BODY, TOGGLE_BOX, TOGGLE_COPY,
} from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import SegmentList from "./SegmentList";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import DateFormatter from "@/src/core/dates/dateFormatter";
import type { FieldSettingsModalProps } from "@/src/core/models/manage-template";

/** Per-field settings dialog: name, lock/default value, counter, date format and (for multi-section fields) the section list. */
export default class FieldSettingsModal extends Component<FieldSettingsModalProps> {
  render() {
    const {
      open, field, fieldIndex, isVerticalTable, draggingSegmentKey, onChange, onClose,
      onOpenCounterPrompt, onOpenDateFormatPrompt, onDragStart, onDragEnd, onDragOver,
    } = this.props;
    const canUseDefaultValue = !field.segments?.length && !field.locked;

    return (
      <Modal
        open={open}
        title={field.label.trim() || "แก้ไข Field"}
        subtitle="ตั้งค่ารายละเอียดของ Field นี้"
        onClose={onClose}
        footer={(
          <div className={MODAL_ACTIONS}>
            <Button type="button" variant="primary" onClick={onClose}>
              เสร็จสิ้น
            </Button>
          </div>
        )}
      >
        <div className={MODAL_BODY}>
          <article className={EDITOR_FIELD}>

            <label>
              <span>ชื่อ Field</span>
              <Input
                bare
                value={field.label}
                onChange={(event) => onChange({
                  label: event.target.value.toUpperCase(),
                  ...(field.locked ? { defaultValue: event.target.value.toUpperCase() } : {}),
                })}
              />
            </label>
            {!field.segments?.length && (
              <label className={TOGGLE_BOX}>
                <Input
                  bare
                  type="checkbox"
                  checked={field.locked === true}
                  onChange={(event) => onChange({
                    locked: event.target.checked,
                    defaultValue: event.target.checked ? field.label : undefined,
                  })}
                />
                <span className={TOGGLE_COPY}>
                  <strong>ล็อกค่าชื่อ field</strong>
                </span>
              </label>
            )}
            {canUseDefaultValue && (
              <label className={TOGGLE_BOX}>
                <Input
                  bare
                  type="checkbox"
                  checked={field.defaultValue !== undefined}
                  onChange={(event) => onChange({ defaultValue: event.target.checked ? field.defaultValue ?? "" : undefined })}
                />
                <span className={TOGGLE_COPY}>
                  <strong>ใช้ค่าเริ่มต้น</strong>
                  <small>กรอกค่าให้อัตโนมัติ</small>
                </span>
              </label>
            )}
            {canUseDefaultValue && field.defaultValue !== undefined && (
              <label className="grid content-start gap-2 [&>span]:text-sm [&>span]:font-extrabold">
                <span>ค่า default</span>
                <Input
                  bare
                  type="text"
                  inputMode={field.type === "number" || field.isCounter ? "numeric" : undefined}
                  pattern={field.type === "number" || field.isCounter ? "\\d*" : undefined}
                  value={field.defaultValue}
                  onChange={(event) => onChange({ defaultValue: event.target.value })}
                />
              </label>
            )}
            <label className={TOGGLE_BOX}>
              <Input
                bare
                type="checkbox"
                checked={field.uppercase ?? true}
                onChange={(event) => onChange({ uppercase: event.target.checked })}
              />
              <span className={TOGGLE_COPY}>
                <strong>ตัวพิมพ์ใหญ่</strong>
              </span>
            </label>
            <label className={TOGGLE_BOX}>
              <Input
                bare
                type="checkbox"
                checked={field.hideLabel === true}
                onChange={(event) => onChange({ hideLabel: event.target.checked })}
              />
              <span className={TOGGLE_COPY}>
                <strong>ไม่พิมพ์ชื่อ Field</strong>
              </span>
            </label>
            {!field.segments?.length && (
              <Button
                type="button"
                className={cn(COUNT_BUTTON, field.isCounter && COUNT_BUTTON_ACTIVE)}
                onClick={() => onOpenCounterPrompt()}
              >
                {field.isCounter ? `นับ: ${TemplateFieldUtils.counterTypeLabel(field.counterType ?? TemplateFieldUtils.inferCounterType(field))}` : "นับ"}
              </Button>
            )}
            {!field.segments?.length && !field.isCounter && (
              <label className={TOGGLE_BOX}>
                <Input
                  bare
                  type="checkbox"
                  checked={field.type === "date"}
                  onChange={(event) => onChange({
                    type: event.target.checked ? "date" : "text",
                    dateFormat: event.target.checked ? DateFormatter.normalizeFormat(field.dateFormat) : undefined,
                    placeholder: event.target.checked ? undefined : field.placeholder,
                  })}
                />
                <span className={TOGGLE_COPY}>
                  <strong>ใช้ Calendar</strong>
                </span>
              </label>
            )}
            {!field.segments?.length && field.type === "date" && (
              <Button type="button" className={COUNT_BUTTON} onClick={onOpenDateFormatPrompt}>
                {`รูปแบบวันที่: ${DateFormatter.formatDateInputValue("2026-09-02", field.dateFormat)}`}
              </Button>
            )}
            {!isVerticalTable && (
              <label className={TOGGLE_BOX}>
                <Input
                  bare
                  type="checkbox"
                  checked={field.fontScale === "xlarge"}
                  onChange={(event) => onChange({ fontScale: event.target.checked ? "xlarge" : "normal" })}
                />
                <span className={TOGGLE_COPY}>
                  <strong>ขนาดใหญ่พิเศษ</strong>
                </span>
              </label>
            )}
          </article>
          {!!field.segments?.length && (
            <SegmentList
              field={field}
              fieldIndex={fieldIndex}
              draggingSegmentKey={draggingSegmentKey}
              onChange={onChange}
              onOpenCounterPrompt={onOpenCounterPrompt}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
            />
          )}
        </div>
      </Modal>
    );
  }
}
