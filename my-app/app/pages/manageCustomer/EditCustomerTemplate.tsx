import { Component } from "react";
import Button from "@/app/components/Button";
import Toast from "@/app/components/Toast";
import type { EditCustomerTemplateProps } from "@/app/types/manage-customer";
import {
  Choice,
  OptionGroup,
  SectionHeading,
  StickerTemplatePreview,
  TemplateFieldEditor,
} from "./CustomerManageShared";

export default class EditCustomerTemplate extends Component<EditCustomerTemplateProps> {
  render() {
    const {
      customers,
      selectedCustomer,
      selectedCustomerId,
      insideDraft,
      outsideDraft,
      stickerLayouts,
      notice,
      loadingCustomers,
      loadingTemplate,
      savingTemplate,
      onDismissNotice,
      onSelectCustomer,
      onSave,
      onToggleLayout,
      onSelectPreviewSlot,
      onChangeField,
      onAddField,
      onRemoveField,
    } = this.props;

    return (
    <section className="config-card">
      <div className="outside-title">
        <SectionHeading
          number="1"
          title="แก้ไข Sticker Template"
          subtitle="เลือก Customer เดิมเพื่อแก้ Field ที่จะไปแสดงบนสติ๊กเกอร์ในกรอบและนอกกรอบ"
        />
        <Button
          className="export-button"
          onClick={onSave}
          disabled={!selectedCustomerId || loadingTemplate}
          loading={savingTemplate}
          loadingText="กำลังบันทึก..."
        >
          บันทึก Template
        </Button>
      </div>
      {notice && (
        <Toast
          type={notice.kind}
          message={notice.text}
          onClose={onDismissNotice}
        />
      )}
      <label className="customer-name">
        <span>เลือก Customer</span>
        <select
          value={selectedCustomerId}
          onChange={(event) => onSelectCustomer(event.target.value)}
          disabled={loadingCustomers || loadingTemplate}
        >
          <option value="">{loadingCustomers ? "กำลังโหลดลูกค้า..." : "เลือก Customer ที่ต้องการแก้ Template"}</option>
          {customers.map((customer) => (
            <option value={customer.id} key={customer.id}>{customer.name}</option>
          ))}
        </select>
      </label>
      {!selectedCustomerId && !loadingCustomers && (
        <div className="customer-empty-guide">
          <strong>เริ่มจากเลือก Customer ที่ต้องการแก้ Template</strong>
          <span>หลังเลือกแล้ว ระบบจะแสดง Preview ด้านบน และ Field editor สำหรับในกรอบ/นอกกรอบด้านล่าง</span>
        </div>
      )}
      {loadingTemplate && <div className="outside-empty"><strong>กำลังโหลด Template...</strong></div>}
      {selectedCustomerId && !loadingTemplate && (
        <>
          <div className="template-workbench-summary">
            <div>
              <span>Customer</span>
              <strong>{selectedCustomer?.name ?? "Customer"}</strong>
            </div>
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
            label="รูปแบบที่ต้องพิมพ์"
            hint="Admin เลือกได้ว่าจะพิมพ์สติ๊กเกอร์ในกรอบ, นอกกรอบ และชื่อ Customer หรือไม่"
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
          <StickerTemplatePreview
            customerName={selectedCustomer?.name ?? "Customer"}
            insideFields={insideDraft}
            outsideFields={outsideDraft}
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
            />
          </div>
        </>
      )}
    </section>
    );
  }
}
