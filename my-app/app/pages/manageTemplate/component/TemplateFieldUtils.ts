import type { CounterType, TemplateField } from "@/app/types/template";
import type { StickerSelectableField } from "@/app/types/manage-template";

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
    const segmentKeyedField = this.normalizeSegmentKeys(field);
    const keyedField = (segmentKeyedField.fontScale as string) === "large"
      ? { ...segmentKeyedField, fontScale: "xlarge" as const }
      : segmentKeyedField;
    if (!this.isCounterField(keyedField)) return keyedField;
    if (!keyedField.segments?.length) {
      return {
        ...keyedField,
        type: keyedField.isCounter ? "number" : keyedField.type ?? "text",
        counterType: keyedField.isCounter
          ? keyedField.counterType ?? this.inferCounterType(keyedField)
          : keyedField.counterType,
      };
    }
    return {
      ...keyedField,
      segments: keyedField.segments.map((segment) => ({
        ...segment,
        type: segment.isCounter ? "number" : segment.type ?? "text",
        counterType: segment.isCounter
          ? segment.counterType ?? this.inferCounterType(keyedField)
          : segment.counterType,
        showOnSticker: segment.isCounter ? true : segment.showOnSticker,
      })),
    };
  }

  static stickerSelectableFields(fields: TemplateField[]): StickerSelectableField[] {
    return fields.flatMap((field) =>
      field.segments?.length
        ? field.segments.map((segment) => ({
          key: `${field.key}.${segment.key}`,
          label: `${field.label} - ${segment.label}${segment.isCounter ? ` (+${segment.counterType ?? this.inferCounterType(field)})` : ""}`,
          parentKey: field.key,
          parentLabel: field.label,
          parentOrder: field.stickerOrder,
          segmentLabel: segment.label,
          showOnSticker: segment.showOnSticker !== false,
          stickerOrder: segment.stickerOrder,
        }))
        : [{
          key: field.key,
          label: field.label,
          parentKey: field.key,
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

  static moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 || fromIndex >= items.length ||
      toIndex < 0 || toIndex >= items.length
    ) {
      return items;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }

  static moveField(fields: TemplateField[], fromIndex: number, toIndex: number): TemplateField[] {
    return this.moveItem(fields, fromIndex, toIndex);
  }

  static moveOutsideTable(fields: TemplateField[], fromOrder: number, toOrder: number): TemplateField[] {
    if (fromOrder === toOrder) return fields;
    const groups: Array<{ order: number; items: TemplateField[] }> = [];
    for (const field of fields) {
      const order = field.stickerGroupOrder ?? 0;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.order === order) {
        lastGroup.items.push(field);
      } else {
        groups.push({ order, items: [field] });
      }
    }
    const fromIndex = groups.findIndex((group) => group.order === fromOrder);
    const toIndex = groups.findIndex((group) => group.order === toOrder);
    if (fromIndex === -1 || toIndex === -1) return fields;
    const [moved] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, moved);
    return groups.flatMap((group, index) =>
      group.items.map((field) => ({ ...field, stickerGroupOrder: index })));
  }

  static groupSelectedStickerFields(fields: StickerSelectableField[]) {
    return fields.reduce<Array<{ key: string; label: string; fields: StickerSelectableField[] }>>((groups, field) => {
      const group = groups.find((item) => item.key === field.parentKey);
      if (group) {
        group.fields.push(field);
        return groups;
      }
      return [...groups, { key: field.parentKey, label: field.parentLabel, fields: [field] }];
    }, []);
  }
}
