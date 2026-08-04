import { Component } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import type { TemplateField } from "@/app/types/customer";
import type {
  ChoiceProps,
  ConditionSelectorProps,
  FieldCondition,
  OptionGroupProps,
  PreviewStickerProps,
  SectionHeadingProps,
  StickerSelectableField,
  StickerTemplatePreviewProps,
  TemplateFieldEditorProps,
} from "@/app/types/manage-customer";

export const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const isCounterField = (field: Pick<TemplateField, "key" | "label">) => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  return key.includes("lot") || key.includes("pallet") || label.includes("lot") || label.includes("pallet");
};

export const normalizeCounterField = (field: TemplateField): TemplateField => {
  if (!field.segments?.length || !isCounterField(field)) return field;
  const counterIndex = field.segments.findIndex((segment) => segment.isCounter);
  return {
    ...field,
    segments: field.segments.map((segment, index) => ({
      ...segment,
      isCounter: counterIndex >= 0 ? index === counterIndex : index === 0,
      type: (counterIndex >= 0 ? index === counterIndex : index === 0) ? "number" : segment.type ?? "text",
      showOnSticker: (counterIndex >= 0 ? index === counterIndex : index === 0)
        ? true
        : segment.showOnSticker,
    })),
  };
};

const stickerSelectableFields = (fields: TemplateField[]): StickerSelectableField[] =>
  fields.flatMap((field) =>
    field.segments?.length
      ? field.segments.map((segment) => ({
        key: `${field.key}.${segment.key}`,
        label: `${field.label} - ${segment.label}${segment.isCounter ? " (+1)" : ""}`,
        parentLabel: field.label,
        parentOrder: field.stickerOrder,
        segmentLabel: segment.label,
        showOnSticker: segment.showOnSticker !== false,
        stickerOrder: segment.stickerOrder,
      }))
      : [{
        key: field.key,
        label: field.label,
        parentLabel: field.label,
        parentOrder: field.stickerOrder,
        showOnSticker: field.showOnSticker !== false,
        stickerOrder: field.stickerOrder,
      }],
  );

const selectedStickerFields = (fields: TemplateField[]) =>
  stickerSelectableFields(fields)
    .filter((field) => field.showOnSticker)
    .sort((a, b) => (a.parentOrder ?? a.stickerOrder ?? 0) - (b.parentOrder ?? b.stickerOrder ?? 0));

const groupSelectedStickerFields = (fields: StickerSelectableField[]) =>
  fields.reduce<Array<{ label: string; fields: StickerSelectableField[] }>>((groups, field) => {
    const group = groups.find((item) => item.label === field.parentLabel);
    if (group) {
      group.fields.push(field);
      return groups;
    }
    return [...groups, { label: field.parentLabel, fields: [field] }];
  }, []);

const conditionText = (condition: FieldCondition) => {
  if (!condition?.stickerType && !condition?.stickerOther) return "ทุกกรณี";
  return [
    condition.stickerType && `Type = ${condition.stickerType}`,
    condition.stickerOther && `Other = ${condition.stickerOther}`,
  ].filter(Boolean).join(", ");
};

export const cleanCondition = (condition: FieldCondition) =>
  condition?.stickerType || condition?.stickerOther ? condition : undefined;

export class SectionHeading extends Component<SectionHeadingProps> {
  render() {
    const { number, title, subtitle } = this.props;
    return <div className="config-heading"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
  }
}

export class OptionGroup extends Component<OptionGroupProps> {
  render() {
    const { label, hint, children } = this.props;
    return <div className="option-group"><div><strong>{label}</strong>{hint && <small>{hint}</small>}</div><div className="choice-list">{children}</div></div>;
  }
}

export class Choice extends Component<ChoiceProps> {
  render() {
    const { label, description, checked, onChange } = this.props;
    return <label className={`choice ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={onChange} /><span><b>{label}</b>{description && <small>{description}</small>}</span></label>;
  }
}

export class ConditionSelector extends Component<ConditionSelectorProps> {
  private setType = (stickerType: string) => {
    this.props.onChange(cleanCondition({
      ...this.props.value,
      stickerType: stickerType ? stickerType as NonNullable<FieldCondition>["stickerType"] : undefined,
    }));
  };

  private setOther = (stickerOther: string) => {
    this.props.onChange(cleanCondition({
      ...this.props.value,
      stickerOther: stickerOther ? stickerOther as NonNullable<FieldCondition>["stickerOther"] : undefined,
    }));
  };

  render() {
    const { value, disabled = false } = this.props;

    return (
      <div className="condition-selector">
        <span>บังคับเมื่อ</span>
        <select
          value={value?.stickerType ?? ""}
          disabled={disabled}
          onChange={(event) => this.setType(event.target.value)}
          aria-label="เงื่อนไข Type"
        >
          <option value="">ทุก Type</option>
          <option value="TNR">Type = TNR</option>
          <option value="NON-TNR">Type = NON-TNR</option>
          <option value="FCS">Type = FCS</option>
        </select>
        <select
          value={value?.stickerOther ?? ""}
          disabled={disabled}
          onChange={(event) => this.setOther(event.target.value)}
          aria-label="เงื่อนไข Other"
        >
          <option value="">ทุก Other</option>
          <option value="Dome">Other = Dome</option>
          <option value="Inter">Other = Inter</option>
        </select>
        <small>{conditionText(value)}</small>
      </div>
    );
  }
}

export class TemplateFieldEditor extends Component<TemplateFieldEditorProps> {
  render() {
    const { title, section, fields, onChange, onAdd, onRemove } = this.props;

    return (
      <div className="template-editor-panel">
        <div className="template-draft-heading">
          <h3>{title}</h3>
          <span>{fields.length} field</span>
        </div>
        {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const countableField = isCounterField(field);
          return (
            <div className="editor-field-wrap" key={`${section}-${field.key}-${index}`}>
              <article className="editor-field">
                <div className="editor-number">{index + 1}</div>
                <label>
                  <span>ชื่อ Field</span>
                  <Input bare value={field.label} onChange={(event) => onChange(section, index, { label: event.target.value })} />
                </label>
                <label>
                  <span>ชนิดข้อมูล</span>
                  <Select
                    bare
                    value={field.type}
                    onChange={(event) => onChange(section, index, { type: event.target.value as TemplateField["type"] })}
                  >
                    <option value="text">ข้อความ</option>
                    <option value="number">ตัวเลข</option>
                    <option value="date">วันที่</option>
                    <option value="textarea">ข้อความหลายบรรทัด</option>
                  </Select>
                </label>
                <label className="required-toggle">
                  <Input
                    bare
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => onChange(section, index, { required: event.target.checked })}
                  />
                  <span>บังคับกรอก</span>
                </label>
                <ConditionSelector
                  value={field.condition}
                  disabled={!field.required}
                  onChange={(condition) => onChange(section, index, { condition })}
                />
                <Button className="delete-field" onClick={() => onRemove(section, index)}>ลบ</Button>
              </article>
              {!!field.segments?.length && (
                <div className="editor-segments-row">
                  <span>Section</span>
                  {field.segments.map((segment, segmentIndex) => (
                    <label key={segment.key}>
                      <small>
                        {segmentIndex + 1}
                        {segment.isCounter ? " +1" : ""}
                      </small>
                      <div className="editor-segment-control">
                        <Input
                          bare
                          value={segment.label}
                          onChange={(event) => onChange(section, index, {
                            segments: field.segments?.map((item, itemIndex) =>
                              itemIndex === segmentIndex ? { ...item, label: event.target.value } : item,
                            ),
                          })}
                        />
                        {countableField && (
                          <button
                            type="button"
                            className={segment.isCounter ? "count-segment active" : "count-segment"}
                            onClick={() => onChange(section, index, {
                              segments: field.segments?.map((item, itemIndex) => ({
                                ...item,
                                isCounter: itemIndex === segmentIndex,
                                type: itemIndex === segmentIndex ? "number" : "text",
                              })),
                            })}
                          >
                            Count
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={(field.segments?.length ?? 0) <= 1}
                          onClick={() => {
                            const segments = field.segments?.filter((_, itemIndex) => itemIndex !== segmentIndex) ?? [];
                            const counterIndex = segments.findIndex((item) => item.isCounter);
                            onChange(section, index, {
                              segments: segments.map((item, itemIndex) => ({
                                ...item,
                                isCounter: countableField ? (counterIndex >= 0 ? itemIndex === counterIndex : itemIndex === 0) : item.isCounter,
                                type: countableField && (counterIndex >= 0 ? itemIndex === counterIndex : itemIndex === 0) ? "number" : item.type ?? "text",
                              })),
                            });
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    className="add-segment-button"
                    onClick={() => onChange(section, index, {
                      segments: [
                        ...(field.segments ?? []),
                        {
                          key: `${field.key}_${uid()}`,
                          label: `Section ${(field.segments?.length ?? 0) + 1}`,
                          type: "text",
                          showOnSticker: false,
                          isCounter: false,
                        },
                      ],
                    })}
                  >
                    +1
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <Button className="add-field-button" onClick={() => onAdd(section)}>
          เพิ่ม Field
        </Button>
      </div>
    );
  }
}

export class StickerTemplatePreview extends Component<StickerTemplatePreviewProps> {
  render() {
    const { customerName, insideFields, outsideFields, onSelect } = this.props;

    return (
      <div className="sticker-preview-wrap">
        <div className="template-draft-heading">
          <h3>Preview Sticker</h3>
          <span>ตัวอย่าง 1 ดวง</span>
        </div>
        <div className="sticker-preview-grid">
          <PreviewSticker
            title="ในกรอบ"
            section="inside"
            customerName={customerName}
            fields={insideFields}
            onSelect={onSelect}
          />
          <PreviewSticker
            title="นอกกรอบ"
            section="outside"
            customerName={customerName}
            fields={outsideFields}
            onSelect={onSelect}
          />
        </div>
      </div>
    );
  }
}

class PreviewSticker extends Component<PreviewStickerProps> {
  render() {
    const { title, section, customerName, fields, onSelect } = this.props;
    const selectableFields = stickerSelectableFields(fields);
    const selectedFields = selectedStickerFields(fields);
    const groupedFields = groupSelectedStickerFields(selectedFields);
    const nextOrder = selectedFields.reduce((max, field) => Math.max(max, field.stickerOrder ?? 0), -1) + 1;

    return (
      <article className="sticker-preview-card">
        <header>
          <strong>{title}</strong>
          <span>{customerName}</span>
        </header>
        <dl>
          {groupedFields.map((group) => (
            <div className="sticker-preview-select-row" key={group.label}>
              <dt>{group.label}</dt>
              <dd>
                <div className="sticker-preview-section-selects">
                  {group.fields.map((selected, index) => (
                    <select
                      value={selected.key}
                      key={selected.key}
                      aria-label={selected.segmentLabel ?? selected.label}
                      onChange={(event) => onSelect(section, selected.stickerOrder ?? index, event.target.value)}
                    >
                      <option value="">ไม่แสดง</option>
                      {selectableFields.map((field) => (
                        <option value={field.key} key={field.key}>{field.label}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </dd>
            </div>
          ))}
          <div className="sticker-preview-select-row">
            <dt>เพิ่มข้อมูล</dt>
            <dd>
              <select value="" onChange={(event) => onSelect(section, nextOrder, event.target.value)}>
                <option value="">เลือก field</option>
                {selectableFields
                  .filter((field) => !field.showOnSticker)
                  .map((field) => (
                    <option value={field.key} key={field.key}>{field.label}</option>
                  ))}
              </select>
            </dd>
          </div>
        </dl>
      </article>
    );
  }
}
