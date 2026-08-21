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
import type { CreateTemplateFormProps } from "@/app/types/manage-template";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";
import Button from "@/app/components/Button";

export default class CreateTemplateForm extends Component<CreateTemplateFormProps> {
  private templateOptionLabel(template: CreateTemplateFormProps["templates"][number]) {
    return template.isActive === false ? `[Inactive] ${template.name}` : template.name;
  }

  render() {
    const {
      templates,
      name,
      isActive,
      duplicateSourceTemplateId,
      stickerLayouts,
      stickerDefaults,
      insideDraft,
      outsideDraft,
      notice,
      loadingTemplates,
      duplicatingTemplate,
      saving,
      onDismissNotice,
      onSubmit,
      onNameChange,
      onActiveChange,
      onDuplicateSourceChange,
      onStickerDefaultsChange,
      onSelectPreviewSlot,
      onChangeField,
      onAddField,
      onRemoveField,
      onMoveField,
      onAddTable,
      onRenameTable,
      onChangeTableLayout,
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
          <section className="config-card template-basics-card">
            <SectionHeading
              number="1"
              title="เพิ่ม Template"
              subtitle="กรอกชื่อลูกค้าและตั้งค่าสติ๊กเกอร์ให้ครบ แล้วบันทึกในขั้นตอนเดียว"
            />
            <div className="template-name-status-row">
              <label className="template-name">
                <span>ชื่อ Template *</span>
                <Input
                  bare
                  value={name}
                  onChange={(event) => onNameChange(event.target.value.toUpperCase())}
                  placeholder="ABC Rubber Co., Ltd."
                />
              </label>
              <div className="template-status-field">
                <span className="template-status-caption">Status</span>
                <button
                  type="button"
                  className={`template-status-toggle ${isActive ? "active" : "inactive"}`}
                  onClick={() => onActiveChange(!isActive)}
                  aria-pressed={isActive}
                >
                  <span className="template-status-option">Inactive</span>
                  <i aria-hidden="true" />
                  <span className="template-status-option">Active</span>
                </button>
              </div>
            </div>
            <label className="template-name duplicate-template-picker">
              <span>คัดลอก Template จาก</span>
              <Select
                bare
                value={duplicateSourceTemplateId}
                onChange={(event) => onDuplicateSourceChange(event.target.value)}
                disabled={loadingTemplates || duplicatingTemplate}
              >
                <option value="">
                  {loadingTemplates ? "กำลังโหลดลูกค้า..." : "เริ่มจากว่างเปล่า หรือเลือก Template เดิม"}
                </option>
                {templates.map((template) => (
                  <option value={template.id} key={template.id} disabled={template.isActive === false}>
                    {this.templateOptionLabel(template)}
                  </option>
                ))}
              </Select>
              <small>{duplicatingTemplate ? "กำลังคัดลอก Template..." : "คัดลอก Field และรูปแบบสติ๊กเกอร์ แล้วแก้ไขก่อนสร้าง Template ใหม่"}</small>
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
              subtitle="กำหนด Field, เงื่อนไขบังคับ, Segment ตัวนับ และดู Preview ก่อนสร้าง Template"
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
                onChangeTableLayout={onChangeTableLayout}
                onRemoveTable={onRemoveTable}
                onMoveTable={onMoveTable}
              />
            </div>
          </section>

          <div className="container bottom-action">
            <div className="bottom-action-buttons">
              <StickerTemplatePreview
                customerName={name.trim() || "Template"}
                insideFields={insideDraft}
                outsideFields={outsideDraft}
                layouts={stickerLayouts}
                defaults={stickerDefaults}
                onSelect={onSelectPreviewSlot}
              />
              <Link className="back-link" href="/">ยกเลิก</Link>
              <Button type="submit" className="export-button" disabled={saving}>
                {saving ? "กำลังบันทึก..." : "สร้าง Template"}
              </Button>
            </div>
          </div>
        </form>
      </>
    );
  }
}
