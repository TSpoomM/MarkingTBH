import type { TemplateDetail, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import {
  DEFAULT_STICKER_DEFAULTS,
} from "@/src/core/models/template-form";
import {
  fixedInsideFields,
  initialGroups,
  type TemplateFormState,
} from "@/src/core/models/manage-template";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import DateFormatter from "@/src/core/dates/dateFormatter";

const REQUIRED_STICKER_FIELDS: TemplateDetail["sticker"]["enabledFields"] = ["side", "format", "type", "other"];

export default class TemplateFormDefaults {
  static createDefaultInsideDraft(): TemplateField[] {
    return [
      ...initialGroups.map((group, groupIndex) => TemplateFieldUtils.normalizeCounterField({
        key: group.key,
        label: group.label,
        type: "text" as const,
        required: true,
        showOnSticker: true,
        stickerOrder: groupIndex,
        segments: group.segments.map((segment, segmentIndex) => ({
          ...segment,
          showOnSticker: true,
          stickerOrder: groupIndex * 10 + segmentIndex,
        })),
      })),
      ...fixedInsideFields.map((field, index) => ({
        ...field,
        type: "text" as const,
        showOnSticker: true,
        stickerOrder: initialGroups.length + index,
      })),
    ];
  }

  static normalizeDraftField(section: "inside" | "outside", field: TemplateField): TemplateField {
    const isVerticalOutside = section === "outside" && this.isVerticalStickerGroupLayout(field.stickerGroupLayout);
    return TemplateFieldUtils.normalizeCounterField({
      ...field,
      label: field.label.toUpperCase(),
      segments: field.segments?.map((segment) => ({
        ...segment,
        label: segment.label.toUpperCase(),
      })),
      type: field.isCounter ? "number" : field.type ?? "text",
      required: true,
      condition: undefined,
      fontScale: section === "outside" && !isVerticalOutside ? field.fontScale : undefined,
      isCounter: section === "outside" && !field.segments?.length ? field.isCounter : undefined,
      counterType: section === "outside" && !field.segments?.length ? field.counterType : undefined,
      showOnSticker: field.showOnSticker ?? true,
      uppercase: section === "outside" ? field.uppercase ?? true : field.uppercase,
      defaultValue: !field.segments?.length && field.locked
        ? field.defaultValue ?? field.label
        : section === "outside" ? undefined : field.defaultValue,
      dateFormat: field.type === "date" ? DateFormatter.normalizeFormat(field.dateFormat) : undefined,
      locked: !field.segments?.length ? field.locked : false,
    });
  }

  static cloneTemplateField(field: TemplateField): TemplateField {
    return {
      ...field,
      condition: field.condition ? { ...field.condition } : undefined,
      segments: field.segments?.map((segment) => ({ ...segment })),
    };
  }

  static withRequiredStickerFields() {
    return [...REQUIRED_STICKER_FIELDS];
  }

  static withRequiredStickerLayouts(layouts: TemplateFormState["stickerLayouts"]): TemplateFormState["stickerLayouts"] {
    return { ...layouts };
  }

  static normalizeStickerGroupLayout(layout: TemplateField["stickerGroupLayout"]): StickerGroupLayout {
    return layout === "8x2" || layout === "4x2" ? "8x2" : "2x2";
  }

  static isVerticalStickerGroupLayout(layout: TemplateField["stickerGroupLayout"]) {
    return this.normalizeStickerGroupLayout(layout) === "8x2";
  }

  static enforceOutsideVerticalSingleRows(fields: TemplateField[]) {
    const seenVerticalGroups = new Set<number>();
    return fields.filter((field, index) => {
      const groupOrder = field.stickerGroupOrder ?? index;
      if (!this.isVerticalStickerGroupLayout(field.stickerGroupLayout)) return true;
      if (seenVerticalGroups.has(groupOrder)) return false;
      seenVerticalGroups.add(groupOrder);
      return true;
    });
  }

  static defaultStickerDefaults() {
    return { ...DEFAULT_STICKER_DEFAULTS };
  }
}
