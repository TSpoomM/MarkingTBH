import { Component } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import Toast from "@/app/components/Toast";
import type { EditCustomerTemplateProps } from "@/app/types/manage-customer";
import Choice from "./Choice";
import OptionGroup from "./OptionGroup";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";

export default class EditCustomerTemplate extends Component<EditCustomerTemplateProps> {
  render() {
    const {
      customers,
      selectedCustomerId,
      name,
      insideDraft,
      outsideDraft,
      stickerFields,
      stickerLayouts,
      notice,
      loadingCustomers,
      loadingTemplate,
      savingTemplate,
      onDismissNotice,
      onSelectCustomer,
      onNameChange,
      onSave,
      onCancel,
      onStickerFieldsChange,
      onToggleLayout,
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
      <section className="config-card template-editor-card">
        <div className="outside-title">
          <SectionHeading
            number="1"
            title="แก้ไข Sticker Template"
            subtitle="เลือก Template เดิมเพื่อแก้ไข Field ที่จะไปแสดงบนสติ๊กเกอร์ในกรอบและนอกกรอบ"
          />
        </div>
        {notice && (
          <Toast
            type={notice.kind}
            message={notice.text}
            onClose={onDismissNotice}
          />
        )}
        <label className="customer-name">
          <span>เลือก Template</span>
          <Select
            bare
            value={selectedCustomerId}
            onChange={(event) => onSelectCustomer(event.target.value)}
            disabled={loadingCustomers || loadingTemplate}
          >
            <option value="">
              {loadingCustomers ? "กำลังโหลดลูกค้า..." : "เลือก Template ที่ต้องการแก้ไข"}
            </option>
            {customers.map((customer) => (
              <option value={customer.id} key={customer.id}>{customer.name}</option>
            ))}
          </Select>
        </label>
        {!selectedCustomerId && !loadingCustomers && (
          <div className="customer-empty-guide">
            <strong>เริ่มจากเลือก Template ที่ต้องการแก้ไข</strong>
            <span>หลังเลือกแล้ว ระบบจะแสดง Preview ด้านบน และ Field editor สำหรับในกรอบ/นอกกรอบด้านล่าง</span>
          </div>
        )}
        {loadingTemplate && <div className="outside-empty"><strong>กำลังโหลด Template...</strong></div>}
        {selectedCustomerId && !loadingTemplate && (
          <>
            <label className="customer-name">
              <span>ชื่อ Customer *</span>
              <Input
                bare
                value={name}
                onChange={(event) => onNameChange(event.target.value.toUpperCase())}
                placeholder="ABC Rubber Co., Ltd."
              />
            </label>
            <div className="template-workbench-summary">
              <div>
                <span>ในกรอบ</span>
                <strong>{insideDraft.length} fields</strong>
              </div>
              <div>
                <span>นอกกรอบ</span>
                <strong>{outsideDraft.length} fields</strong>
              </div>
            </div>
            <OptionGroup
              label="ช่องข้อมูลที่ผู้พิมพ์ต้องเลือก *"
              hint="Side และ Format จำเป็นสำหรับคำนวณจำนวนสติ๊กเกอร์"
            >
              {([
                ["type", "Type", "ผู้พิมพ์เลือก TNR หรือ NON TNR"],
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
            {false && (
              <OptionGroup
                label="รูปแบบที่ต้องพิมพ์"
                hint="Admin เลือกได้ว่าจะพิมพ์สติ๊กเกอร์ในกรอบ, นอกกรอบ และชื่อ Customer หรือไม่"
              >
                {([
                  ["outsideFrame", "นอกกรอบ", "A4 แนวนอน 2x2"],
                  ["customerName", "ชื่อ Customer", "A4 แนวตั้ง 2x8"],
                  ["fscLogo", "โลโก้ FSC", "A4 แนวนอน 2x2 (สูงสุด 3 ดวง/ช่อง)"],
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
            )}
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
            <div className="container bottom-action">
              <div className="bottom-action-buttons">
                <StickerTemplatePreview
                  customerName={name.trim() || "Customer"}
                  insideFields={insideDraft}
                  outsideFields={outsideDraft}
                  layouts={stickerLayouts}
                  onSelect={onSelectPreviewSlot}
                />
                <Button
                  type="button"
                  className="template-cancel-button"
                  onClick={onCancel}
                  disabled={!selectedCustomerId || loadingTemplate || savingTemplate}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  className="export-button"
                  onClick={onSave}
                  disabled={!selectedCustomerId || loadingTemplate}
                  loading={savingTemplate}
                  loadingText="กำลังบันทึก..."
                >
                  บันทึก Template
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }
}
