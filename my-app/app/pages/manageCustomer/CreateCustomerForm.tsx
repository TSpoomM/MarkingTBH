import Link from "next/link";
import { Component } from "react";
import Toast from "@/app/components/Toast";
import type { CreateCustomerFormProps } from "@/app/types/manage-customer";
import {
  Choice,
  OptionGroup,
  SectionHeading,
  StickerTemplatePreview,
  TemplateFieldEditor,
} from "./CustomerManageShared";

export default class CreateCustomerForm extends Component<CreateCustomerFormProps> {
  render() {
    const {
      name,
      stickerFields,
      stickerLayouts,
      insideDraft,
      outsideDraft,
      notice,
      saving,
      onDismissNotice,
      onSubmit,
      onNameChange,
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
        <div className="customer-create-steps">
          <span className="active">1. Customer</span>
          <span className="active">2. User fields</span>
          <span className="active">3. Sticker layout</span>
          <span className="active">4. Template</span>
        </div>
        <form onSubmit={onSubmit}>
          <section className="config-card">
            <SectionHeading
              number="1"
              title="Add Customer"
              subtitle="Create the customer and finish the sticker template in one save"
            />
            <label className="customer-name">
              <span>Customer name *</span>
              <input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="ABC Rubber Co., Ltd."
              />
            </label>
            <OptionGroup
              label="Fields shown to user *"
              hint="Side and Format are required for sticker quantity calculation"
            >
              {([
                ["side", "Side", "User selects 1-6"],
                ["format", "Format", "User selects 5533 or 555"],
                ["type", "Type", "User selects TNR, NON-TNR or FCS"],
                ["other", "Other", "User selects Dome or Inter"],
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
              label="Sticker layouts to print *"
              hint="Choose at least one output format for this customer"
            >
              {([
                ["insideFrame", "Inside frame", "A4 landscape 2x2"],
                ["outsideFrame", "Outside frame", "A4 landscape 2x2"],
                ["customerName", "Customer name", "A4 portrait 2x16"],
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
              number="2"
              title="Sticker Template"
              subtitle="Set fields, required rules, conditions, counter segments and sticker preview before creating"
            />
            <StickerTemplatePreview
              customerName={name.trim() || "Customer"}
              insideFields={insideDraft}
              outsideFields={outsideDraft}
              onSelect={onSelectPreviewSlot}
            />
            <div className="template-manager-grid">
              <TemplateFieldEditor
                title="Inside sticker"
                section="inside"
                fields={insideDraft}
                onChange={onChangeField}
                onAdd={onAddField}
                onRemove={onRemoveField}
              />
              <TemplateFieldEditor
                title="Outside sticker"
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
            <Link href="/">Cancel</Link>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      </>
    );
  }
}
