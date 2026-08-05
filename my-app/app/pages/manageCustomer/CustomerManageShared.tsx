import { Component } from "react";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import type { CounterType, TemplateField } from "@/app/types/customer";
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

export const inferCounterType = (field: Pick<TemplateField, "key" | "label">): CounterType => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
};

export const uniqueSegmentKey = (
  fieldKey: string,
  segmentKey: string | undefined,
  segmentIndex: number,
  usedKeys: Set<string>,
) => {
  const fallback = `${fieldKey}_${segmentIndex + 1}`;
  const baseKey = (segmentKey ?? "").trim() || fallback;
  if (!usedKeys.has(baseKey)) {
    usedKeys.add(baseKey);
    return baseKey;
  }

  let suffix = segmentIndex + 1;
  let nextKey = `${fieldKey}_${baseKey}_${suffix}`;
  while (usedKeys.has(nextKey)) {
    suffix += 1;
    nextKey = `${fieldKey}_${baseKey}_${suffix}`;
  }
  usedKeys.add(nextKey);
  return nextKey;
};

export const normalizeSegmentKeys = (field: TemplateField): TemplateField => {
  if (!field.segments?.length) return field;
  const usedKeys = new Set<string>();
  return {
    ...field,
    segments: field.segments.map((segment, index) => ({
      ...segment,
      key: uniqueSegmentKey(field.key, segment.key, index, usedKeys),
    })),
  };
};

export const normalizeCounterField = (field: TemplateField): TemplateField => {
  const keyedField = normalizeSegmentKeys(field);
  if (!keyedField.segments?.length || !isCounterField(keyedField)) return keyedField;
  const hasCounter = keyedField.segments.some((segment) => segment.isCounter);
  return {
    ...keyedField,
    segments: keyedField.segments.map((segment, index) => ({
      ...segment,
      isCounter: hasCounter ? segment.isCounter : index === 0,
      type: (hasCounter ? segment.isCounter : index === 0) ? "number" : segment.type ?? "text",
      counterType: (hasCounter ? segment.isCounter : index === 0)
        ? segment.counterType ?? inferCounterType(keyedField)
        : segment.counterType,
      showOnSticker: (hasCounter ? segment.isCounter : index === 0)
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
        label: `${field.label} - ${segment.label}${segment.isCounter ? ` (+${segment.counterType ?? inferCounterType(field)})` : ""}`,
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
    .sort((a, b) =>
      (a.parentOrder ?? a.stickerOrder ?? 0) - (b.parentOrder ?? b.stickerOrder ?? 0) ||
      (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0),
    );

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
    const {
      title,
      section,
      fields,
      onChange,
      onAdd,
      onRemove,
      onAddTable,
      onRenameTable,
      onRemoveTable,
    } = this.props;

    return (
      <div className="template-editor-panel">
        <div className="template-draft-heading">
          <h3>{title}</h3>
          <span>{fields.length} field</span>
        </div>
        {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
        {fields.map((field, index) => {
          const countableField = isCounterField(field);
          const tableOrder = field.stickerGroupOrder ?? 0;
          const previousTableOrder = fields[index - 1]?.stickerGroupOrder ?? 0;
          const nextTableOrder = fields[index + 1]?.stickerGroupOrder ?? 0;
          const showTableHeader = section === "outside" && (index === 0 || tableOrder !== previousTableOrder);
          const showTableFooter = section === "outside" && (index === fields.length - 1 || tableOrder !== nextTableOrder);
          const fieldNumber = section === "outside"
            ? fields.slice(0, index + 1).filter((item) => (item.stickerGroupOrder ?? 0) === tableOrder).length
            : index + 1;
          return (
            <div
              className={`editor-field-wrap ${section === "outside" ? "outside-field-wrap" : ""} ${section === "outside" && !showTableHeader ? "same-table-row" : ""}`}
              key={`${section}-${field.key}-${index}`}
            >
              {showTableHeader && (
                <div className="outside-editor-table-head">
                  <span>{tableOrder + 1}</span>
                  <Input
                    bare
                    value={field.stickerGroup ?? `Outside ${tableOrder + 1}`}
                    onChange={(event) => onRenameTable?.(tableOrder, event.target.value)}
                  />
                  <button type="button" onClick={() => onRemoveTable?.(tableOrder)}>
                    Delete table
                  </button>
                </div>
              )}
              <article className="editor-field">
                <div className="editor-number">{fieldNumber}</div>
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
                {section === "outside" && (
                  <label className="required-toggle">
                    <Input
                      bare
                      type="checkbox"
                      checked={field.uppercase ?? true}
                      onChange={(event) => onChange(section, index, { uppercase: event.target.checked })}
                    />
                    <span>Uppercase</span>
                  </label>
                )}
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
                    <label key={`${field.key}-${segment.key}-${segmentIndex}`}>
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
                                isCounter: itemIndex === segmentIndex ? !item.isCounter : item.isCounter,
                                type: itemIndex === segmentIndex && !item.isCounter ? "number" : item.type ?? "text",
                                counterType: itemIndex === segmentIndex && !item.isCounter
                                  ? item.counterType ?? inferCounterType(field)
                                  : item.counterType,
                              })),
                            })}
                          >
                            Count
                          </button>
                        )}
                        {segment.isCounter && (
                          <Select
                            bare
                            value={segment.counterType ?? inferCounterType(field)}
                            onChange={(event) => onChange(section, index, {
                              segments: field.segments?.map((item, itemIndex) =>
                                itemIndex === segmentIndex
                                  ? { ...item, counterType: event.target.value as CounterType }
                                  : item,
                              ),
                            })}
                            aria-label="Counter type"
                          >
                            <option value="lot">Lot</option>
                            <option value="pallet">Pallet</option>
                          </Select>
                        )}
                        <button
                          type="button"
                          disabled={(field.segments?.length ?? 0) <= 1}
                          onClick={() => {
                            const segments = field.segments?.filter((_, itemIndex) => itemIndex !== segmentIndex) ?? [];
                            onChange(section, index, {
                              segments: segments.map((item) => ({
                                ...item,
                                type: countableField && item.isCounter ? "number" : item.type ?? "text",
                                counterType: countableField && item.isCounter
                                  ? item.counterType ?? inferCounterType(field)
                                  : item.counterType,
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
                          showOnSticker: true,
                          stickerOrder: (field.stickerOrder ?? index) * 10 + (field.segments?.length ?? 0),
                          isCounter: false,
                          counterType: inferCounterType(field),
                        },
                      ],
                    })}
                  >
                    +1
                  </button>
                </div>
              )}
              {showTableFooter && (
                <button
                  type="button"
                  className="outside-add-row-button"
                  onClick={() => onAdd(section, tableOrder)}
                >
                  Add Row
                </button>
              )}
            </div>
          );
        })}
        {section === "outside" && (
          <Button className="add-field-button" onClick={onAddTable}>
            Add Table
          </Button>
        )}
        {section !== "outside" && (
        <Button className="add-field-button" onClick={() => onAdd(section)}>
          เพิ่ม Field
        </Button>
        )}
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
    const { title, customerName, fields } = this.props;
    const selectedFields = selectedStickerFields(fields);
    const groupedFields = groupSelectedStickerFields(selectedFields);

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
                  {group.fields.map((selected) => (
                    <input
                      disabled
                      value={selected.label}
                      key={selected.key}
                      aria-label={selected.segmentLabel ?? selected.label}
                      readOnly
                    />
                  ))}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </article>
    );
  }
}
