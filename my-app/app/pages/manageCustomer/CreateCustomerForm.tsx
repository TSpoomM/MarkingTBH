import Link from "next/link";
import { Component } from "react";
import Toast from "@/app/components/Toast";
import type { CreateCustomerFormProps } from "@/app/types/manage-customer";
import {
  Choice,
  ConditionSelector,
  OptionGroup,
  SectionHeading,
  uid,
} from "./CustomerManageShared";

export default class CreateCustomerForm extends Component<CreateCustomerFormProps> {
  render() {
    const {
      name,
      stickerFields,
      stickerLayouts,
      groups,
      tables,
      fixedInsideFields,
      notice,
      saving,
      onDismissNotice,
      onSubmit,
      onNameChange,
      onStickerFieldsChange,
      onToggleLayout,
      onSegmentCountChange,
      onGroupSegmentChange,
      onTablesChange,
      onTableUpdate,
    } = this.props;

    return (
    <>
      {notice && (
        <Toast
          type={notice.kind}
          message={notice.text}
          onClose={onDismissNotice}
        />
      )}
      <div className="customer-create-steps">
        <span className="active">1. ข้อมูล Customer</span>
        <span>2. ช่องบนหน้า User</span>
        <span>3. Inside</span>
        <span>4. Outside</span>
      </div>
      <form onSubmit={onSubmit}>
        <section className="config-card">
          <SectionHeading
            number="2"
            title="เพิ่ม Customer ใหม่"
            subtitle="เลือกว่าหน้า User ต้องแสดงช่องใดให้กรอกบ้าง"
          />
          <label className="customer-name">
            <span>ชื่อลูกค้า *</span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="เช่น ABC Rubber Co., Ltd."
            />
          </label>
          <OptionGroup
            label="ช่องที่ User ต้องกรอก *"
            hint="Admin เลือกเฉพาะหัวข้อ ส่วนค่าจริงให้ User เลือกภายหลัง"
          >
            {([
              ["side", "Side", "User เลือก 1–6"],
              ["format", "Format", "User เลือก 5533 หรือ 555"],
              ["type", "Type", "User เลือก TNR, NON-TNR หรือ FCS"],
              ["other", "Other", "User เลือก Dome หรือ Inter"],
            ] as const).map(([field, label, description]) => (
              <Choice
                key={field}
                label={label}
                description={description}
                checked={stickerFields.includes(field)}
                onChange={() => onStickerFieldsChange(
                  stickerFields.includes(field)
                    ? stickerFields.filter((item) => item !== field)
                    : [...stickerFields, field],
                )}
              />
            ))}
          </OptionGroup>
          <OptionGroup
            label="รูปแบบสติ๊กเกอร์ที่ต้องพิมพ์ *"
            hint="Admin เป็นคนกำหนดว่าจะออกกระดาษแบบใดให้ลูกค้ารายนี้"
          >
            {([
              ["insideFrame", "ในกรอบ", "A4 แนวนอน 2x2"],
              ["outsideFrame", "นอกกรอบ", "A4 แนวนอน 2x2"],
              ["customerName", "ชื่อ Customer", "A4 แนวตั้ง 2x16"],
            ] as const).map(([layout, label, description]) => (
              <Choice
                key={layout}
                label={label}
                description={description}
                checked={stickerLayouts[layout]}
                onChange={() => onToggleLayout(layout)}
              />
            ))}
          </OptionGroup>
        </section>

        <section className="config-card">
          <SectionHeading
            number="3"
            title="ข้อมูลภายในกล่อง (Inside)"
            subtitle="กำหนดจำนวนส่วนของ LOT NO. และ PALLET NO. ได้หัวข้อละ 1–6 ส่วน"
          />
          <div className="inside-grid">
            {groups.map((group) => (
              <div className="inside-box" key={group.key}>
                <div className="inside-box-head">
                  <strong>{group.label}</strong>
                  <label>
                    จำนวนส่วน{" "}
                    <select
                      value={group.segments.length}
                      onChange={(event) => onSegmentCountChange(group.key, Number(event.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
                <div className="segment-list">
                  {group.segments.map((segment, index) => (
                    <label key={segment.key}>
                      <span>{index + 1}</span>
                      <input
                        value={segment.label}
                        onChange={(event) => onGroupSegmentChange(group.key, index, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="fixed-inside">
            <div>
              <strong>ช่องมาตรฐานที่ User ต้องกรอก</strong>
              <small>มีในลูกค้าทุกรายและไม่ต้องตั้งค่าเพิ่มเติม</small>
            </div>
            <div className="fixed-field-list">
              {fixedInsideFields.map((field) => (
                <span key={field.key}>
                  {field.label}
                  <b>บังคับ</b>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="config-card">
          <div className="outside-title">
            <SectionHeading
              number="4"
              title="ข้อมูลภายนอกกล่อง (Outside)"
              subtitle="เริ่มจากกล่องว่าง เพิ่มได้ทั้ง Table และ Row"
            />
            <button
              type="button"
              className="outline-action"
              onClick={() => onTablesChange((current) => [
                ...current,
                {
                  id: uid(),
                  name: `Outside ${current.length + 1}`,
                  fields: [],
                },
              ])}
            >
              + เพิ่ม Table
            </button>
          </div>
          {tables.length === 0 ? (
            <div className="outside-empty">
              <strong>ยังไม่มี Outside table</strong>
              <span>กด “เพิ่ม Table” เมื่อลูกค้าต้องใช้ข้อมูลภายนอกกล่อง</span>
            </div>
          ) : (
            <div className="outside-tables">
              {tables.map((table, tableIndex) => (
                <div className="outside-table" key={table.id}>
                  <div className="outside-table-head">
                    <span>{tableIndex + 1}</span>
                    <input
                      value={table.name}
                      onChange={(event) => onTableUpdate(table.id, (item) => ({
                        ...item,
                        name: event.target.value,
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => onTablesChange((current) => current.filter((item) => item.id !== table.id))}
                    >
                      ลบ Table
                    </button>
                  </div>
                  <div className="outside-rows">
                    {table.fields.map((field, fieldIndex) => (
                      <div className={`outside-row ${field.system ? "system-row" : ""}`} key={field.key}>
                        <span>{fieldIndex + 1}</span>
                        <input
                          value={field.label}
                          onChange={(event) => onTableUpdate(table.id, (item) => ({
                            ...item,
                            fields: item.fields.map((row) => (
                              row.key === field.key ? { ...row, label: event.target.value } : row
                            )),
                          }))}
                          placeholder="ชื่อข้อมูลบน Sticker"
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) => onTableUpdate(table.id, (item) => ({
                              ...item,
                              fields: item.fields.map((row) => (
                                row.key === field.key ? { ...row, required: event.target.checked } : row
                              )),
                            }))}
                          />
                          {" "}
                          บังคับกรอก
                        </label>
                        <ConditionSelector
                          value={field.condition}
                          onChange={(condition) => onTableUpdate(table.id, (item) => ({
                            ...item,
                            fields: item.fields.map((row) => (
                              row.key === field.key ? { ...row, condition } : row
                            )),
                          }))}
                        />
                        <button
                          type="button"
                          onClick={() => onTableUpdate(table.id, (item) => ({
                            ...item,
                            fields: item.fields.filter((row) => row.key !== field.key),
                          }))}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-row"
                      onClick={() => onTableUpdate(table.id, (item) => ({
                        ...item,
                        fields: [...item.fields, { key: `field_${uid()}`, label: "", required: false, showOnSticker: true }],
                      }))}
                    >
                      + เพิ่ม Row
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="form-actions">
          <Link href="/">ยกเลิก</Link>
          <button type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกลูกค้า"}
          </button>
        </div>
      </form>
    </>
    );
  }
}
