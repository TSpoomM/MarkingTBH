import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { DATE_FORMAT_GRID, MODAL_ACTIONS, MODAL_BODY } from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import Select from "@/src/components/ui/Select";
import DateFormatter, { DATE_PART_OPTIONS, DATE_SEPARATOR_OPTIONS } from "@/src/core/dates/dateFormatter";
import type { DatePart, DateSeparator } from "@/src/core/models/template";
import type { DateFormatModalProps } from "@/src/core/models/manage-template";

/** Dialog for composing a date field's three-part format and separator. */
export default class DateFormatModal extends Component<DateFormatModalProps> {
  render() {
    const { open, field, onChange, onClose } = this.props;
    const dateFormatConfig = DateFormatter.parseFormat(field.dateFormat);

    return (
      <Modal
        open={open}
        className="w-[min(1050px,100%)] overflow-visible"
        title="รูปแบบวันที่"
        subtitle={`ตัวอย่าง: ${DateFormatter.formatDateInputValue("2026-09-02", field.dateFormat)}`}
        onClose={onClose}
        footer={(
          <div className={MODAL_ACTIONS}>
            <Button type="button" variant="primary" onClick={onClose}>
              เสร็จสิ้น
            </Button>
          </div>
        )}
      >
        <div className={cn(MODAL_BODY, "content-start overflow-visible pb-10")}>
          <div className={DATE_FORMAT_GRID}>
            {[0, 1, 2].map((slot) => (
              <label key={`${field.key}-date-part-${slot}`}>
                <span>{`ช่อง ${slot + 1}`}</span>
                <Select
                  bare
                  value={dateFormatConfig.parts[slot]}
                  onChange={(event) => {
                    const parts = DateFormatter.ensureUniquePart(
                      dateFormatConfig.parts,
                      slot,
                      event.target.value as DatePart,
                    );
                    onChange({ dateFormat: DateFormatter.buildFormat(parts, dateFormatConfig.separator) });
                  }}
                >
                  {DATE_PART_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </Select>
              </label>
            ))}
            <label>
              <span>คั่นด้วย</span>
              <Select
                bare
                value={dateFormatConfig.separator}
                onChange={(event) => onChange({
                  dateFormat: DateFormatter.buildFormat(
                    dateFormatConfig.parts,
                    event.target.value as DateSeparator,
                  ),
                })}
              >
                {DATE_SEPARATOR_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </Select>
            </label>
          </div>
        </div>
      </Modal>
    );
  }
}
