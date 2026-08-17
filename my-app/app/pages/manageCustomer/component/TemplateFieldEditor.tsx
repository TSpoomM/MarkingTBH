import { Component, type DragEvent } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import ConditionSelector from "./ConditionSelector";
import TemplateFieldUtils from "./TemplateFieldUtils";
import type { CounterType, TemplateField } from "@/app/types/customer";
import type { TemplateFieldEditorProps } from "@/app/types/manage-customer";

interface State {
  expanded: Record<string, boolean>;
  draggingFieldKey: string | null;
  draggingTableOrder: number | null;
  draggingSegmentKey: string | null;
}

export default class TemplateFieldEditor extends Component<TemplateFieldEditorProps, State> {
  state: State = {
    expanded: {},
    draggingFieldKey: null,
    draggingTableOrder: null,
    draggingSegmentKey: null,
  };

  private dragFieldIndex: number | null = null;
  private dragTableOrder: number | null = null;
  private dragSegment: { fieldKey: string; fieldIndex: number; index: number } | null = null;

  private toggleExpanded(key: string) {
    this.setState((previous) => ({
      expanded: { ...previous.expanded, [key]: !previous.expanded[key] },
    }));
  }

  private segmentPreview(field: TemplateField) {
    const segments = field.segments?.filter((segment) => segment.showOnSticker !== false) ?? [];
    const hasAffixes = segments.some((segment) => segment.prefix || segment.suffix);
    if (hasAffixes) {
      return segments.map((segment) => `${segment.prefix ?? ""}XXX${segment.suffix ?? ""}`).join("");
    }
    if (field.displayFormat?.trim()) {
      return segments.reduce((text, segment, index) => (
        text
          .replaceAll(`{${index + 1}}`, "XXX")
          .replaceAll(`{${segment.key}}`, "XXX")
          .replaceAll(`{${segment.label}}`, "XXX")
      ), field.displayFormat.trim()).replace(/\{[^}]+\}/g, "");
    }
    return segments.map(() => "XXX").join(" ");
  }

  private handleFieldDragStart(event: DragEvent, index: number, wrapElement: HTMLElement | null, field: TemplateField) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", field.key);
    if (wrapElement) event.dataTransfer.setDragImage(wrapElement, 16, 16);
    this.dragFieldIndex = index;
    this.setState({ draggingFieldKey: field.key });
  }

  private handleFieldDragEnd() {
    this.dragFieldIndex = null;
    this.setState({ draggingFieldKey: null });
  }

  private handleFieldDragOver(event: DragEvent, index: number, tableOrder: number) {
    if (this.dragFieldIndex === null) return;
    event.preventDefault();
    if (this.dragFieldIndex === index) return;
    const { fields, section } = this.props;
    if (section === "outside") {
      const fromOrder = fields[this.dragFieldIndex]?.stickerGroupOrder ?? 0;
      if (fromOrder !== tableOrder) return;
    }
    this.props.onMove(section, this.dragFieldIndex, index);
    this.dragFieldIndex = index;
  }

  private handleTableDragStart(event: DragEvent, tableOrder: number, headElement: Element | null) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `table-${tableOrder}`);
    if (headElement) event.dataTransfer.setDragImage(headElement, 16, 16);
    this.dragTableOrder = tableOrder;
    this.setState({ draggingTableOrder: tableOrder });
  }

  private handleTableDragEnd() {
    this.dragTableOrder = null;
    this.setState({ draggingTableOrder: null });
  }

  private handleTableDragOver(event: DragEvent, tableOrder: number) {
    if (this.dragTableOrder === null) return;
    event.preventDefault();
    if (this.dragTableOrder === tableOrder) return;
    this.props.onMoveTable?.(this.dragTableOrder, tableOrder);
    this.dragTableOrder = tableOrder;
  }

  private handleSegmentDragStart(
    event: DragEvent,
    field: TemplateField,
    fieldIndex: number,
    segmentIndex: number,
    segmentKey: string,
    cardElement: Element | null,
  ) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", segmentKey);
    if (cardElement) event.dataTransfer.setDragImage(cardElement, 16, 16);
    this.dragSegment = { fieldKey: field.key, fieldIndex, index: segmentIndex };
    this.setState({ draggingSegmentKey: `${field.key}:${segmentKey}` });
  }

  private handleSegmentDragEnd() {
    this.dragSegment = null;
    this.setState({ draggingSegmentKey: null });
  }

  private handleSegmentDragOver(event: DragEvent, field: TemplateField, segmentIndex: number) {
    if (!this.dragSegment || this.dragSegment.fieldKey !== field.key) return;
    event.preventDefault();
    if (this.dragSegment.index === segmentIndex) return;
    const segments = TemplateFieldUtils.moveItem(field.segments ?? [], this.dragSegment.index, segmentIndex);
    this.props.onChange(this.props.section, this.dragSegment.fieldIndex, { segments });
    this.dragSegment = { ...this.dragSegment, index: segmentIndex };
  }

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
    const { expanded, draggingFieldKey, draggingTableOrder, draggingSegmentKey } = this.state;

    return (
      <div className="template-editor-panel">
        <div className="template-draft-heading">
          <h3>{title}</h3>
          <span>{fields.length} field</span>
        </div>
        {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const isExpanded = expanded[field.key] ?? false;
          const countableField = TemplateFieldUtils.isCounterField(field);
          const tableOrder = field.stickerGroupOrder ?? 0;
          const previousTableOrder = fields[index - 1]?.stickerGroupOrder ?? 0;
          const nextTableOrder = fields[index + 1]?.stickerGroupOrder ?? 0;
          const showTableHeader = section === "outside" && (index === 0 || tableOrder !== previousTableOrder);
          const showTableFooter = section === "outside" && (index === fields.length - 1 || tableOrder !== nextTableOrder);
          const fieldNumber = section === "outside"
            ? fields.slice(0, index + 1).filter((item) => (item.stickerGroupOrder ?? 0) === tableOrder).length
            : index + 1;
          const isDraggingThis = draggingFieldKey === field.key;
          let wrapElement: HTMLDivElement | null = null;
          return (
            <div
              className={[
                "editor-field-wrap",
                section === "outside" ? "outside-field-wrap" : "",
                section === "outside" && !showTableHeader ? "same-table-row" : "",
                isDraggingThis ? "dragging" : "",
                isExpanded ? "expanded" : "",
              ].filter(Boolean).join(" ")}
              key={`${section}-${field.key}`}
              ref={(element) => { wrapElement = element; }}
              onDragOver={(event) => this.handleFieldDragOver(event, index, tableOrder)}
              onDrop={(event) => event.preventDefault()}
            >
              {showTableHeader && (
                <div
                  className={`outside-editor-table-head ${draggingTableOrder === tableOrder ? "dragging" : ""}`}
                  onDragOver={(event) => this.handleTableDragOver(event, tableOrder)}
                  onDrop={(event) => event.preventDefault()}
                >
                  <span
                    className="table-drag-handle"
                    draggable
                    onDragStart={(event) => this.handleTableDragStart(event, tableOrder, event.currentTarget.closest(".outside-editor-table-head"))}
                    onDragEnd={() => this.handleTableDragEnd()}
                    title="ลากเพื่อย้าย Table"
                  >
                    ⠿
                  </span>
                  <Input
                    bare
                    value={field.stickerGroup ?? `Outside ${tableOrder + 1}`}
                    onChange={(event) => onRenameTable?.(tableOrder, event.target.value)}
                  />
                  <Button type="button" onClick={() => onRemoveTable?.(tableOrder)}>
                    Delete table
                  </Button>
                </div>
              )}
              <div
                className="editor-field-summary"
                onClick={() => this.toggleExpanded(field.key)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.toggleExpanded(field.key);
                  }
                }}
              >
                <span
                  className="field-drag-handle"
                  draggable
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => this.handleFieldDragStart(event, index, wrapElement, field)}
                  onDragEnd={() => this.handleFieldDragEnd()}
                  title="ลากเพื่อย้ายตำแหน่ง Field"
                >
                  ⠿
                </span>
                <div className="editor-number">{fieldNumber}</div>
                <span className={`editor-field-summary-label ${field.label.trim() ? "" : "is-empty"}`}>
                  {field.label.trim() || "(ยังไม่ตั้งชื่อ Field)"}
                </span>
                <span className="editor-field-toggle" aria-hidden="true">{isExpanded ? "ซ่อน" : "แก้ไข"}</span>
              </div>
              {isExpanded && (
                <>
                  <article className={`editor-field ${!field.segments?.length ? "no-segments" : ""}`}>
                    <div className="editor-number editor-number-spacer" aria-hidden="true" />
                    <label>
                      <span>ชื่อ Field</span>
                      <Input bare value={field.label} onChange={(event) => onChange(section, index, { label: event.target.value })} />
                    </label>
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
                    {section === "outside" && (
                    <label className="required-toggle">
                      <Input
                        bare
                        type="checkbox"
                        checked={field.hideLabel !== true}
                        onChange={(event) => onChange(section, index, { hideLabel: !event.target.checked })}
                      />
                      <span>พิมพ์ชื่อ Field บนสติ๊กเกอร์</span>
                    </label>
                    )}
                    {section === "outside" && (
                      <label className="field-font-scale">
                        <span>ขนาดตัวอักษรบนสติ๊กเกอร์</span>
                        <Select
                          bare
                          value={field.fontScale ?? "normal"}
                          onChange={(event) => onChange(section, index, { fontScale: event.target.value as TemplateField["fontScale"] })}
                        >
                          <option value="normal">ปกติ</option>
                          <option value="xlarge">ใหญ่พิเศษ</option>
                        </Select>
                      </label>
                    )}
                    {section === "outside" && (
                      <ConditionSelector
                        value={field.condition}
                        onChange={(condition) => onChange(section, index, { condition })}
                      />
                    )}
                    <Button className="delete-field" onClick={() => onRemove(section, index)}>ลบ</Button>
                  </article>
                  {!!field.segments?.length && (
                    <div className="editor-segments-row">
                      <div className="editor-segments-title">Sections</div>
                      <div className="editor-format-preview">
                        <span>ตัวอย่างบนสติ๊กเกอร์</span>
                        <strong>{this.segmentPreview(field)}</strong>
                      </div>
                      {field.segments.map((segment, segmentIndex) => (
                        <div
                          className={`editor-segment-card ${draggingSegmentKey === `${field.key}:${segment.key}` ? "dragging" : ""}`}
                          key={`${field.key}-${segment.key}`}
                          onDragOver={(event) => this.handleSegmentDragOver(event, field, segmentIndex)}
                          onDrop={(event) => event.preventDefault()}
                        >
                          <div className="editor-segment-head">
                            <div className="editor-segment-head-left">
                              <span
                                className="segment-drag-handle"
                                draggable
                                onDragStart={(event) => this.handleSegmentDragStart(
                                  event, field, index, segmentIndex, segment.key,
                                  event.currentTarget.closest(".editor-segment-card"),
                                )}
                                onDragEnd={() => this.handleSegmentDragEnd()}
                                title="ลากเพื่อย้าย Section"
                              >
                                ⠿
                              </span>
                              <strong>Section {segmentIndex + 1}</strong>
                            </div>
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
                          <div className="editor-segment-affixes">
                            <label>
                              <span>ก่อน Section</span>
                              <Input
                                bare
                                value={segment.prefix ?? ""}
                                onChange={(event) => onChange(section, index, {
                                  displayFormat: undefined,
                                  segments: field.segments?.map((item, itemIndex) =>
                                    itemIndex === segmentIndex ? { ...item, prefix: event.target.value } : item,
                                  ),
                                })}
                                placeholder="เช่น ("
                              />
                            </label>
                            <label>
                              <span>หลัง Section</span>
                              <Input
                                bare
                                value={segment.suffix ?? ""}
                                onChange={(event) => onChange(section, index, {
                                  displayFormat: undefined,
                                  segments: field.segments?.map((item, itemIndex) =>
                                    itemIndex === segmentIndex ? { ...item, suffix: event.target.value } : item,
                                  ),
                                })}
                                placeholder="เช่น / หรือ )"
                              />
                            </label>
                          </div>
                          <div className="editor-segment-actions" aria-label={`ตั้งค่า Section ${segmentIndex + 1}`}>
                            {countableField && (
                              <Button
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
                              </Button>
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
                            <Button
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
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
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
                      </Button>
                    </div>
                  )}
                </>
              )}
              {showTableFooter && (
                <Button
                  type="button"
                  className="outside-add-row-button"
                  onClick={() => onAdd(section, tableOrder)}
                >
                  Add Row
                </Button>
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
