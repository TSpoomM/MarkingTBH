"use client";

import { useMemo, useState } from "react";

type IconName = "grid" | "file" | "template" | "clock" | "settings" | "help" | "search" | "bell" | "chevron" | "check" | "eye" | "download" | "plus" | "trash" | "copy" | "box";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    template: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.9 1.9c-1 .7-1.6 1.1-1.6 2.6M12 17h.01"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>, check: <path d="m5 12 4 4L19 6"/>, eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"/><circle cx="12" cy="12" r="2.5"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></>, plus: <path d="M12 5v14M5 12h14"/>, trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>, box: <><path d="m12 3 9 5-9 5-9-5 9-5zM3 8v9l9 5 9-5V8M12 13v9"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const templates = ["กล่องมาตรฐาน Export", "Premium Product", "กล่องสินค้าแช่แข็ง"];
const initialFields = [
  { id: 1, label: "LOT NO.", value: "TBH-2026-0722", required: true },
  { id: 2, label: "PALLET NO.", value: "PLT-001", required: true },
  { id: 3, label: "GROSS (KG)", value: "1,250.00", required: true },
  { id: 4, label: "NET (KG)", value: "1,200.00", required: true },
  { id: 5, label: "DESTINATION", value: "YOKOHAMA, JAPAN", required: true },
  { id: 6, label: "CONTRACT NO.", value: "CT-TH-2026-047", required: false },
];

export default function Home() {
  const [template, setTemplate] = useState(templates[0]);
  const [tab, setTab] = useState<"inside" | "outside">("inside");
  const [fields, setFields] = useState(initialFields);
  const [toast, setToast] = useState("");
  const filled = useMemo(() => fields.filter((field) => field.value.trim()).length, [fields]);
  const update = (id: number, value: string) => setFields((all) => all.map((field) => field.id === id ? { ...field, value } : field));
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Icon name="box" size={22}/></span><span>Marking<span>TBH</span></span></div>
      <nav className="nav-group" aria-label="เมนูหลัก">
        <p>เมนูหลัก</p>
        <a className="active" href="#workspace"><Icon name="grid"/> สร้างเอกสาร</a>
        <a href="#templates" onClick={() => notify("Template Management พร้อมสำหรับเชื่อม API")}><Icon name="template"/> จัดการเทมเพลต <span className="nav-count">3</span></a>
        <a href="#history" onClick={() => notify("ยังไม่มีประวัติเอกสารในเซสชันนี้")}><Icon name="clock"/> ประวัติเอกสาร</a>
      </nav>
      <nav className="nav-group nav-bottom">
        <p>ระบบ</p><a href="#settings"><Icon name="settings"/> ตั้งค่า</a><a href="#help"><Icon name="help"/> ช่วยเหลือ</a>
      </nav>
      <div className="user-card"><span className="avatar">AD</span><span><b>Admin TBH</b><small>ผู้ดูแลระบบ</small></span><Icon name="chevron" size={15}/></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="search"><Icon name="search"/><input aria-label="ค้นหา" placeholder="ค้นหาเทมเพลต หรือเอกสาร..."/><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="การแจ้งเตือน"><Icon name="bell"/><i/></button></header>
      <section id="workspace" className="content">
        <div className="breadcrumb">หน้าหลัก <Icon name="chevron" size={13}/> <span>สร้างเอกสารใหม่</span></div>
        <div className="title-row"><div><h1>สร้างเอกสารใหม่</h1><p>เลือกเทมเพลตและกรอกข้อมูล เพื่อสร้างเอกสารพร้อมพิมพ์</p></div><span className="draft"><i/> แบบร่าง</span></div>

        <section className="stepper" aria-label="ขั้นตอน"><div className="step done"><b><Icon name="check" size={15}/></b><span><strong>เลือกเทมเพลต</strong><small>กล่องมาตรฐาน Export</small></span></div><i/><div className="step current"><b>2</b><span><strong>กรอกข้อมูล</strong><small>Inside & Outside Box</small></span></div><i/><div className="step"><b>3</b><span><strong>ตรวจสอบ</strong><small>ดูตัวอย่างเอกสาร</small></span></div><i/><div className="step"><b>4</b><span><strong>ส่งออก</strong><small>ดาวน์โหลด PDF</small></span></div></section>

        <div className="workspace-grid">
          <section className="form-panel">
            <label className="field-label">เทมเพลตที่เลือก</label>
            <div className="template-select"><span className="template-icon"><Icon name="file"/></span><select value={template} onChange={(e) => setTemplate(e.target.value)}>{templates.map((item) => <option key={item}>{item}</option>)}</select><span className="status-dot"><Icon name="check" size={12}/></span></div>
            <div className="tabs"><button className={tab === "inside" ? "active" : ""} onClick={() => setTab("inside")}>Inside Box <span>{fields.length}</span></button><button className={tab === "outside" ? "active" : ""} onClick={() => setTab("outside")}>Outside Box <span>5</span></button></div>
            {tab === "inside" ? <div className="form-card"><div className="form-heading"><div><h2>ข้อมูลภายในกล่อง</h2><p>ข้อมูลหลักที่จะแสดงบนฉลากสินค้า</p></div><span>{filled}/{fields.length} กรอกแล้ว</span></div>
              <div className="field-grid">{fields.map((field) => <label key={field.id} className={field.label === "DESTINATION" || field.label === "CONTRACT NO." ? "wide" : ""}><span>{field.label} {field.required && <em>*</em>}</span><div className="input-wrap"><input value={field.value} onChange={(e) => update(field.id, e.target.value)} placeholder={`กรอก ${field.label}`}/>{field.value && <Icon name="check" size={15}/>}</div></label>)}</div>
              <button className="add-field" onClick={() => setFields((f) => [...f, { id: Date.now(), label: "CUSTOM FIELD", value: "", required: false }])}><Icon name="plus"/> เพิ่มข้อมูลเพิ่มเติม</button>
            </div> : <OutsideForm/>}
            <div className="form-actions"><button className="secondary" onClick={() => notify("บันทึกแบบร่างแล้ว")}><Icon name="file"/> บันทึกแบบร่าง</button><button className="primary" onClick={() => notify("ตรวจสอบข้อมูลครบถ้วนแล้ว")}><Icon name="eye"/> ตรวจสอบเอกสาร <Icon name="chevron" size={15}/></button></div>
          </section>

          <aside className="preview-panel"><div className="preview-heading"><div><h2>ตัวอย่างเอกสาร</h2><p>อัปเดตแบบเรียลไทม์</p></div><div><button className="icon-button" title="คัดลอก" onClick={() => notify("คัดลอกข้อมูลแล้ว")}><Icon name="copy"/></button><button className="icon-button" title="ล้างข้อมูล" onClick={() => setFields((f) => f.map((x) => ({...x, value: ""})))}><Icon name="trash"/></button></div></div>
            <div className="paper"><div className="paper-label">A4 · LANDSCAPE · 2 × 2</div><div className="label-grid">{[1,2,3,4].map((n) => <LabelCard key={n} fields={fields} index={n}/>)}</div></div>
            <div className="preview-footer"><span><i/> พร้อมส่งออก</span><span>4 ฉลาก · 1 หน้า</span></div>
            <button className="export" onClick={() => window.print()}><Icon name="download"/> ส่งออกเป็น PDF</button><p className="export-note">ไฟล์ PDF คุณภาพสูง · รองรับภาษาไทย</p>
          </aside>
        </div>
      </section>
    </main>
    {toast && <div className="toast"><Icon name="check"/> {toast}</div>}
  </div>;
}

function OutsideForm() {
  const labels = ["TRADE NAME", "S/I NO.", "P/I NO.", "PRODUCTION DATE", "UNIT NO."];
  return <div className="form-card"><div className="form-heading"><div><h2>ข้อมูลภายนอกกล่อง</h2><p>ข้อมูลเพิ่มเติมสำหรับการขนส่ง</p></div><span>0/5 กรอกแล้ว</span></div><div className="field-grid">{labels.map((label, i) => <label key={label} className={i > 2 ? "wide" : ""}><span>{label}</span><div className="input-wrap"><input type={label.includes("DATE") ? "date" : "text"} placeholder={`กรอก ${label}`}/></div></label>)}</div></div>;
}

function LabelCard({ fields, index }: { fields: typeof initialFields; index: number }) {
  return <article className="label-card"><div className="label-brand"><span>TBH</span><small>THAI BEST HARVEST CO., LTD.</small></div><h3>PRODUCT MARKING</h3>{fields.slice(0, 6).map((field) => <div className="label-row" key={field.id}><b>{field.label}</b><span>{field.label === "PALLET NO." ? `${field.value || "—"} / ${index}` : field.value || "—"}</span></div>)}<footer>MADE IN THAILAND</footer></article>;
}
