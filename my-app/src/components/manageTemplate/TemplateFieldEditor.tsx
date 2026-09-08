import { Component, type DragEvent } from "react";
import { GripVertical, Lock } from "lucide-react";
import cn from "@/src/core/ui/cn";
import { LOCK_ICON } from "@/src/core/ui/table";
import { CHOICE, CHOICE_LIST, CHOICE_SELECTED } from "@/src/core/ui/template";
import {
  ADD_FIELD_BUTTON, ADD_ROW_BUTTON, ADD_SEGMENT, COUNTER_PAD_TOGGLE, COUNTER_STOP_BUTTON,
  COUNT_BUTTON, COUNT_BUTTON_ACTIVE, COUNT_SEGMENT, COUNT_SEGMENT_ACTIVE, DATE_FORMAT_GRID,
  DRAFT_HEADING, DRAG_HANDLE, DRAG_HANDLE_SEGMENT, EDITOR_EMPTY, EDITOR_FIELD, EDITOR_NUMBER,
  EDITOR_PANEL, FIELD_SUMMARY, FIELD_WRAP, FIELD_WRAP_DRAGGING, FORMAT_PREVIEW, MODAL_ACTIONS,
  MODAL_BODY, SEGMENTS_ROW, SEGMENTS_TITLE, SEGMENT_ACTIONS, SEGMENT_AFFIXES, SEGMENT_CARD,
  SEGMENT_CARD_DRAGGING, SEGMENT_HEAD, SEGMENT_HEAD_LEFT, SEGMENT_NAME, SUMMARY_ACTIONS,
  SUMMARY_DELETE, SUMMARY_LABEL, SUMMARY_LABEL_EMPTY, SUMMARY_TOGGLE, TABLE_HEAD, TOGGLE_BOX,
  TOGGLE_COPY,
} from "@/src/core/ui/fieldEditor";
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

const COUNTER_TYPE_OPTIONS: Array<{ value: CounterType; label: string; description: string }> = [
  { value: "lot", label: "Lot", description: "นับตามเลข Lot ของรอบพิมพ์" },
  { value: "pallet", label: "Pallet", description: "นับตามลำดับ Pallet ในแต่ละ Lot" },
  { value: "sequence", label: "+1 ไปเรื่อยๆ", description: "นับต่อเนื่องไปเรื่อยๆ ไม่อิงกับ Lot หรือ Pallet" },
];

interface CounterPromptTarget {
  fieldIndex: number;
  segmentIndex?: number;
}

interface State {
  editingFieldIndex: number | null;
  dateFormatPromptIndex: number | null;
  draggingFieldKey: string | null;
  draggingTableOrder: number | null;
  draggingSegmentKey: string | null;
  addTableLayoutPromptOpen: boolean;
  pendingTableLayout: StickerGroupLayout;
  counterPromptTarget: CounterPromptTarget | null;
  pendingCounterType: CounterType;
  pendingCounterPad4: boolean;
}

export default class TemplateFieldEditor extends Component<TemplateFieldEditorProps, State> {
  state: State = {
    editingFieldIndex: null,
    dateFormatPromptIndex: null,
    draggingFieldKey: null,
    draggingTableOrder: null,
    draggingSegmentKey: null,
    addTableLayoutPromptOpen: false,
    pendingTableLayout: "2x2",
    counterPromptTarget: null,
    pendingCounterType: "lot",
    pendingCounterPad4: false,
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

  private openCounterPrompt(fieldIndex: number, segmentIndex?: number) {
    const field = this.props.fields[fieldIndex];
    const current = segmentIndex === undefined ? field : field.segments?.[segmentIndex];
    this.setState({
      counterPromptTarget: { fieldIndex, segmentIndex },
      pendingCounterType: current?.counterType ?? TemplateFieldUtils.inferCounterType(field),
      pendingCounterPad4: current?.counterPad4 === true,
    });
  }

  private closeCounterPrompt() {
    this.setState({ counterPromptTarget: null });
  }

  private confirmCounterPrompt() {
    const { counterPromptTarget, pendingCounterType, pendingCounterPad4 } = this.state;
    if (!counterPromptTarget) return;
    const { fieldIndex, segmentIndex } = counterPromptTarget;
    const field = this.props.fields[fieldIndex];
    if (segmentIndex === undefined) {
      this.props.onChange(this.props.section, fieldIndex, {
        isCounter: true,
        type: "number",
        counterType: pendingCounterType,
        counterPad4: pendingCounterPad4,
      });
    } else {
      this.props.onChange(this.props.section, fieldIndex, {
        segments: field.segments?.map((item, itemIndex) => (
          itemIndex === segmentIndex
            ? { ...item, isCounter: true, type: "number" as const, counterType: pendingCounterType, counterPad4: pendingCounterPad4 }
            : item
        )),
      });
    }
    this.closeCounterPrompt();
  }

  private stopCounterPrompt() {
    const { counterPromptTarget } = this.state;
    if (!counterPromptTarget) return;
    const { fieldIndex, segmentIndex } = counterPromptTarget;
    const field = this.props.fields[fieldIndex];
    if (segmentIndex === undefined) {
      this.props.onChange(this.props.section, fieldIndex, { isCounter: false, type: "text" });
    } else {
      this.props.onChange(this.props.section, fieldIndex, {
        segments: field.segments?.map((item, itemIndex) => (
          itemIndex === segmentIndex ? { ...item, isCounter: false, type: "text" as const } : item
        )),
      });
    }
    this.closeCounterPrompt();
  }

  private dragFieldIndex: number | null = null;
  private dragTableOrder: number | null = null;
  private dragSegment: { fieldKey: string; fieldIndex: number; index: number } | null = null;

  private openFieldEditor(index: number) {
    this.setState({ editingFieldIndex: index });
  }

  private closeFieldEditor() {
    this.setState({ editingFieldIndex: null });
  }

  private openDateFormatPrompt(index: number) {
    this.setState({ dateFormatPromptIndex: index });
  }

  private closeDateFormatPrompt() {
    this.setState({ dateFormatPromptIndex: null });
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
      editingFieldIndex, dateFormatPromptIndex, draggingFieldKey, draggingTableOrder, draggingSegmentKey,
      addTableLayoutPromptOpen, pendingTableLayout,
      counterPromptTarget, pendingCounterType, pendingCounterPad4,
    } = this.state;
    const counterPromptField = counterPromptTarget ? fields[counterPromptTarget.fieldIndex] : undefined;
    const counterPromptCurrent = counterPromptField && counterPromptTarget
      ? (counterPromptTarget.segmentIndex === undefined
        ? counterPromptField
        : counterPromptField.segments?.[counterPromptTarget.segmentIndex])
      : undefined;
    const counterPromptIsCounting = counterPromptCurrent?.isCounter === true;

    return (
      <div className={EDITOR_PANEL}>
        <div className={DRAFT_HEADING}>
          <h3>{title}</h3>
          <span>{fields.length} Field</span>
        </div>
        {!fields.length && <div className={EDITOR_EMPTY}>ยังไม่มี Field</div>}
        {fields.map((field, index) => {
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
              className={cn(FIELD_WRAP, isDraggingThis && FIELD_WRAP_DRAGGING)}
              key={`${section}-${field.key}`}
              ref={(element) => { wrapElement = element; }}
              onDragOver={(event) => this.handleFieldDragOver(event, index, tableOrder)}
              onDrop={(event) => event.preventDefault()}
            >
              {showTableHeader && (
                <div
                  data-table-head
                  className={cn(TABLE_HEAD, draggingTableOrder === tableOrder && FIELD_WRAP_DRAGGING)}
                  onDragOver={(event) => this.handleTableDragOver(event, tableOrder)}
                  onDrop={(event) => event.preventDefault()}
                >
                  <span
                    className={DRAG_HANDLE}
                    draggable
                    onDragStart={(event) => this.handleTableDragStart(event, tableOrder, event.currentTarget.closest("[data-table-head]"))}
                    onDragEnd={() => this.handleTableDragEnd()}
                    title="ลากเพื่อย้าย Table"
                  >
                    <GripVertical size={16} />
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
                className={FIELD_SUMMARY}
                onClick={() => this.openFieldEditor(index)}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.openFieldEditor(index);
                  }
                }}
              >
                <span
                  className={DRAG_HANDLE}
                  draggable
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => this.handleFieldDragStart(event, index, wrapElement, field)}
                  onDragEnd={() => this.handleFieldDragEnd()}
                  title="ลากเพื่อย้ายตำแหน่ง Field"
                >
                  <GripVertical size={16} />
                </span>
                <div className={EDITOR_NUMBER}>{fieldNumber}</div>
                <span className={cn(SUMMARY_LABEL, !field.label.trim() && SUMMARY_LABEL_EMPTY)}>
                  {field.label.trim() || "(ยังไม่ตั้งชื่อ Field)"}
                </span>
                {field.locked && <Lock className={LOCK_ICON} size={15} aria-label="Locked" />}
                <div className={SUMMARY_ACTIONS}>
                  <Button
                    type="button"
                    className={SUMMARY_TOGGLE}
                    onClick={(event) => {
                      event.stopPropagation();
                      this.openFieldEditor(index);
                    }}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    type="button"
                    className={SUMMARY_DELETE}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemove(section, index);
                    }}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
              <Modal
                open={editingFieldIndex === index}
                title={field.label.trim() || "แก้ไข Field"}
                subtitle="ตั้งค่ารายละเอียดของ Field นี้"
                onClose={() => this.closeFieldEditor()}
                footer={(
                  <div className={MODAL_ACTIONS}>
                    <Button type="button" variant="primary" onClick={() => this.closeFieldEditor()}>
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
                        onChange={(event) => onChange(section, index, {
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
                          onChange={(event) => onChange(section, index, {
                            locked: event.target.checked,
                            defaultValue: event.target.checked ? field.label : undefined,
                          })}
                        />
                        <span className={TOGGLE_COPY}>
                          <strong>ล็อกค่าชื่อ field</strong>
                        </span>
                      </label>
                    )}
                    {isInsideNettField && (
                      <label className={TOGGLE_BOX}>
                        <Input
                          bare
                          type="checkbox"
                          checked={field.defaultValue !== undefined}
                          onChange={(event) => onChange(section, index, { defaultValue: event.target.checked ? field.defaultValue ?? "1260" : undefined })}
                        />
                        <span className={TOGGLE_COPY}>
                          <strong>ใช้ค่าเริ่มต้น</strong>
                          <small>กรอกค่าให้อัตโนมัติ</small>
                        </span>
                      </label>
                    )}
                    {isInsideNettField && field.defaultValue !== undefined && (
                      <label className="grid content-start gap-2 [&>span]:text-sm [&>span]:font-extrabold">
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
                      <label className={TOGGLE_BOX}>
                        <Input
                          bare
                          type="checkbox"
                          checked={field.uppercase ?? true}
                          onChange={(event) => onChange(section, index, { uppercase: event.target.checked })}
                        />
                        <span className={TOGGLE_COPY}>
                          <strong>ตัวพิมพ์ใหญ่</strong>
                        </span>
                      </label>
                    )}
                    <label className={TOGGLE_BOX}>
                      <Input
                        bare
                        type="checkbox"
                        checked={field.hideLabel === true}
                        onChange={(event) => onChange(section, index, { hideLabel: event.target.checked })}
                      />
                      <span className={TOGGLE_COPY}>
                        <strong>ไม่พิมพ์ชื่อ Field</strong>
                      </span>
                    </label>
                    {section === "outside" && !field.segments?.length && (
                      <Button
                        type="button"
                        className={cn(COUNT_BUTTON, field.isCounter && COUNT_BUTTON_ACTIVE)}
                        onClick={() => this.openCounterPrompt(index)}
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
                          onChange={(event) => onChange(section, index, {
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
                      <Button
                        type="button"
                        className={COUNT_BUTTON}
                        onClick={() => this.openDateFormatPrompt(index)}
                      >
                        {`รูปแบบวันที่: ${DateFormatter.formatDateInputValue("2026-09-02", field.dateFormat)}`}
                      </Button>
                    )}
                    {section === "outside" && !isVerticalTable && (
                      <label className={TOGGLE_BOX}>
                        <Input
                          bare
                          type="checkbox"
                          checked={field.fontScale === "xlarge"}
                          onChange={(event) => onChange(section, index, { fontScale: event.target.checked ? "xlarge" : "normal" })}
                        />
                        <span className={TOGGLE_COPY}>
                          <strong>ขนาดใหญ่พิเศษ</strong>
                        </span>
                      </label>
                    )}
                  </article>
                  {!!field.segments?.length && (
                    <div className={SEGMENTS_ROW}>
                      <div className={SEGMENTS_TITLE}>Section</div>
                      <div className={FORMAT_PREVIEW}>
                        <span>ตัวอย่างบนสติ๊กเกอร์</span>
                        <strong>{this.segmentPreview(field)}</strong>
                      </div>
                      {field.segments.map((segment, segmentIndex) => (
                        <div
                          data-segment-card
                          className={cn(SEGMENT_CARD, draggingSegmentKey === `${field.key}:${segment.key}` && SEGMENT_CARD_DRAGGING)}
                          key={`${field.key}-${segment.key}`}
                          onDragOver={(event) => this.handleSegmentDragOver(event, field, segmentIndex)}
                          onDrop={(event) => event.preventDefault()}
                        >
                          <div className={SEGMENT_HEAD}>
                            <div className={SEGMENT_HEAD_LEFT}>
                              <span
                                className={cn(DRAG_HANDLE, DRAG_HANDLE_SEGMENT)}
                                draggable
                                onDragStart={(event) => this.handleSegmentDragStart(
                                  event, field, index, segmentIndex, segment.key,
                                  event.currentTarget.closest("[data-segment-card]"),
                                )}
                                onDragEnd={() => this.handleSegmentDragEnd()}
                                title="ลากเพื่อย้าย Section"
                              >
                                <GripVertical size={16} />
                              </span>
                              <strong>Section {segmentIndex + 1}</strong>
                            </div>
                            {segment.isCounter && <span>นับ</span>}
                          </div>
                          <label className={SEGMENT_NAME}>
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
                          <div className={SEGMENT_AFFIXES}>
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
                          <div className={SEGMENT_ACTIONS} aria-label={`ตั้งค่า Section ${segmentIndex + 1}`}>
                            <Button
                              type="button"
                              className={cn(COUNT_SEGMENT, segment.isCounter && COUNT_SEGMENT_ACTIVE)}
                              onClick={() => this.openCounterPrompt(index, segmentIndex)}
                            >
                              {segment.isCounter ? `นับ: ${TemplateFieldUtils.counterTypeLabel(segment.counterType ?? TemplateFieldUtils.inferCounterType(field))}` : "นับ"}
                            </Button>
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
                        className={ADD_SEGMENT}
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
                </div>
              </Modal>
              <Modal
                open={dateFormatPromptIndex === index}
                className="w-[min(1050px,100%)] overflow-visible"
                title="รูปแบบวันที่"
                subtitle={`ตัวอย่าง: ${DateFormatter.formatDateInputValue("2026-09-02", field.dateFormat)}`}
                onClose={() => this.closeDateFormatPrompt()}
                footer={(
                  <div className={MODAL_ACTIONS}>
                    <Button type="button" variant="primary" onClick={() => this.closeDateFormatPrompt()}>
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
                </div>
              </Modal>
              {showTableFooter && !isVerticalTable && (
                <Button
                  type="button"
                  className={ADD_ROW_BUTTON}
                  onClick={() => onAdd(section, tableOrder)}
                >
                  เพิ่มแถว
                </Button>
              )}
            </div>
          );
        })}
        {section === "outside" && (
          <Button size="md" className={ADD_FIELD_BUTTON} onClick={() => this.openAddTablePrompt()}>
            เพิ่ม Table
          </Button>
        )}
        {section !== "outside" && (
          <Button size="md" className={ADD_FIELD_BUTTON} onClick={() => onAdd(section)}>
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
              <div className={MODAL_ACTIONS}>
                <Button type="button" variant="secondary" size="lg" onClick={() => this.closeAddTablePrompt()}>
                  ยกเลิก
                </Button>
                <Button type="button" variant="primary" onClick={() => this.confirmAddTable()}>
                  เพิ่ม Table
                </Button>
              </div>
            )}
          >
            <div className={cn(MODAL_BODY, CHOICE_LIST)}>
              {OUTSIDE_TABLE_LAYOUT_OPTIONS.map((option) => (
                <label
                  className={cn(CHOICE, pendingTableLayout === option.value && CHOICE_SELECTED)}
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
        <Modal
          open={!!counterPromptTarget}
          title="ตั้งค่าการนับ"
          subtitle="เลือกรูปแบบการนับเลข และรูปแบบตัวเลขที่จะแสดง"
          onClose={() => this.closeCounterPrompt()}
          footer={(
            <div className={MODAL_ACTIONS}>
              {counterPromptIsCounting && (
                <Button type="button" variant="secondary" size="lg" className={COUNTER_STOP_BUTTON} onClick={() => this.stopCounterPrompt()}>
                  เลิกนับ
                </Button>
              )}
              <Button type="button" variant="secondary" size="lg" onClick={() => this.closeCounterPrompt()}>
                ยกเลิก
              </Button>
              <Button type="button" variant="primary" onClick={() => this.confirmCounterPrompt()}>
                ยืนยัน
              </Button>
            </div>
          )}
        >
          <div className={MODAL_BODY}>
            <div className={CHOICE_LIST}>
              {COUNTER_TYPE_OPTIONS.map((option) => (
                <label
                  className={cn(CHOICE, pendingCounterType === option.value && CHOICE_SELECTED)}
                  key={option.value}
                >
                  <Input
                    bare
                    type="radio"
                    name="counter-type-prompt"
                    checked={pendingCounterType === option.value}
                    onChange={() => this.setState({ pendingCounterType: option.value })}
                  />
                  <span><b>{option.label}</b><small>{option.description}</small></span>
                </label>
              ))}
            </div>
            <label className={cn(TOGGLE_BOX, COUNTER_PAD_TOGGLE)}>
              <Input
                bare
                type="checkbox"
                checked={pendingCounterPad4}
                onChange={(event) => this.setState({ pendingCounterPad4: event.target.checked })}
              />
              <span className={TOGGLE_COPY}>
                <strong>Default 4 หลัก (0001)</strong>
              </span>
            </label>
          </div>
        </Modal>
      </div>
    );
  }
}
