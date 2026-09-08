import Link from "next/link";
import cn from "@/src/core/ui/cn";
import {
  BACK_LINK, CONFIG_CARD, DEFAULT_CHECK, DEFAULT_GRID, NAME_STATUS_ROW, STATUS_CAPTION, STATUS_FIELD, STATUS_OPTION, STATUS_TOGGLE, STATUS_TOGGLE_ACTIVE,
  STATUS_TOGGLE_INACTIVE, TEMPLATE_MANAGER_GRID, TEMPLATE_NAME_BOX, } from "@/src/core/ui/template";
import { ACTION_BAR, ACTION_BAR_BUTTONS } from "@/src/core/ui/surfaces";
import { Component } from "react";
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
import type { CreateTemplateFormProps } from "@/src/core/models/manage-template";
import SectionHeading from "./SectionHeading";
import StickerTemplatePreview from "./StickerTemplatePreview";
import TemplateFieldEditor from "./TemplateFieldEditor";
import Button from "@/src/components/ui/Button";

export default class CreateTemplateForm extends Component<CreateTemplateFormProps> {
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
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <section className={cn(CONFIG_CARD, "relative z-20 overflow-visible")}>
            <SectionHeading
              number="1"
              title="เพิ่ม Template"
              subtitle="กรอกชื่อลูกค้าและตั้งค่าสติ๊กเกอร์ให้ครบ แล้วบันทึกในขั้นตอนเดียว"
            />
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
            <label className={cn(TEMPLATE_NAME_BOX, "mt-3.5")}>
              <span>คัดลอก Template จาก</span>
              <TemplateAutocomplete
                bare
                selectedTemplateId={duplicateSourceTemplateId}
                templates={templates}
                placeholder={loadingTemplates ? "กำลังโหลดลูกค้า..." : "เริ่มจากว่างเปล่า หรือเลือก Template เดิม"}
                onSelectTemplate={onDuplicateSourceChange}
                disabled={loadingTemplates || duplicatingTemplate}
              />
              <small>{duplicatingTemplate ? "กำลังคัดลอก Template..." : "คัดลอก Field และรูปแบบสติ๊กเกอร์ แล้วแก้ไขก่อนสร้าง Template ใหม่"}</small>
            </label>
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
          </section>

          <section className={CONFIG_CARD}>
            <SectionHeading
              number="2"
              title="ตั้งค่า Sticker Template"
              subtitle="กำหนด Field, เงื่อนไขบังคับ, Segment ตัวนับ และดู Preview ก่อนสร้าง Template"
            />
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
          </section>

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
              <Link className={BACK_LINK} href="/">ยกเลิก</Link>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "กำลังบันทึก..." : "สร้าง Template"}
              </Button>
            </div>
          </div>
        </form>
      </>
    );
  }
}
