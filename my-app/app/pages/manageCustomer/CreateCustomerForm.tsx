import Link from "next/link";
import { Component } from "react";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import Toast from "@/app/components/Toast";
import type { CreateCustomerFormProps } from "@/app/types/manage-customer";
import Choice from "./Choice";
import OptionGroup from "./OptionGroup";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";
import Button from "@/app/components/Button";

export default class CreateCustomerForm extends Component<CreateCustomerFormProps> {
  render() {
    const {
      customers,
      name,
      duplicateSourceCustomerId,
      stickerFields,
      stickerLayouts,
      insideDraft,
      outsideDraft,
      notice,
      loadingCustomers,
      duplicatingTemplate,
      saving,
      onDismissNotice,
      onSubmit,
      onNameChange,
      onDuplicateSourceChange,
      onStickerFieldsChange,
      onToggleLayout,
      onSelectPreviewSlot,
      onChangeField,
      onAddField,
      onRemoveField,
      onAddTable,
      onRenameTable,
      onRemoveTable,
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
        <form onSubmit={onSubmit}>
          <section className="config-card">
            <SectionHeading
              number="1"
              title="เพิ่ม Customer"
              subtitle="กรอกชื่อลูกค้าและตั้งค่าสติ๊กเกอร์ให้ครบ แล้วบันทึกในขั้นตอนเดียว"
            />
            <label className="customer-name">
              <span>ชื่อ Customer *</span>
              <Input
                bare
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="ABC Rubber Co., Ltd."
              />
            </label>
            <label className="customer-name duplicate-template-picker">
              <span>Duplicate template from</span>
              <Select
                bare
                value={duplicateSourceCustomerId}
                onChange={(event) => onDuplicateSourceChange(event.target.value)}
                disabled={loadingCustomers || duplicatingTemplate}
              >
                <option value="">
                  {loadingCustomers ? "Loading customers..." : "Start blank or choose an existing customer"}
                </option>
                {customers.map((customer) => (
                  <option value={customer.id} key={customer.id}>{customer.name}</option>
                ))}
              </Select>
              <small>{duplicatingTemplate ? "Copying template..." : "Copy fields and sticker layouts, then edit before creating the new customer."}</small>
            </label>
            <OptionGroup
              label="ช่องข้อมูลที่ผู้พิมพ์ต้องเลือก *"
              hint="Side และ Format จำเป็นสำหรับคำนวณจำนวนสติ๊กเกอร์"
            >
              {([
                ["side", "Side", "ผู้พิมพ์เลือกจำนวนด้าน 1-6"],
                ["format", "Format", "ผู้พิมพ์เลือกรูปแบบ 5533 หรือ 555"],
                ["type", "Type", "ผู้พิมพ์เลือก TNR, NON-TNR หรือ FCS"],
                ["other", "Other", "ผู้พิมพ์เลือก Dome หรือ Inter"],
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
              hint="เลือกอย่างน้อย 1 รูปแบบสำหรับลูกค้ารายนี้"
            >
              {([
                ["insideFrame", "ในกรอบ", "A4 แนวนอน 2x2"],
                ["outsideFrame", "นอกกรอบ", "A4 แนวนอน 2x2"],
                ["customerName", "ชื่อ Customer", "A4 แนวตั้ง 2x8"],
                ["fscLogo", "โลโก้ FSC", "A4 แนวตั้ง 2x2"],
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

          <section className="config-card template-editor-card">
            <SectionHeading
              number="2"
              title="ตั้งค่า Sticker Template"
              subtitle="กำหนด Field, เงื่อนไขบังคับ, Segment ตัวนับ และดู Preview ก่อนสร้าง Customer"
            />
            <StickerTemplatePreview
              customerName={name.trim() || "Customer"}
              insideFields={insideDraft}
              outsideFields={outsideDraft}
              layouts={stickerLayouts}
              onSelect={onSelectPreviewSlot}
            />
            <div className="template-manager-grid">
              <TemplateFieldEditor
                title="Sticker ในกรอบ"
                section="inside"
                fields={insideDraft}
                onChange={onChangeField}
                onAdd={onAddField}
                onRemove={onRemoveField}
              />
              <TemplateFieldEditor
                title="Sticker นอกกรอบ"
                section="outside"
                fields={outsideDraft}
                onChange={onChangeField}
                onAdd={onAddField}
                onRemove={onRemoveField}
                onAddTable={onAddTable}
                onRenameTable={onRenameTable}
                onRemoveTable={onRemoveTable}
              />
            </div>
          </section>

          <div className="form-actions">
            <Link href="/">ยกเลิก</Link>
            <Button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "สร้าง Customer"}
            </Button>
          </div>
        </form>
      </>
    );
  }
}
