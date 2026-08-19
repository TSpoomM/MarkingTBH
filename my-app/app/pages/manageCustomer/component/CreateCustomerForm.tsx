import Link from "next/link";
import { Component } from "react";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import Toast from "@/app/components/Toast";
import {
  STICKER_FORMAT_OPTIONS,
  STICKER_OTHER_OPTIONS,
  STICKER_SIDE_OPTIONS,
  STICKER_TYPE_OPTIONS,
} from "@/app/types/constants";
import type { CreateCustomerFormProps } from "@/app/types/manage-customer";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";
import Button from "@/app/components/Button";

export default class CreateCustomerForm extends Component<CreateCustomerFormProps> {
  private templateOptionLabel(customer: CreateCustomerFormProps["customers"][number]) {
    return customer.isActive === false ? `[Inactive] ${customer.name}` : customer.name;
  }

  render() {
    const {
      customers,
      name,
      duplicateSourceCustomerId,
      stickerLayouts,
      stickerDefaults,
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
      onStickerDefaultsChange,
      onSelectPreviewSlot,
      onChangeField,
      onAddField,
      onRemoveField,
      onMoveField,
      onAddTable,
      onRenameTable,
      onRemoveTable,
      onMoveTable,
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
              title="เพิ่ม Template"
              subtitle="กรอกชื่อลูกค้าและตั้งค่าสติ๊กเกอร์ให้ครบ แล้วบันทึกในขั้นตอนเดียว"
            />
            <label className="customer-name">
              <span>ชื่อ Customer *</span>
              <Input
                bare
                value={name}
                onChange={(event) => onNameChange(event.target.value.toUpperCase())}
                placeholder="ABC Rubber Co., Ltd."
              />
            </label>
            <label className="customer-name duplicate-template-picker">
              <span>คัดลอก Template จาก</span>
              <Select
                bare
                value={duplicateSourceCustomerId}
                onChange={(event) => onDuplicateSourceChange(event.target.value)}
                disabled={loadingCustomers || duplicatingTemplate}
              >
                <option value="">
                  {loadingCustomers ? "กำลังโหลดลูกค้า..." : "เริ่มจากว่างเปล่า หรือเลือก Customer เดิม"}
                </option>
                {customers.map((customer) => (
                  <option value={customer.id} key={customer.id} disabled={customer.isActive === false}>
                    {this.templateOptionLabel(customer)}
                  </option>
                ))}
              </Select>
              <small>{duplicatingTemplate ? "กำลังคัดลอก Template..." : "คัดลอก Field และรูปแบบสติ๊กเกอร์ แล้วแก้ไขก่อนสร้าง Customer ใหม่"}</small>
            </label>
            <div className="template-default-grid">
              <label>
                <span>จำนวนด้าน Sticker / 1 ลัง *</span>
                <Select
                  bare
                  value={String(stickerDefaults.sideCount)}
                  onChange={(event) => onStickerDefaultsChange({ ...stickerDefaults, sideCount: Number(event.target.value) })}
                >
                  {STICKER_SIDE_OPTIONS.map((side) => <option value={side} key={side}>{side} ด้าน</option>)}
                </Select>
              </label>
              <label>
                <span>Format *</span>
                <Select
                  bare
                  value={stickerDefaults.format}
                  onChange={(event) => onStickerDefaultsChange({ ...stickerDefaults, format: event.target.value as typeof stickerDefaults.format })}
                >
                  {STICKER_FORMAT_OPTIONS.map((format) => <option value={format} key={format}>{format === "5533" ? "5533 - [5, 5, 3, 3]" : "555 - [5, 5, 5]"}</option>)}
                </Select>
              </label>
              <label>
                <span>เกรด *</span>
                <Select
                  bare
                  value={stickerDefaults.stickerType}
                  onChange={(event) => {
                    const stickerType = event.target.value as typeof stickerDefaults.stickerType;
                    onStickerDefaultsChange({
                      ...stickerDefaults,
                      stickerType,
                      stickerFsc: stickerType === "TNR" ? stickerDefaults.stickerFsc : false,
                    });
                  }}
                >
                  {STICKER_TYPE_OPTIONS.map((type) => <option value={type} key={type}>{type}</option>)}
                </Select>
              </label>
              <label>
                <span>Other *</span>
                <Select
                  bare
                  value={stickerDefaults.stickerOther}
                  onChange={(event) => onStickerDefaultsChange({ ...stickerDefaults, stickerOther: event.target.value as typeof stickerDefaults.stickerOther })}
                >
                  {STICKER_OTHER_OPTIONS.map((other) => <option value={other} key={other}>{other}</option>)}
                </Select>
              </label>
              <label className="template-default-check">
                <Input
                  bare
                  type="checkbox"
                  checked={stickerDefaults.stickerFsc}
                  disabled={stickerDefaults.stickerType !== "TNR"}
                  onChange={(event) => onStickerDefaultsChange({ ...stickerDefaults, stickerFsc: event.target.checked })}
                />
                <span>พิมพ์ FSC</span>
              </label>
            </div>
          </section>

          <section className="config-card template-editor-card">
            <SectionHeading
              number="2"
              title="ตั้งค่า Sticker Template"
              subtitle="กำหนด Field, เงื่อนไขบังคับ, Segment ตัวนับ และดู Preview ก่อนสร้าง Customer"
            />
            <div className="template-manager-grid">
              <TemplateFieldEditor
                title="Sticker ในกรอบ"
                section="inside"
                fields={insideDraft}
                onChange={onChangeField}
                onAdd={onAddField}
                onRemove={onRemoveField}
                onMove={onMoveField}
              />
              <TemplateFieldEditor
                title="Sticker นอกกรอบ"
                section="outside"
                fields={outsideDraft}
                onChange={onChangeField}
                onAdd={onAddField}
                onRemove={onRemoveField}
                onMove={onMoveField}
                onAddTable={onAddTable}
                onRenameTable={onRenameTable}
                onRemoveTable={onRemoveTable}
                onMoveTable={onMoveTable}
              />
            </div>
          </section>

          <div className="container bottom-action">
            <div className="bottom-action-buttons">
              <StickerTemplatePreview
                customerName={name.trim() || "Customer"}
                insideFields={insideDraft}
                outsideFields={outsideDraft}
                layouts={stickerLayouts}
                defaults={stickerDefaults}
                onSelect={onSelectPreviewSlot}
              />
              <Link className="back-link" href="/">ยกเลิก</Link>
              <Button type="submit" className="export-button" disabled={saving}>
                {saving ? "กำลังบันทึก..." : "สร้าง Customer"}
              </Button>
            </div>
          </div>
        </form>
      </>
    );
  }
}
