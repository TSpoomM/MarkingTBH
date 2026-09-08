"use client";

import { Component } from "react";
import { Lock } from "lucide-react";
import EmptyState from "./EmptyState";
import CalendarInput from "@/src/components/ui/CalendarInput";
import Input from "@/src/components/ui/Input";
import SectionTitle from "@/src/components/ui/SectionTitle";
import { TABLE_HEADING } from "@/src/core/ui/surfaces";
import {
  LOCK_ICON, RECORD_CARD, VERTICAL_FIELDS, VERTICAL_FIELD_CALENDAR, VERTICAL_FIELD_LABEL, VERTICAL_SEGMENT_INPUTS,
} from "@/src/core/ui/table";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import type { TableSectionProps } from "@/src/core/models/marking-sticker";

export default class TableSection extends Component<TableSectionProps> {
  render() {
    const { number, title, subtitle, fields, rows, lotStart, onChange, emptyText } = this.props;
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
                              inputMode={segment.isCounter ? "numeric" : undefined}
                              pattern={segment.isCounter ? "\\d*" : undefined}
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
                            value={row[field.key] ?? ""}
                            dateFormat={field.dateFormat}
                            onChange={(value) => onChange(rowIndex, field.key, value)}
                            disabled={field.locked === true}
                            placeholder={field.placeholder ?? `เลือก ${field.label}`}
                          />
                        ) : (
                          <Input
                            bare
                            type={field.isCounter || field.type === "textarea" ? "text" : field.type}
                            inputMode={field.isCounter ? "numeric" : undefined}
                            pattern={field.isCounter ? "\\d*" : undefined}
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
