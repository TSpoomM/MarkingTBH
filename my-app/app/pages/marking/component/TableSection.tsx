"use client";

import { Component } from "react";
import EmptyState from "./EmptyState";
import Input from "@/app/components/Input";
import SectionTitle from "./SectionTitle";
import StickerFactory from "./StickerFactory";
import type { TemplateField } from "@/app/types/customer";
import type { TableSectionProps } from "@/app/types/marking-sticker";

export default class TableSection extends Component<TableSectionProps> {
  private isLotCounter(field: TemplateField, segment?: { counterType?: string }) {
    if (segment?.counterType) return segment.counterType === "lot";
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return !key.includes("pallet") && !label.includes("pallet");
  }

  private conditionText(field: TemplateField) {
    return [
      field.condition?.stickerType && `Type = ${field.condition.stickerType}`,
      field.condition?.stickerOther && `Other = ${field.condition.stickerOther}`,
    ].filter(Boolean).join(", ");
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
                        {field.required && this.conditionText(field) && <small>บังคับเมื่อ {this.conditionText(field)}</small>}
                      </span>
                      {field.segments?.length ? (
                        <div className="horizontal-segment-inputs">
                          {field.segments.map((segment, segmentIndex) => (
                            <Input
                              key={`${field.key}-${segment.key}-${segmentIndex}`}
                              bare
                              type="text"
                              inputMode={segment.isCounter ? "numeric" : undefined}
                              value={row[segment.key] ?? (segment.isCounter ? StickerFactory.previewCounterValue(field, lotStart) : "")}
                              onChange={(event) => onChange(rowIndex, segment.key, event.target.value)}
                              onBlur={segment.isCounter && this.isLotCounter(field, segment) ? (event) => {
                                const raw = event.target.value;
                                if (!/^\d+$/.test(raw)) return;
                                const padded = raw.padStart(StickerFactory.DEFAULT_COUNTER_DIGITS, "0");
                                if (padded !== raw) onChange(rowIndex, segment.key, padded);
                              } : undefined}
                              placeholder={segment.isCounter ? "+1" : segment.label}
                            />
                          ))}
                        </div>
                      ) : (
                        <Input
                          bare
                          type={field.type === "textarea" ? "text" : field.type}
                          value={row[field.key] ?? ""}
                          onChange={(event) => onChange(rowIndex, field.key, event.target.value)}
                          placeholder={field.placeholder ?? `กรอก ${field.label}`}
                        />
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
