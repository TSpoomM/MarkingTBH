import type { CounterType, TemplateField } from "@/app/types/customer";
import type { FieldCondition, StickerSelectableField } from "@/app/types/manage-customer";

export default class TemplateFieldUtils {
  static uid() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  static isCounterField(field: Pick<TemplateField, "key" | "label">) {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("lot") || key.includes("pallet") || label.includes("lot") || label.includes("pallet");
  }

  static inferCounterType(field: Pick<TemplateField, "key" | "label">): CounterType {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  static uniqueSegmentKey(
    fieldKey: string,
    segmentKey: string | undefined,
    segmentIndex: number,
    usedKeys: Set<string>,
  ) {
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
  }

  static normalizeSegmentKeys(field: TemplateField): TemplateField {
    if (!field.segments?.length) return field;
    const usedKeys = new Set<string>();
    return {
      ...field,
      segments: field.segments.map((segment, index) => ({
        ...segment,
        key: this.uniqueSegmentKey(field.key, segment.key, index, usedKeys),
      })),
    };
  }

  static normalizeCounterField(field: TemplateField): TemplateField {
    const keyedField = this.normalizeSegmentKeys(field);
    if (!keyedField.segments?.length || !this.isCounterField(keyedField)) return keyedField;
    const hasCounter = keyedField.segments.some((segment) => segment.isCounter);
    return {
      ...keyedField,
      segments: keyedField.segments.map((segment, index) => ({
        ...segment,
        isCounter: hasCounter ? segment.isCounter : index === 0,
        type: (hasCounter ? segment.isCounter : index === 0) ? "number" : segment.type ?? "text",
        counterType: (hasCounter ? segment.isCounter : index === 0)
          ? segment.counterType ?? this.inferCounterType(keyedField)
          : segment.counterType,
        showOnSticker: (hasCounter ? segment.isCounter : index === 0)
          ? true
          : segment.showOnSticker,
      })),
    };
  }

  static cleanCondition(condition: FieldCondition) {
    return condition?.stickerType || condition?.stickerOther ? condition : undefined;
  }

  static conditionText(condition: FieldCondition) {
    if (!condition?.stickerType && !condition?.stickerOther) return "ทุกกรณี";
    return [
      condition.stickerType && `Type = ${condition.stickerType}`,
      condition.stickerOther && `Other = ${condition.stickerOther}`,
    ].filter(Boolean).join(", ");
  }

  static stickerSelectableFields(fields: TemplateField[]): StickerSelectableField[] {
    return fields.flatMap((field) =>
      field.segments?.length
        ? field.segments.map((segment) => ({
          key: `${field.key}.${segment.key}`,
          label: `${field.label} - ${segment.label}${segment.isCounter ? ` (+${segment.counterType ?? this.inferCounterType(field)})` : ""}`,
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
  }

  static selectedStickerFields(fields: TemplateField[]) {
    return this.stickerSelectableFields(fields)
      .filter((field) => field.showOnSticker)
      .sort((a, b) =>
        (a.parentOrder ?? a.stickerOrder ?? 0) - (b.parentOrder ?? b.stickerOrder ?? 0) ||
        (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0),
      );
  }

  static groupSelectedStickerFields(fields: StickerSelectableField[]) {
    return fields.reduce<Array<{ label: string; fields: StickerSelectableField[] }>>((groups, field) => {
      const group = groups.find((item) => item.label === field.parentLabel);
      if (group) {
        group.fields.push(field);
        return groups;
      }
      return [...groups, { label: field.parentLabel, fields: [field] }];
    }, []);
  }
}
