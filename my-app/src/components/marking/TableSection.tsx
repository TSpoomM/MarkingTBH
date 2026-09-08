"use client";

import { Component } from "react";
import EmptyState from "./EmptyState";
import CalendarInput from "@/src/components/ui/CalendarInput";
import Input from "@/src/components/ui/Input";
import SectionTitle from "./SectionTitle";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import type { TemplateField } from "@/src/core/models/template";
import type { TableSectionProps } from "@/src/core/models/marking-sticker";

export default class TableSection extends Component<TableSectionProps> {
  private isLotCounter(field: TemplateField, segment?: { counterType?: string }) {
    if (segment?.counterType) return segment.counterType === "lot" || segment.counterType === "sequence";
    if (field.counterType) return field.counterType === "lot" || field.counterType === "sequence";
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return !key.includes("pallet") && !label.includes("pallet");
  }

  render() {
    const { number, title, subtitle, fields, rows, lotStart, onChange, emptyText } = this.props;
    return (
      <section className="table-panel">
        <div className="table-heading">
          <SectionTitle number={number} title={title} subtitle={subtitle} />
          <div className="table-meta">
            <span>{fields.length} แถว</span>
            {/* <span>{rows.length} ชุดข้อมูล</span> */}
          </div>
        </div>
        {!fields.length ? (
          <EmptyState message={emptyText ?? "เลือกลูกค้าเพื่อโหลดรูปแบบช่องข้อมูล"} />
        ) : (
          <div className="vertical-records">
            {rows.map((row, rowIndex) => (
              <article className="record-card" key={rowIndex}>
                {/* <header><div><span>{String(rowIndex + 1).padStart(2, "0")}</span><b>ชุดข้อมูลสำหรับพิมพ์</b></div></header> */}
                <div className="vertical-fields">
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>
                        {field.label}
                        {field.required && <em>*</em>}
                        {field.locked && <span className="field-lock-icon" title="Locked" aria-label="Locked" />}
                      </span>
                      {field.segments?.length ? (
                        <div className="horizontal-segment-inputs">
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
