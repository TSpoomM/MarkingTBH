import { Component } from "react";
import cn from "@/src/core/ui/cn";
import {
  CONFIG_CARD, DEFAULT_CHECK, DEFAULT_GRID, EMPTY_GUIDE, NAME_STATUS_ROW, OUTSIDE_EMPTY,
  OUTSIDE_TITLE, STATUS_CAPTION, STATUS_FIELD, STATUS_OPTION, STATUS_TOGGLE, STATUS_TOGGLE_ACTIVE,
  STATUS_TOGGLE_INACTIVE, TEMPLATE_MANAGER_GRID, TEMPLATE_NAME_BOX,
} from "@/src/core/ui/template";
import { ACTION_BAR, ACTION_BAR_BUTTONS } from "@/src/core/ui/surfaces";
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
      <section className={CONFIG_CARD}>
        <div className={OUTSIDE_TITLE}>
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
        <label className={TEMPLATE_NAME_BOX}>
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
          <div className={EMPTY_GUIDE}>
            <strong>เริ่มจากเลือก Template ที่ต้องการแก้ไข</strong>
            <span>หลังเลือกแล้ว ระบบจะแสดง Preview ด้านบน และ Field editor สำหรับในกรอบ/นอกกรอบด้านล่าง</span>
          </div>
        )}
        {loadingTemplate && <div className={OUTSIDE_EMPTY}><strong>กำลังโหลด Template...</strong></div>}
        {selectedTemplateId && !loadingTemplate && (
          <>
            <div className={NAME_STATUS_ROW}>
              <label className={TEMPLATE_NAME_BOX}>
                <span>ชื่อ Template *</span>
                <Input
                  bare
                  value={name}
                  onChange={(event) => onNameChange(event.target.value.toUpperCase())}
                  placeholder="ABC Rubber Co., Ltd."
                />
              </label>
              <div className={STATUS_FIELD}>
                <span className={STATUS_CAPTION}>Status</span>
                <Button
                  type="button"
                  variant="ghost"
                  wrapContent={false}
                  className={cn(STATUS_TOGGLE, isActive ? STATUS_TOGGLE_ACTIVE : STATUS_TOGGLE_INACTIVE)}
                  onClick={() => onActiveChange(!isActive)}
                  aria-pressed={isActive}
                >
                  <span className={STATUS_OPTION}>Inactive</span>
                  <span className={STATUS_OPTION}>Active</span>
                </Button>
              </div>
            </div>
            <div className={DEFAULT_GRID}>
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
              <label className={DEFAULT_CHECK}>
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
            <div className={TEMPLATE_MANAGER_GRID}>
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
            <div className={ACTION_BAR}>
              <div className={ACTION_BAR_BUTTONS}>
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
                  variant="secondary"
                  size="lg"
                  onClick={onCancel}
                  disabled={!selectedTemplateId || loadingTemplate || savingTemplate}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  variant="primary"
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
