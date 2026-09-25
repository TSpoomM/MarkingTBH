"use client";

import { Component } from "react";
import { Lock } from "lucide-react";
import EmptyState from "./EmptyState";
import Autocomplete from "@/src/components/ui/Autocomplete";
import CalendarInput from "@/src/components/ui/CalendarInput";
import Input from "@/src/components/ui/Input";
import SectionTitle from "@/src/components/ui/SectionTitle";
import { TABLE_HEADING } from "@/src/core/ui/surfaces";
import {
  LOCK_ICON, RECORD_CARD, VERTICAL_FIELDS, VERTICAL_FIELD_CALENDAR, VERTICAL_FIELD_CALENDAR_DISPLAY,
  VERTICAL_FIELD_LABEL, VERTICAL_SEGMENT_INPUTS,
} from "@/src/core/ui/table";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import DestinationRules from "@/src/core/marking/destinationRules";
import type { TableSectionProps } from "@/src/core/models/marking-sticker";

export default class TableSection extends Component<TableSectionProps> {
  /** A filled-in destination that is not in the list; an empty box is not an error here (required is checked on save). */
  private isUnknownDestination(value: string | undefined) {
    const typed = value?.trim();
    return Boolean(typed) && !DestinationRules.match(this.props.destinationOptions, typed ?? "");
  }

  render() {
    const { number, title, subtitle, fields, rows, destinationOptions, lotStart, onChange, emptyText } = this.props;
    return (
      <section className="grid min-w-0 gap-4">
        <div className={TABLE_HEADING}>
          <SectionTitle number={number} title={title} subtitle={subtitle} compact />
          <div className="flex shrink-0 flex-wrap justify-end gap-2 max-bp1050:justify-start">
            <span className="inline-flex min-h-8 items-center rounded-full bg-primary-soft px-2.5 py-[5px] text-[14px] font-extrabold text-primary-dark">{fields.length} แถว</span>
          </div>
        </div>
        {!fields.length ? (
          <EmptyState message={emptyText ?? "เลือกลูกค้าเพื่อโหลดรูปแบบช่องข้อมูล"} />
        ) : (
          <div className="grid gap-[18px] max-bp700:gap-3">
            {rows.map((row, rowIndex) => (
              <article className={RECORD_CARD} key={rowIndex}>
                <div className={VERTICAL_FIELDS}>
                  {fields.map((field) => (
                    <label className={VERTICAL_FIELD_LABEL} key={field.key}>
                      <span>
                        {field.label}
                        {field.required && <em className="ml-1 not-italic text-[#b94147]">*</em>}
                        {field.locked && <Lock className={LOCK_ICON} size={15} aria-label="Locked" />}
                      </span>
                      {field.segments?.length ? (
                        <div className={VERTICAL_SEGMENT_INPUTS}>
                          {field.segments.map((segment, segmentIndex) => (
                            <Input
                              key={`${field.key}-${segment.key}-${segmentIndex}`}
                              bare
                              type="text"
                              inputMode={segment.isCounter || segment.type === "number" ? "numeric" : undefined}
                              pattern={segment.isCounter || segment.type === "number" ? "\\d*" : undefined}
                              value={row[segment.key] ?? (segment.isCounter ? StickerFactory.previewCounterValue(field, lotStart, segment) : "")}
                              onChange={(event) => onChange(rowIndex, segment.key, event.target.value)}
                              placeholder={segment.isCounter ? `${segment.label} +1` : segment.label}
                            />
                          ))}
                        </div>
                      ) : (
                        field.type === "date" ? (
                          <CalendarInput
                            className={VERTICAL_FIELD_CALENDAR}
                            displayVariant="input"
                            displayClassName={VERTICAL_FIELD_CALENDAR_DISPLAY}
                            value={row[field.key] ?? ""}
                            dateFormat={field.dateFormat}
                            onChange={(value) => onChange(rowIndex, field.key, value)}
                            disabled={field.locked === true}
                            placeholder={field.placeholder ?? `เลือก ${field.label}`}
                          />
                        ) : DestinationRules.isDestinationField(field) ? (
                          <Autocomplete
                            bare
                            options={destinationOptions}
                            maxOptions={destinationOptions.length}
                            value={row[field.key] ?? ""}
                            onChange={(event) => onChange(rowIndex, field.key, event.target.value)}
                            disabled={field.locked === true}
                            placeholder={field.placeholder ?? `เลือก ${field.label}`}
                            aria-invalid={this.isUnknownDestination(row[field.key]) || undefined}
                            className={this.isUnknownDestination(row[field.key]) ? "!border-[#b94147] !bg-[#fff5f5]" : undefined}
                          />
                        ) : (
                          <Input
                            bare
                            type="text"
                            inputMode={field.isCounter || field.type === "number" ? "numeric" : undefined}
                            pattern={field.isCounter || field.type === "number" ? "\\d*" : undefined}
                            value={row[field.key] ?? (field.isCounter ? StickerFactory.previewCounterValue(field, lotStart) : "")}
                            onChange={(event) => onChange(rowIndex, field.key, event.target.value)}
                            disabled={field.locked === true}
                            placeholder={field.isCounter ? `${field.label} +1` : field.placeholder ?? `กรอก ${field.label}`}
                          />
                        )
                      )}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }
}
