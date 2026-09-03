import { Component, type DragEvent } from "react";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import Select from "@/src/components/ui/Select";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import DateFormatter, { DATE_PART_OPTIONS, DATE_SEPARATOR_OPTIONS } from "@/src/core/dates/dateFormatter";
import type { CounterType, DatePart, DateSeparator, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import type { TemplateFieldEditorProps } from "@/src/core/models/manage-template";

const OUTSIDE_TABLE_LAYOUT_OPTIONS: Array<{ value: StickerGroupLayout; label: string; description: string }> = [
  { value: "2x2", label: "2 x 2 แนวนอน", description: "A4 แนวนอน 4 ดวง/หน้า (ค่าเริ่มต้น)" },
  { value: "8x2", label: "8 x 2 แนวตั้ง", description: "A4 แนวตั้ง 16 ดวง/หน้า สำหรับกระดาษสติ๊กเกอร์แนวตั้ง" },
];

interface State {
  expanded: Record<string, boolean>;
  draggingFieldKey: string | null;
  draggingTableOrder: number | null;
  draggingSegmentKey: string | null;
  addTableLayoutPromptOpen: boolean;
  pendingTableLayout: StickerGroupLayout;
}

export default class TemplateFieldEditor extends Component<TemplateFieldEditorProps, State> {
  state: State = {
    expanded: {},
    draggingFieldKey: null,
    draggingTableOrder: null,
    draggingSegmentKey: null,
    addTableLayoutPromptOpen: false,
    pendingTableLayout: "2x2",
  };

  private openAddTablePrompt() {
    this.setState({ addTableLayoutPromptOpen: true, pendingTableLayout: "2x2" });
  }

  private closeAddTablePrompt() {
    this.setState({ addTableLayoutPromptOpen: false });
  }

  private confirmAddTable() {
    this.props.onAddTable?.(this.state.pendingTableLayout);
    this.closeAddTablePrompt();
  }

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
    this.props.onMove(this.props.section, this.dragFieldIndex, index, tableOrder);
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
      onChangeTableLayout,
      onRemoveTable,
    } = this.props;
    const {
      expanded, draggingFieldKey, draggingTableOrder, draggingSegmentKey,
      addTableLayoutPromptOpen, pendingTableLayout,
    } = this.state;

    return (
      <div className="template-editor-panel">
        <div className="template-draft-heading">
          <h3>{title}</h3>
          <span>{fields.length} Field</span>
        </div>
        {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const isExpanded = expanded[field.key] ?? false;
          const tableOrder = field.stickerGroupOrder ?? 0;
          const isInsideNettField = section === "inside" && field.key === "nett" && !field.segments?.length;
          const previousTableOrder = fields[index - 1]?.stickerGroupOrder ?? 0;
          const nextTableOrder = fields[index + 1]?.stickerGroupOrder ?? 0;
          const showTableHeader = section === "outside" && (index === 0 || tableOrder !== previousTableOrder);
          const showTableFooter = section === "outside" && (index === fields.length - 1 || tableOrder !== nextTableOrder);
          const fieldNumber = section === "outside"
            ? fields.slice(0, index + 1).filter((item) => (item.stickerGroupOrder ?? 0) === tableOrder).length
            : index + 1;
          const isVerticalTable = field.stickerGroupLayout === "8x2" || field.stickerGroupLayout === "4x2";
          const isDraggingThis = draggingFieldKey === field.key;
          const dateFormatConfig = DateFormatter.parseFormat(field.dateFormat);
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
                    value={field.stickerGroup ?? `นอกกรอบ ${tableOrder + 1}`}
                    onChange={(event) => onRenameTable?.(tableOrder, event.target.value)}
                  />
                  <Select
                    bare
                    aria-label="รูปแบบ Table"
                    value={field.stickerGroupLayout === "8x2" || field.stickerGroupLayout === "4x2" ? "8x2" : "2x2"}
                    onChange={(event) => onChangeTableLayout?.(tableOrder, event.target.value as StickerGroupLayout)}
                  >
                    <option value="2x2">2 × 2</option>
                    <option value="8x2">8 × 2</option>
                  </Select>
                  <Button type="button" onClick={() => onRemoveTable?.(tableOrder)}>
                    ลบ Table
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
                {field.locked && <span className="field-lock-icon" title="Locked" aria-label="Locked" />}
                <div className="editor-field-summary-actions">
                  <span className="editor-field-toggle" aria-hidden="true">{isExpanded ? "ซ่อน" : "แก้ไข"}</span>
                  <Button
                    type="button"
                    // className="delete-field summary-delete-field"
                    className="delete-field summary-delete-field"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(section, index);
                    }}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
              {isExpanded && (
                <>
                  <article className={`editor-field ${!field.segments?.length ? "no-segments" : ""}`}>
                    <div className="editor-number editor-number-spacer" aria-hidden="true" />
                    <label>
                      <span>ชื่อ Field</span>
                      <Input
                        bare
                        value={field.label}
                        onChange={(event) => onChange(section, index, {
                          label: event.target.value.toUpperCase(),
                          ...(field.locked ? { defaultValue: event.target.value.toUpperCase() } : {}),
                        })}
                      />
                    </label>
                    {!field.segments?.length && (
                      <label className="required-toggle field-lock-toggle">
                        <Input
                          bare
                          type="checkbox"
                          checked={field.locked === true}
                          onChange={(event) => onChange(section, index, {
                            locked: event.target.checked,
                            defaultValue: event.target.checked ? field.label : undefined,
                          })}
                        />
                        <span className="toggle-copy">
                          <strong>ล็อกค่าชื่อ field</strong>
                          {/* <small>FSC / ชื่อลูกค้า</small> */}
                        </span>
                      </label>
                    )}
                    {isInsideNettField && (
                      <label className="required-toggle nett-default-toggle">
                        <Input
                          bare
                          type="checkbox"
                          checked={field.defaultValue !== undefined}
                          onChange={(event) => onChange(section, index, { defaultValue: event.target.checked ? field.defaultValue ?? "1260" : undefined })}
                        />
                        <span className="toggle-copy">
                          <strong>ใช้ค่าเริ่มต้น</strong>
                          <small>กรอกค่าให้อัตโนมัติ</small>
                        </span>
                      </label>
                    )}
                    {isInsideNettField && field.defaultValue !== undefined && (
                      <label className="nett-default-value">
                        <span>ค่า default</span>
                        <Input
                          bare
                          type="number"
                          value={field.defaultValue}
                          onChange={(event) => onChange(section, index, { defaultValue: event.target.value })}
                        />
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
                        <span className="toggle-copy">
                          <strong>ตัวพิมพ์ใหญ่</strong>
                          {/* <small>แปลงข้อความอัตโนมัติ</small> */}
                        </span>
                      </label>
                    )}
                    <label className="required-toggle">
                        <Input
                          bare
                          type="checkbox"
                          checked={field.hideLabel === true}
                          onChange={(event) => onChange(section, index, { hideLabel: event.target.checked })}
                        />
                        <span className="toggle-copy">
                          <strong>ไม่พิมพ์ชื่อ Field</strong>
                          {/* <small>ไม่พิมพ์ชื่อ Field</small> */}
                        </span>
                    </label>
                    {section === "outside" && !field.segments?.length && (
                      <Button
                        type="button"
                        className={field.isCounter ? "outside-count-button active" : "outside-count-button"}
                        onClick={() => onChange(section, index, {
                          isCounter: !field.isCounter,
                          type: !field.isCounter ? "number" : "text",
                          counterType: !field.isCounter
                            ? field.counterType ?? TemplateFieldUtils.inferCounterType(field)
                            : field.counterType,
                        })}
                      >
                        นับ
                      </Button>
                    )}
                    {section === "outside" && !field.segments?.length && field.isCounter && (
                      <div className="counter-type-control outside-counter-type-control">
                        <span>นับแบบ</span>
                        <Select
                          bare
                          value={field.counterType ?? TemplateFieldUtils.inferCounterType(field)}
                          onChange={(event) => onChange(section, index, { counterType: event.target.value as CounterType })}
                          aria-label="นับแบบ"
                        >
                          <option value="lot">Lot</option>
                          <option value="pallet">Pallet</option>
                          <option value="sequence">+1 ไปเรื่อยๆ</option>
                        </Select>
                      </div>
                    )}
                    {!field.segments?.length && !field.isCounter && (
                      <label className="required-toggle field-calendar-toggle">
                        <Input
                          bare
                          type="checkbox"
                          checked={field.type === "date"}
                          onChange={(event) => onChange(section, index, {
                            type: event.target.checked ? "date" : "text",
                            dateFormat: event.target.checked ? DateFormatter.normalizeFormat(field.dateFormat) : undefined,
                            placeholder: event.target.checked ? undefined : field.placeholder,
                          })}
                        />
                        <span className="toggle-copy">
                          <strong>ใช้ Calendar</strong>
                          <small>ให้ผู้กรอกเลือกวันที่ ไม่ต้องพิมพ์เอง</small>
                        </span>
                      </label>
                    )}
                    {!field.segments?.length && field.type === "date" && (
                      <div className="calendar-format-control date-format-builder">
                        <span>รูปแบบวันที่</span>
                        <div className="date-format-builder-grid">
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
                                  onChange(section, index, {
                                    dateFormat: DateFormatter.buildFormat(parts, dateFormatConfig.separator),
                                  });
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
                              onChange={(event) => onChange(section, index, {
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
                        <small>{DateFormatter.formatDateInputValue("2026-09-02", field.dateFormat)}</small>
                      </div>
                    )}
                    {section === "outside" && !isVerticalTable && (
                      <label className="required-toggle field-font-scale">
                        <Input
                          bare
                          type="checkbox"
                          checked={field.fontScale === "xlarge"}
                          onChange={(event) => onChange(section, index, { fontScale: event.target.checked ? "xlarge" : "normal" })}
                        />
                        <span className="toggle-copy">
                          <strong>ขนาดใหญ่พิเศษ</strong>
                          {/* <small>ขยายข้อความบนสติ๊กเกอร์</small> */}
                        </span>
                      </label>
                    )}
                  </article>
                  {!!field.segments?.length && (
                    <div className="editor-segments-row">
                      <div className="editor-segments-title">Section</div>
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
                            {segment.isCounter && <span>นับ</span>}
                          </div>
                          <label className="editor-segment-name">
                            <span>ชื่อ Section</span>
                            <Input
                              bare
                              value={segment.label}
                              onChange={(event) => onChange(section, index, {
                                segments: field.segments?.map((item, itemIndex) =>
                                  itemIndex === segmentIndex ? { ...item, label: event.target.value.toUpperCase() } : item,
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
                              นับ
                            </Button>
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
                                  aria-label="นับแบบ"
                                >
                                  <option value="lot">Lot</option>
                                  <option value="pallet">Pallet</option>
                                  <option value="sequence">+1 ไปเรื่อยๆ</option>
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
                                    type: item.isCounter ? "number" : item.type ?? "text",
                                    counterType: item.isCounter
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
              {showTableFooter && !isVerticalTable && (
                <Button
                  type="button"
                  className="outside-add-row-button"
                  onClick={() => onAdd(section, tableOrder)}
                >
                  เพิ่มแถว
                </Button>
              )}
            </div>
          );
        })}
        {section === "outside" && (
          <Button className="add-field-button" onClick={() => this.openAddTablePrompt()}>
            เพิ่ม Table
          </Button>
        )}
        {section !== "outside" && (
          <Button className="add-field-button" onClick={() => onAdd(section)}>
            เพิ่ม Field
          </Button>
        )}
        {section === "outside" && onAddTable && (
          <Modal
            open={addTableLayoutPromptOpen}
            title="เลือกรูปแบบตารางนอกกรอบ"
            subtitle="เลือกรูปแบบเริ่มต้นของ Table (สามารถเปลี่ยนภายหลังได้)"
            onClose={() => this.closeAddTablePrompt()}
            footer={(
              <div className="print-export-actions">
                <Button type="button" className="print-export-secondary" onClick={() => this.closeAddTablePrompt()}>
                  ยกเลิก
                </Button>
                <Button type="button" className="export-button" onClick={() => this.confirmAddTable()}>
                  เพิ่ม Table
                </Button>
              </div>
            )}
          >
            <div className="editor-body choice-list outside-table-layout-choices">
              {OUTSIDE_TABLE_LAYOUT_OPTIONS.map((option) => (
                <label
                  className={`choice ${pendingTableLayout === option.value ? "selected" : ""}`}
                  key={option.value}
                >
                  <Input
                    bare
                    type="radio"
                    name="outside-table-layout"
                    checked={pendingTableLayout === option.value}
                    onChange={() => this.setState({ pendingTableLayout: option.value })}
                  />
                  <span><b>{option.label}</b><small>{option.description}</small></span>
                </label>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }
}
