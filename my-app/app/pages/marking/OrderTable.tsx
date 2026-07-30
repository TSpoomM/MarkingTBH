"use client";

import { Component } from "react";
import type { MarkingContent } from "@/app/types/marking";
import EmptyState from "./EmptyState";
import { SectionTitle } from "./FilterPanel";
import Button from "@/app/components/Button";
import Card from "@/app/components/Card";
import Input from "@/app/components/Input";
import Modal from "@/app/components/Modal";
import Select from "@/app/components/Select";
import MarkingComponent from "./MarkingComponent";
import { TemplateField } from "@/app/types/customer";

export default class OrderTable extends MarkingComponent {
  render() {
    const customer = this.state.customers.find(
      (item) => String(item.id) === this.state.customerId,
    );
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      !field.condition || field.condition.stickerType === this.state.stickerType,
    );

    return (
      <>
        <div className="container table-layout">
          <TableSection
            number="2"
            title="ข้อมูลภายในกล่อง (Inside)"
            subtitle="Template มาตรฐานสำหรับข้อมูลภายในกล่อง"
            fields={this.state.template?.inside ?? []}
            rows={this.state.insideRows}
            onChange={(row, key, value) => this.actions.updateRow("inside", row, key, value)}
          />
          {this.state.template && (outsideFields.length > 0 || this.state.isAdmin) && (
            <TableSection
              number="3"
              title="ข้อมูลภายนอกกล่อง (Outside)"
              subtitle={`Template เฉพาะของ ${customer?.name ?? "ลูกค้าที่เลือก"}`}
              fields={outsideFields}
              rows={this.state.outsideRows}
              onChange={(row, key, value) => this.actions.updateRow("outside", row, key, value)}
              onEdit={this.state.isAdmin ? () => this.actions.openTemplateEditor() : undefined}
              emptyText="ลูกค้ารายนี้ไม่มี Outside Template"
            />
          )}
        </div>

        <div className="print-sheet">
          <h1>รายการสติ๊กเกอร์สินค้า</h1>
          <p>{customer?.name}{this.state.stickerSides && ` · สติ๊กเกอร์ ${this.state.stickerSides} ด้าน`}</p>
          <PrintTable title="ข้อมูลภายในกล่อง (INSIDE)" fields={this.state.template?.inside ?? []} rows={this.state.insideRows} />
          {!!outsideFields.length && (
            <PrintTable title="ข้อมูลภายนอกกล่อง (OUTSIDE)" fields={outsideFields} rows={this.state.outsideRows} />
          )}
        </div>

        <Modal
          open={this.state.isTemplateEditorOpen}
          title="จัดการ Outside Template"
          subtitle={customer?.name}
          onClose={() => this.actions.closeTemplateEditor()}
          footer={
            <>
              <Button className="cancel-button" onClick={() => this.actions.closeTemplateEditor()}>ยกเลิก</Button>
              <Button
                className="export-button"
                onClick={() => void this.actions.saveTemplate()}
                loading={this.state.isSaving}
                loadingText="กำลังบันทึก..."
              >
                บันทึก Template
              </Button>
            </>
          }
        >
          <div className="editor-body">
            {!this.state.outsideDraft.length && <div className="editor-empty">ลูกค้ารายนี้ยังไม่มี Outside Field</div>}
            {this.state.outsideDraft.map((field, index) => (
              <article className="editor-field" key={`${field.key}-${index}`}>
                <div className="editor-number">{index + 1}</div>
                <label>
                  <span>ชื่อ Field</span>
                  <Input bare value={field.label} onChange={(event) => this.actions.updateDraft(index, { label: event.target.value })} />
                </label>
                <label>
                  <span>Key</span>
                  <Input
                    bare
                    value={field.key}
                    onChange={(event) => this.actions.updateDraft(index, {
                      key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    })}
                  />
                </label>
                <label>
                  <span>ชนิดข้อมูล</span>
                  <Select
                    bare
                    value={field.type}
                    onChange={(event) => this.actions.updateDraft(index, { type: event.target.value as TemplateField["type"] })}
                  >
                    <option value="text">ข้อความ</option>
                    <option value="number">ตัวเลข</option>
                    <option value="date">วันที่</option>
                    <option value="textarea">ข้อความหลายบรรทัด</option>
                  </Select>
                </label>
                <label className="required-toggle">
                  <Input
                    bare
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => this.actions.updateDraft(index, { required: event.target.checked })}
                  />
                  <span>บังคับกรอก</span>
                </label>
                <Button className="delete-field" onClick={() => this.actions.removeDraftField(index)}>ลบ</Button>
              </article>
            ))}
            <Button className="add-field-button" onClick={() => this.actions.addDraftField()}>
              <PlusIcon />เพิ่ม Field
            </Button>
          </div>
        </Modal>
      </>
    );
  }
}

interface TableSectionProps {
  number: string;
  title: string;
  subtitle: string;
  fields: TemplateField[];
  rows: MarkingContent[];
  onChange: (row: number, key: string, value: string) => void;
  onEdit?: () => void;
  emptyText?: string;
}

class TableSection extends Component<TableSectionProps> {
  render() {
    const { number, title, subtitle, fields, rows, onChange, onEdit, emptyText } = this.props;
    return (
      <Card className="table-panel">
        <div className="table-heading">
          <SectionTitle number={number} title={title} subtitle={subtitle} />
          {onEdit && <Button onClick={onEdit}><EditIcon />แก้ไข Template</Button>}
        </div>
        {!fields.length ? (
          <EmptyState message={emptyText ?? "เลือกลูกค้าเพื่อโหลด Template"} />
        ) : (
          <div className="vertical-records">
            {rows.map((row, rowIndex) => (
              <article className="record-card" key={rowIndex}>
                <header><div><span>{String(rowIndex + 1).padStart(2, "0")}</span><b>ข้อมูลสติ๊กเกอร์</b></div></header>
                <div className="vertical-fields">
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>{field.label}{field.required && <em>*</em>}</span>
                      {field.segments?.length ? (
                        <div className="horizontal-segment-inputs">
                          {field.segments.map((segment) => (
                            <Input
                              key={segment.key}
                              bare
                              value={row[segment.key] ?? ""}
                              onChange={(event) => onChange(rowIndex, segment.key, event.target.value)}
                              placeholder={segment.label}
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
      </Card>
    );
  }
}

interface PrintTableProps {
  title: string;
  fields: TemplateField[];
  rows: MarkingContent[];
}

class PrintTable extends Component<PrintTableProps> {
  render() {
    const { title, fields, rows } = this.props;
    return (
      <section>
        <h2>{title}</h2>
        <table>
          <thead><tr><th>#</th>{fields.map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}><td>{index + 1}</td>{fields.map((field) => <td key={field.key}>{field.segments?.length ? field.segments.map((segment) => row[segment.key]).filter(Boolean).join(" / ") : row[field.key]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }
}

class PlusIcon extends Component {
  render() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
  }
}

class EditIcon extends Component {
  render() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
  }
}
