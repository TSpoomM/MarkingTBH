import { Component } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import ConditionSelector from "./ConditionSelector";
import TemplateFieldUtils from "./TemplateFieldUtils";
import type { CounterType, TemplateField } from "@/app/types/customer";
import type { TemplateFieldEditorProps } from "@/app/types/manage-customer";

export default class TemplateFieldEditor extends Component<TemplateFieldEditorProps> {
  render() {
    const {
      title,
      section,
      fields,
      onChange,
      onAdd,
      onRemove,
      onAddTable,
      onRenameTable,
      onRemoveTable,
    } = this.props;

    return (
      <div className="template-editor-panel">
        <div className="template-draft-heading">
          <h3>{title}</h3>
          <span>{fields.length} field</span>
        </div>
        {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const countableField = TemplateFieldUtils.isCounterField(field);
          const tableOrder = field.stickerGroupOrder ?? 0;
          const previousTableOrder = fields[index - 1]?.stickerGroupOrder ?? 0;
          const nextTableOrder = fields[index + 1]?.stickerGroupOrder ?? 0;
          const showTableHeader = section === "outside" && (index === 0 || tableOrder !== previousTableOrder);
          const showTableFooter = section === "outside" && (index === fields.length - 1 || tableOrder !== nextTableOrder);
          const fieldNumber = section === "outside"
            ? fields.slice(0, index + 1).filter((item) => (item.stickerGroupOrder ?? 0) === tableOrder).length
            : index + 1;
          return (
            <div
              className={`editor-field-wrap ${section === "outside" ? "outside-field-wrap" : ""} ${section === "outside" && !showTableHeader ? "same-table-row" : ""}`}
              key={`${section}-${field.key}-${index}`}
            >
              {showTableHeader && (
                <div className="outside-editor-table-head">
                  <span>{tableOrder + 1}</span>
                  <Input
                    bare
                    value={field.stickerGroup ?? `Outside ${tableOrder + 1}`}
                    onChange={(event) => onRenameTable?.(tableOrder, event.target.value)}
                  />
                  <button type="button" onClick={() => onRemoveTable?.(tableOrder)}>
                    Delete table
                  </button>
                </div>
              )}
              <article className="editor-field">
                <div className="editor-number">{fieldNumber}</div>
                <label>
                  <span>ชื่อ Field</span>
                  <Input bare value={field.label} onChange={(event) => onChange(section, index, { label: event.target.value })} />
                </label>
                <label>
                  <span>ชนิดข้อมูล</span>
                  <Select
                    bare
                    value={field.type}
                    onChange={(event) => onChange(section, index, { type: event.target.value as TemplateField["type"] })}
                  >
                    <option value="text">ข้อความ</option>
                    <option value="number">ตัวเลข</option>
                    <option value="date">วันที่</option>
                    <option value="textarea">ข้อความหลายบรรทัด</option>
                  </Select>
                </label>
                {section === "outside" && (
                  <label className="required-toggle">
                    <Input
                      bare
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) => onChange(section, index, { required: event.target.checked })}
                    />
                    <span>บังคับกรอก</span>
                  </label>
                )}
                {section === "outside" && (
                  <label className="required-toggle">
                    <Input
                      bare
                      type="checkbox"
                      checked={field.uppercase ?? true}
                      onChange={(event) => onChange(section, index, { uppercase: event.target.checked })}
                    />
                    <span>Uppercase</span>
                  </label>
                )}
                <label className="field-font-scale">
                  <span>ขนาดตัวอักษรบนสติ๊กเกอร์</span>
                  <Select
                    bare
                    value={field.fontScale ?? "normal"}
                    onChange={(event) => onChange(section, index, { fontScale: event.target.value as TemplateField["fontScale"] })}
                  >
                    <option value="normal">ปกติ</option>
                    <option value="large">ใหญ่</option>
                    <option value="xlarge">ใหญ่พิเศษ</option>
                  </Select>
                </label>
                {section === "outside" && (
                  <ConditionSelector
                    value={field.condition}
                    disabled={!field.required}
                    onChange={(condition) => onChange(section, index, { condition })}
                  />
                )}
                <Button className="delete-field" onClick={() => onRemove(section, index)}>ลบ</Button>
              </article>
              {!!field.segments?.length && (
                <div className="editor-segments-row">
                  <div className="editor-segments-title">Sections</div>
                  {field.segments.map((segment, segmentIndex) => (
                    <div className="editor-segment-card" key={`${field.key}-${segment.key}-${segmentIndex}`}>
                      <div className="editor-segment-head">
                        <strong>Section {segmentIndex + 1}</strong>
                        {segment.isCounter && <span>Count</span>}
                      </div>
                      <label className="editor-segment-name">
                        <span>ชื่อ Section</span>
                        <Input
                          bare
                          value={segment.label}
                          onChange={(event) => onChange(section, index, {
                            segments: field.segments?.map((item, itemIndex) =>
                              itemIndex === segmentIndex ? { ...item, label: event.target.value } : item,
                            ),
                          })}
                        />
                      </label>
                      <div className="editor-segment-actions" aria-label={`ตั้งค่า Section ${segmentIndex + 1}`}>
                        {countableField && (
                          <button
                            type="button"
                            className={segment.isCounter ? "count-segment active" : "count-segment"}
                            onClick={() => onChange(section, index, {
                              segments: field.segments?.map((item, itemIndex) => ({
                                ...item,
                                isCounter: itemIndex === segmentIndex ? !item.isCounter : item.isCounter,
                                type: itemIndex === segmentIndex && !item.isCounter ? "number" : item.type ?? "text",
                                counterType: itemIndex === segmentIndex && !item.isCounter
                                  ? item.counterType ?? TemplateFieldUtils.inferCounterType(field)
                                  : item.counterType,
                              })),
                            })}
                          >
                            Count
                          </button>
                        )}
                        {segment.isCounter && (
                          <label className="counter-type-control">
                            <span>นับแบบ</span>
                            <Select
                              bare
                              value={segment.counterType ?? TemplateFieldUtils.inferCounterType(field)}
                              onChange={(event) => onChange(section, index, {
                                segments: field.segments?.map((item, itemIndex) =>
                                  itemIndex === segmentIndex
                                    ? { ...item, counterType: event.target.value as CounterType }
                                    : item,
                                ),
                              })}
                              aria-label="Counter type"
                            >
                              <option value="lot">Lot</option>
                              <option value="pallet">Pallet</option>
                            </Select>
                          </label>
                        )}
                        <button
                          type="button"
                          disabled={(field.segments?.length ?? 0) <= 1}
                          onClick={() => {
                            const segments = field.segments?.filter((_, itemIndex) => itemIndex !== segmentIndex) ?? [];
                            onChange(section, index, {
                              segments: segments.map((item) => ({
                                ...item,
                                type: countableField && item.isCounter ? "number" : item.type ?? "text",
                                counterType: countableField && item.isCounter
                                  ? item.counterType ?? TemplateFieldUtils.inferCounterType(field)
                                  : item.counterType,
                              })),
                            });
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-segment-button"
                    onClick={() => onChange(section, index, {
                      segments: [
                        ...(field.segments ?? []),
                        {
                          key: `${field.key}_${TemplateFieldUtils.uid()}`,
                          label: `Section ${(field.segments?.length ?? 0) + 1}`,
                          type: "text",
                          showOnSticker: true,
                          stickerOrder: (field.stickerOrder ?? index) * 10 + (field.segments?.length ?? 0),
                          isCounter: false,
                          counterType: TemplateFieldUtils.inferCounterType(field),
                        },
                      ],
                    })}
                  >
                    +1
                  </button>
                </div>
              )}
              {showTableFooter && (
                <button
                  type="button"
                  className="outside-add-row-button"
                  onClick={() => onAdd(section, tableOrder)}
                >
                  Add Row
                </button>
              )}
            </div>
          );
        })}
        {section === "outside" && (
          <Button className="add-field-button" onClick={onAddTable}>
            Add Table
          </Button>
        )}
        {section !== "outside" && (
        <Button className="add-field-button" onClick={() => onAdd(section)}>
          เพิ่ม Field
        </Button>
        )}
      </div>
    );
  }
}
