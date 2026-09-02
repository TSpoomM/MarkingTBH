import { Component } from "react";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Select from "@/src/components/ui/Select";
import TemplateAutocomplete from "@/src/components/templates/TemplateAutocomplete";
import Toast from "@/src/components/ui/Toast";
import {
  STICKER_FORMAT_OPTIONS,
  STICKER_OTHER_OPTIONS,
  STICKER_SIDE_OPTIONS,
  STICKER_TYPE_OPTIONS,
} from "@/src/core/models/constants";
import type { EditTemplateFormProps } from "@/src/core/models/manage-template";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";

export default class EditTemplateForm extends Component<EditTemplateFormProps> {
  render() {
    const {
      templates,
      selectedTemplateId,
      name,
      isActive,
      insideDraft,
      outsideDraft,
      stickerLayouts,
      stickerDefaults,
      notice,
      loadingTemplates,
      loadingTemplate,
      savingTemplate,
      onDismissNotice,
      onSelectTemplate,
      onNameChange,
      onActiveChange,
      onSave,
      onCancel,
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
        <label className="template-name">
          <span>เลือก Template</span>
          <TemplateAutocomplete
            bare
            includeInactive
            selectedTemplateId={selectedTemplateId}
            templates={templates}
            placeholder={loadingTemplates ? "กำลังโหลดลูกค้า..." : "เลือก Template ที่ต้องการแก้ไข"}
            onSelectTemplate={onSelectTemplate}
            disabled={loadingTemplates || loadingTemplate}
          />
        </label>
        {!selectedTemplateId && !loadingTemplates && (
          <div className="template-empty-guide">
            <strong>เริ่มจากเลือก Template ที่ต้องการแก้ไข</strong>
            <span>หลังเลือกแล้ว ระบบจะแสดง Preview ด้านบน และ Field editor สำหรับในกรอบ/นอกกรอบด้านล่าง</span>
          </div>
        )}
        {loadingTemplate && <div className="outside-empty"><strong>กำลังโหลด Template...</strong></div>}
        {selectedTemplateId && !loadingTemplate && (
          <>
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
                <span>พิมพ์ logo FSC</span>
              </label>
            </div>
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
                <Button
                  type="button"
                  className="template-cancel-button"
                  onClick={onCancel}
                  disabled={!selectedTemplateId || loadingTemplate || savingTemplate}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  className="export-button"
                  onClick={onSave}
                  disabled={!selectedTemplateId || loadingTemplate}
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
