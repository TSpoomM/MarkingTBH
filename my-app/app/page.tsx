"use client";

import { useEffect, useMemo, useState } from "react";
import type { CustomerTemplate, MarkingContent, TemplateField } from "./types/marking";

type Customer = { id: number; name: string };

const emptyRow = (fields: TemplateField[]): MarkingContent =>
  Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? ""]));

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [template, setTemplate] = useState<CustomerTemplate | null>(null);
  const [totalWeight, setTotalWeight] = useState("");
  const [stickerSides, setStickerSides] = useState("2");
  const [insideRows, setInsideRows] = useState<MarkingContent[]>([]);
  const [outsideRows, setOutsideRows] = useState<MarkingContent[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [outsideDraft, setOutsideDraft] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const customer = useMemo(
    () => customers.find((item) => String(item.id) === customerId),
    [customerId, customers],
  );

  useEffect(() => {
    fetch("/api/session")
      .then((response) => response.json())
      .then((body) => setIsAdmin(body.user?.role === "admin"))
      .catch(() => setIsAdmin(false));
    fetch("/api/customers")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        setCustomers(body.data);
        if (body.data[0]) void selectCustomer(String(body.data[0].id));
      })
      .catch((error) => setNotice({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  async function selectCustomer(id: string) {
    setCustomerId(id);
    setNotice(null);
    if (!id) { setTemplate(null); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${id}/template`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setTemplate(body.data);
      setInsideRows([emptyRow(body.data.inside)]);
      setOutsideRows(body.data.outside.length ? [emptyRow(body.data.outside)] : []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "โหลด template ไม่สำเร็จ" });
    } finally { setLoading(false); }
  }

  function validate() {
    if (!customerId) return "กรุณาเลือกลูกค้า";
    if (Number(totalWeight) <= 0) return "กรุณากรอกน้ำหนักรวม";
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) => field.required && !row[field.key]?.trim());
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) => field.required && !row[field.key]?.trim());
      if (missing) return `Outside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    return "";
  }

  async function saveAndExport() {
    const error = validate();
    if (error) { setNotice({ type: "error", text: error }); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/markings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(customerId),
          totalWeight: Number(totalWeight),
          stickerSides: Number(stickerSides),
          contentInside: insideRows,
          contentOutside: outsideRows,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setNotice({ type: "success", text: `บันทึกรายการ #${body.data.id} แล้ว กำลังเปิดหน้าต่าง PDF` });
      window.setTimeout(() => window.print(), 120);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" });
    } finally { setSaving(false); }
  }

  function openTemplateEditor() {
    setOutsideDraft(template?.outside.map((field) => ({ ...field })) ?? []);
    setShowTemplateEditor(true);
  }

  function updateDraft(index: number, patch: Partial<TemplateField>) {
    setOutsideDraft((fields) =>
      fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field),
    );
  }

  async function saveTemplate() {
    if (!customerId) return;
    const cleaned = outsideDraft.map((field, index) => ({
      ...field,
      key: field.key.trim() || `outside_field_${index + 1}`,
      label: field.label.trim(),
    }));
    if (cleaned.some((field) => !field.label)) {
      setNotice({ type: "error", text: "กรุณากรอกชื่อ Field ให้ครบ" });
      return;
    }
    if (new Set(cleaned.map((field) => field.key)).size !== cleaned.length) {
      setNotice({ type: "error", text: "Key ของแต่ละ Field ต้องไม่ซ้ำกัน" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-role": "admin" },
        body: JSON.stringify({ outside: cleaned, updatedBy: "ADMIN" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setTemplate(body.data);
      setOutsideRows(body.data.outside.length ? [emptyRow(body.data.outside)] : []);
      setShowTemplateEditor(false);
      setNotice({ type: "success", text: "อัปเดต Outside Template เรียบร้อยแล้ว" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "อัปเดต Template ไม่สำเร็จ" });
    } finally { setSaving(false); }
  }

  return <div className="order-app">
    <header className="header">
      <div className="header-inner">
        <div className="logo"><span>TBH</span><div><h1>ระบบจัดการคำสั่งซื้อ</h1><p>จัดทำรายการบรรจุสินค้า Inside และ Outside</p></div></div>
        <button className="export-button" onClick={saveAndExport} disabled={saving || !template}><DownloadIcon />{saving ? "กำลังบันทึก..." : "ส่งออก PDF"}</button>
      </div>
    </header>

    <main className="container">
      {notice && <div className={`notice ${notice.type}`}><span>{notice.text}</span><button onClick={() => setNotice(null)}>×</button></div>}

      <section className="panel details-panel">
        <SectionTitle number="1" title="รายละเอียดสติ๊กเกอร์" subtitle="เลือกลูกค้า ระบุน้ำหนัก และจำนวนด้านที่ต้องการติด" />
        <div className="detail-grid">
          <Field label="ลูกค้า" hint={template ? `Template ภายนอก ${template.outside.length} ช่องข้อมูล` : undefined}>
            <select value={customerId} onChange={(event) => selectCustomer(event.target.value)} disabled={loading}>
              <option value="">{loading ? "กำลังโหลดลูกค้า..." : "เลือกลูกค้า"}</option>
              {customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="น้ำหนักรวม (ตัน)"><input type="number" min="0" step="0.01" value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} placeholder="0.00" /></Field>
          <Field label="จำนวนด้านสติ๊กเกอร์ต่อกล่อง"><select value={stickerSides} onChange={(e) => setStickerSides(e.target.value)}>{[1, 2, 3, 4].map((side) => <option value={side} key={side}>{side} ด้าน</option>)}</select></Field>
        </div>
      </section>

      <div className="table-layout">
        <TableSection
          number="2" title="ข้อมูลภายในกล่อง (Inside)" subtitle="Template มาตรฐานสำหรับข้อมูลภายในกล่อง"
          fields={template?.inside ?? []} rows={insideRows}
          onChange={setInsideRows}
        />
        {template && (template.outside.length > 0 || isAdmin) && <TableSection
          number="3" title="ข้อมูลภายนอกกล่อง (Outside)" subtitle={`Template เฉพาะของ ${customer?.name ?? "ลูกค้าที่เลือก"}`}
          fields={template.outside} rows={outsideRows}
          onChange={setOutsideRows}
          onEdit={isAdmin ? openTemplateEditor : undefined}
          emptyText="ลูกค้ารายนี้ไม่มี Outside Template"
        />}
      </div>
      <div className="bottom-action"><span>Inside {insideRows.length} ชุด{template?.outside.length ? ` · Outside ${outsideRows.length} ชุด` : " · ลูกค้ารายนี้ไม่มี Outside"}</span><button className="export-button" onClick={saveAndExport} disabled={saving || !template}><DownloadIcon />ส่งออก PDF</button></div>
    </main>

    <div className="print-sheet">
      <h1>รายการสติ๊กเกอร์สินค้า</h1><p>{customer?.name} · {totalWeight} ตัน · สติ๊กเกอร์ {stickerSides} ด้าน</p>
      <PrintTable title="ข้อมูลภายในกล่อง (INSIDE)" fields={template?.inside ?? []} rows={insideRows} />
      {template && template.outside.length > 0 && <PrintTable title="ข้อมูลภายนอกกล่อง (OUTSIDE)" fields={template.outside} rows={outsideRows} />}
    </div>
    {showTemplateEditor && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowTemplateEditor(false)}>
      <section className="template-modal" role="dialog" aria-modal="true" aria-labelledby="template-editor-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><h2 id="template-editor-title">จัดการ Outside Template</h2><p>{customer?.name}</p></div><button onClick={() => setShowTemplateEditor(false)}>×</button></header>
        <div className="editor-body">
          {outsideDraft.length === 0 && <div className="editor-empty">ลูกค้ารายนี้ยังไม่มี Outside Field</div>}
          {outsideDraft.map((field, index) => <article className="editor-field" key={`${field.key}-${index}`}>
            <div className="editor-number">{index + 1}</div>
            <label><span>ชื่อ Field</span><input value={field.label} onChange={(e) => updateDraft(index, { label: e.target.value })} placeholder="เช่น PRODUCT NAME" /></label>
            <label><span>Key</span><input value={field.key} onChange={(e) => updateDraft(index, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="product_name" /></label>
            <label><span>ชนิดข้อมูล</span><select value={field.type} onChange={(e) => updateDraft(index, { type: e.target.value as TemplateField["type"] })}><option value="text">ข้อความ</option><option value="number">ตัวเลข</option><option value="date">วันที่</option><option value="textarea">ข้อความหลายบรรทัด</option></select></label>
            <label className="required-toggle"><input type="checkbox" checked={field.required} onChange={(e) => updateDraft(index, { required: e.target.checked })} /><span>บังคับกรอก</span></label>
            <button className="delete-field" onClick={() => setOutsideDraft((fields) => fields.filter((_, fieldIndex) => fieldIndex !== index))}>ลบ</button>
          </article>)}
          <button className="add-field-button" onClick={() => setOutsideDraft((fields) => [...fields, { key: `outside_field_${fields.length + 1}`, label: "", type: "text", required: false }])}><PlusIcon />เพิ่ม Field</button>
        </div>
        <footer><button className="cancel-button" onClick={() => setShowTemplateEditor(false)}>ยกเลิก</button><button className="export-button" onClick={saveTemplate} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก Template"}</button></footer>
      </section>
    </div>}
  </div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <div className="section-title"><div><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div></div>;
}

function TableSection({ number, title, subtitle, fields, rows, onChange, onEdit, emptyText }: {
  number: string; title: string; subtitle: string; fields: TemplateField[]; rows: MarkingContent[];
  onChange: React.Dispatch<React.SetStateAction<MarkingContent[]>>;
  onEdit?: () => void;
  emptyText?: string;
}) {
  const update = (rowIndex: number, key: string, value: string) =>
    onChange((current) => current.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row));

  return <section className="panel table-panel">
    <div className="table-heading"><SectionTitle number={number} title={title} subtitle={subtitle} />{onEdit && <button onClick={onEdit}><EditIcon />แก้ไข Template</button>}</div>
    {!fields.length ? <div className="empty-table">{emptyText ?? "เลือกลูกค้าเพื่อโหลด Template"}</div> : <div className="vertical-records">
      {rows.map((row, rowIndex) => <article className="record-card" key={rowIndex}>
        <header><div><span>{String(rowIndex + 1).padStart(2, "0")}</span><b>ข้อมูลสติ๊กเกอร์</b></div></header>
        <div className="vertical-fields">{fields.map((field) => <label key={field.key}><span>{field.label}{field.required && <em>*</em>}</span><input type={field.type === "textarea" ? "text" : field.type} value={row[field.key] ?? ""} onChange={(e) => update(rowIndex, field.key, e.target.value)} placeholder={`กรอก ${field.label}`} /></label>)}</div>
      </article>)}
    </div>}
  </section>;
}

function PrintTable({ title, fields, rows }: { title: string; fields: TemplateField[]; rows: MarkingContent[] }) {
  return <section><h2>{title}</h2><table><thead><tr><th>#</th>{fields.map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{index + 1}</td>{fields.map((field) => <td key={field.key}>{row[field.key]}</td>)}</tr>)}</tbody></table></section>;
}

function DownloadIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></svg>; }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>; }
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>; }
