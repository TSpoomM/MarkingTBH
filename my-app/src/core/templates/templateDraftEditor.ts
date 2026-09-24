import type { StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import type { TemplateFieldPreset, TemplateSection } from "@/src/core/models/manage-template";
import TemplateFormDefaults from "@/src/core/templates/templateFormDefaults";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";

/**
 * Pure edits over a template draft (a TemplateField[]). Each method returns the next
 * fields instead of writing state, so TemplateManageController only decides which
 * draft to read and store, and these transformations stay testable on their own.
 */
export default class TemplateDraftEditor {
  static patchField(section: TemplateSection, fields: TemplateField[], index: number, fieldPatch: Partial<TemplateField>) {
    return fields.map((field, fieldIndex) =>
      fieldIndex === index
        ? TemplateFormDefaults.normalizeDraftField(section, { ...field, ...fieldPatch })
        : field,
    );
  }

  /** Returns undefined when the target table is a vertical one, which never takes extra rows. */
  static addField(section: TemplateSection, fields: TemplateField[], tableOrder: number | undefined, preset: TemplateFieldPreset) {
    const outsideGroup = section === "outside" ? this.outsideGroup(fields, tableOrder) : undefined;
    if (section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(outsideGroup?.layout)) return undefined;
    const hasDestinationField = fields.some((field) =>
      field.key.trim().toLowerCase() === "destination" ||
      field.label.trim().toLowerCase() === "destination",
    );
    const fieldKey = preset === "destination" && !hasDestinationField
      ? "destination"
      : `${section}_${preset}_${TemplateFieldUtils.uid()}`;
    const isSectionPreset = preset === "section";
    const nextField: TemplateField = {
      key: fieldKey,
      label: preset === "destination" ? "DESTINATION" : isSectionPreset ? "SECTION" : "",
      type: "text",
      required: true,
      showOnSticker: true,
      stickerGroup: outsideGroup?.name,
      stickerGroupOrder: outsideGroup?.order,
      stickerGroupLayout: outsideGroup?.layout,
      uppercase: true,
      segments: isSectionPreset
        ? [{
          key: `${fieldKey}_1`,
          label: "SECTION 1",
          type: "number",
          showOnSticker: true,
          isCounter: true,
          counterType: "lot",
        }]
        : undefined,
    };
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(fields, outsideGroup?.order ?? 0) + 1
      : fields.length;
    return TemplateFieldUtils.renumberStickerOrders([
      ...fields.slice(0, insertIndex),
      nextField,
      ...fields.slice(insertIndex),
    ]);
  }

  static removeField(fields: TemplateField[], index: number) {
    return TemplateFieldUtils.renumberStickerOrders(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  static moveField(section: TemplateSection, fields: TemplateField[], fromIndex: number, toIndex: number, tableOrder?: number) {
    return TemplateFieldUtils.moveField(fields, fromIndex, toIndex, section === "outside" ? tableOrder : undefined);
  }

  static addTable(fields: TemplateField[], layout: StickerGroupLayout) {
    const tableOrder = this.nextOutsideGroupOrder(fields);
    return TemplateFieldUtils.renumberStickerOrders([
      ...fields,
      {
        key: `outside_field_${TemplateFieldUtils.uid()}`,
        label: "",
        type: "text",
        required: true,
        showOnSticker: true,
        stickerGroup: `นอกกรอบ ${tableOrder + 1}`,
        stickerGroupOrder: tableOrder,
        stickerGroupLayout: layout,
        uppercase: true,
        fontScale: undefined,
      },
    ]);
  }

  static renameTable(fields: TemplateField[], tableOrder: number, name: string) {
    return fields.map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
    );
  }

  static changeTableLayout(fields: TemplateField[], tableOrder: number, layout: StickerGroupLayout) {
    const isVertical = TemplateFormDefaults.isVerticalStickerGroupLayout(layout);
    const nextFields = fields.map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder
        ? { ...field, stickerGroupLayout: layout, fontScale: isVertical ? undefined : field.fontScale }
        : field,
    );
    return isVertical ? TemplateFormDefaults.enforceOutsideVerticalSingleRows(nextFields) : nextFields;
  }

  static removeTable(fields: TemplateField[], tableOrder: number) {
    return TemplateFieldUtils.renumberStickerOrders(
      TemplateFieldUtils.renumberOutsideTableOrders(
        fields.filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
      ),
    );
  }

  static moveTable(fields: TemplateField[], fromOrder: number, toOrder: number) {
    return TemplateFieldUtils.moveOutsideTable(fields, fromOrder, toOrder);
  }

  /** Puts one field into a sticker preview slot and clears whoever held that slot. */
  static assignPreviewSlot(fields: TemplateField[], slotIndex: number, fieldKey: string) {
    const [targetFieldKey, targetSegmentKey] = fieldKey.split(".");
    return fields.map((field) => {
      if (field.segments?.length) {
        return {
          ...field,
          segments: field.segments.map((segment) => {
            const isTarget = field.key === targetFieldKey && segment.key === targetSegmentKey;
            const isSameSlot = segment.stickerOrder === slotIndex;
            if (isTarget) return { ...segment, showOnSticker: true, stickerOrder: slotIndex };
            if (isSameSlot) return { ...segment, showOnSticker: false, stickerOrder: undefined };
            return segment;
          }),
        };
      }
      if (field.key === targetFieldKey) {
        return fieldKey ? { ...field, showOnSticker: true, stickerOrder: slotIndex } : field;
      }
      if (field.stickerOrder === slotIndex) {
        return { ...field, showOnSticker: false, stickerOrder: undefined };
      }
      return field;
    });
  }

  private static lastOutsideGroupIndex(fields: TemplateField[], tableOrder: number) {
    return fields.reduce((lastIndex, field, index) =>
      (field.stickerGroupOrder ?? 0) === tableOrder ? index : lastIndex,
      -1);
  }

  private static outsideGroup(fields: TemplateField[], requestedOrder?: number) {
    if (!fields.length) return { order: 0, name: "นอกกรอบ 1", layout: "2x2" as const };
    const order = requestedOrder ?? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0));
    const field = [...fields].reverse().find((item) => (item.stickerGroupOrder ?? 0) === order);
    return {
      order,
      name: field?.stickerGroup ?? `นอกกรอบ ${order + 1}`,
      layout: TemplateFormDefaults.normalizeStickerGroupLayout(field?.stickerGroupLayout),
    };
  }

  private static nextOutsideGroupOrder(fields: TemplateField[]) {
    return fields.length ? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0)) + 1 : 0;
  }
}
