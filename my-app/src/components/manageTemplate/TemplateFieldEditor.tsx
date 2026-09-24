import { Component, type DragEvent } from "react";
import cn from "@/src/core/ui/cn";
import { ADD_FIELD_BUTTON, ADD_ROW_BUTTON, DRAFT_HEADING, EDITOR_EMPTY, EDITOR_PANEL, FIELD_WRAP, FIELD_WRAP_DRAGGING } from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import FieldTableHeader from "./fieldEditor/FieldTableHeader";
import FieldSummaryRow from "./fieldEditor/FieldSummaryRow";
import FieldSettingsModal from "./fieldEditor/FieldSettingsModal";
import DateFormatModal from "./fieldEditor/DateFormatModal";
import AddFieldModal from "./fieldEditor/AddFieldModal";
import AddTableModal from "./fieldEditor/AddTableModal";
import CounterModal from "./fieldEditor/CounterModal";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import type { CounterType, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import type { TemplateFieldEditorProps, TemplateFieldPreset } from "@/src/core/models/manage-template";

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
  addFieldPrompt: { tableOrder?: number } | null;
  pendingFieldPreset: TemplateFieldPreset;
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
    addFieldPrompt: null,
    pendingFieldPreset: "field",
  };

  private openAddFieldPrompt(tableOrder?: number) {
    this.setState({ addFieldPrompt: { tableOrder }, pendingFieldPreset: "field" });
  }

  private closeAddFieldPrompt() {
    this.setState({ addFieldPrompt: null });
  }

  private confirmAddField() {
    this.props.onAdd(this.props.section, this.state.addFieldPrompt?.tableOrder, this.state.pendingFieldPreset);
    this.closeAddFieldPrompt();
  }

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
      onRemove,
      onAddTable,
      onRenameTable,
      onChangeTableLayout,
      onRemoveTable,
    } = this.props;
    const {
      editingFieldIndex, dateFormatPromptIndex, draggingFieldKey, draggingTableOrder, draggingSegmentKey,
      addTableLayoutPromptOpen, pendingTableLayout,
      counterPromptTarget, pendingCounterType, pendingCounterPad4, addFieldPrompt, pendingFieldPreset,
    } = this.state;
    const counterPromptField = counterPromptTarget ? fields[counterPromptTarget.fieldIndex] : undefined;
    const counterPromptCurrent = counterPromptField && counterPromptTarget
      ? (counterPromptTarget.segmentIndex === undefined
        ? counterPromptField
        : counterPromptField.segments?.[counterPromptTarget.segmentIndex])
      : undefined;

    return (
      <div className={EDITOR_PANEL}>
        <div className={DRAFT_HEADING}>
          <h3>{title}</h3>
          <span>{fields.length} Field</span>
        </div>
        {!fields.length && <div className={EDITOR_EMPTY}>ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const tableOrder = field.stickerGroupOrder ?? 0;
          const previousTableOrder = fields[index - 1]?.stickerGroupOrder ?? 0;
          const nextTableOrder = fields[index + 1]?.stickerGroupOrder ?? 0;
          const showTableHeader = section === "outside" && (index === 0 || tableOrder !== previousTableOrder);
          const showTableFooter = section === "outside" && (index === fields.length - 1 || tableOrder !== nextTableOrder);
          const fieldNumber = section === "outside"
            ? fields.slice(0, index + 1).filter((item) => (item.stickerGroupOrder ?? 0) === tableOrder).length
            : index + 1;
          const isVerticalTable = field.stickerGroupLayout === "8x2" || field.stickerGroupLayout === "4x2";
          const patchField = (patch: Partial<TemplateField>) => onChange(section, index, patch);
          let wrapElement: HTMLDivElement | null = null;
          return (
            <div
              className={cn(FIELD_WRAP, draggingFieldKey === field.key && FIELD_WRAP_DRAGGING)}
              key={`${section}-${field.key}`}
              ref={(element) => { wrapElement = element; }}
              onDragOver={(event) => this.handleFieldDragOver(event, index, tableOrder)}
              onDrop={(event) => event.preventDefault()}
            >
              {showTableHeader && (
                <FieldTableHeader
                  field={field}
                  tableOrder={tableOrder}
                  isDragging={draggingTableOrder === tableOrder}
                  onDragStart={(event, headElement) => this.handleTableDragStart(event, tableOrder, headElement)}
                  onDragEnd={() => this.handleTableDragEnd()}
                  onDragOver={(event) => this.handleTableDragOver(event, tableOrder)}
                  onRename={(name) => onRenameTable?.(tableOrder, name)}
                  onChangeLayout={(layout) => onChangeTableLayout?.(tableOrder, layout)}
                  onRemove={() => onRemoveTable?.(tableOrder)}
                />
              )}
              <FieldSummaryRow
                field={field}
                fieldNumber={fieldNumber}
                onEdit={() => this.openFieldEditor(index)}
                onRemove={() => onRemove(section, index)}
                onDragStart={(event) => this.handleFieldDragStart(event, index, wrapElement, field)}
                onDragEnd={() => this.handleFieldDragEnd()}
              />
              <FieldSettingsModal
                open={editingFieldIndex === index}
                field={field}
                fieldIndex={index}
                isVerticalTable={isVerticalTable}
                draggingSegmentKey={draggingSegmentKey}
                onChange={patchField}
                onClose={() => this.closeFieldEditor()}
                onOpenCounterPrompt={(segmentIndex) => this.openCounterPrompt(index, segmentIndex)}
                onOpenDateFormatPrompt={() => this.openDateFormatPrompt(index)}
                onDragStart={(event, segmentIndex, segmentKey, cardElement) =>
                  this.handleSegmentDragStart(event, field, index, segmentIndex, segmentKey, cardElement)}
                onDragEnd={() => this.handleSegmentDragEnd()}
                onDragOver={(event, segmentIndex) => this.handleSegmentDragOver(event, field, segmentIndex)}
              />
              <DateFormatModal
                open={dateFormatPromptIndex === index}
                field={field}
                onChange={patchField}
                onClose={() => this.closeDateFormatPrompt()}
              />
              {showTableFooter && !isVerticalTable && (
                <Button
                  type="button"
                  className={ADD_ROW_BUTTON}
                  onClick={() => this.openAddFieldPrompt(tableOrder)}
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
          <Button size="md" className={ADD_FIELD_BUTTON} onClick={() => this.openAddFieldPrompt()}>
            เพิ่ม Field
          </Button>
        )}
        <AddFieldModal
          open={!!addFieldPrompt}
          section={section}
          pendingPreset={pendingFieldPreset}
          onPresetChange={(preset) => this.setState({ pendingFieldPreset: preset })}
          onClose={() => this.closeAddFieldPrompt()}
          onConfirm={() => this.confirmAddField()}
        />
        {section === "outside" && onAddTable && (
          <AddTableModal
            open={addTableLayoutPromptOpen}
            pendingLayout={pendingTableLayout}
            onLayoutChange={(layout) => this.setState({ pendingTableLayout: layout })}
            onClose={() => this.closeAddTablePrompt()}
            onConfirm={() => this.confirmAddTable()}
          />
        )}
        <CounterModal
          open={!!counterPromptTarget}
          isCounting={counterPromptCurrent?.isCounter === true}
          pendingType={pendingCounterType}
          pendingPad4={pendingCounterPad4}
          onTypeChange={(type) => this.setState({ pendingCounterType: type })}
          onPad4Change={(pad4) => this.setState({ pendingCounterPad4: pad4 })}
          onClose={() => this.closeCounterPrompt()}
          onConfirm={() => this.confirmCounterPrompt()}
          onStop={() => this.stopCounterPrompt()}
        />
      </div>
    );
  }
}
