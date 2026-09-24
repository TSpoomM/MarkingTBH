import type { TemplateField } from "@/src/core/models/template";
import type { TemplateFormState, TemplateFormTarget, TemplateSection } from "@/src/core/models/manage-template";
import TemplateFormDefaults from "@/src/core/templates/templateFormDefaults";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import DateFormatter from "@/src/core/dates/dateFormatter";

/** The two drafts report the same problems with different wording. */
const VALIDATION_MESSAGES: Record<TemplateFormTarget, { emptyLabel: string; noLayout: string; duplicateKey: string }> = {
  edit: {
    emptyLabel: "กรุณากรอกชื่อ Field ให้ครบ",
    noLayout: "เลือกรูปแบบสติ๊กเกอร์ที่ต้องพิมพ์อย่างน้อย 1 แบบ",
    duplicateKey: "ชื่อ Field บางรายการซ้ำกันในระบบ กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง",
  },
  create: {
    emptyLabel: "กรุณากรอกชื่อ Field ให้ครบทุกช่อง",
    noLayout: "กรุณาเลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ",
    duplicateKey: "มี Field ที่ซ้ำกัน กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง",
  },
};

/** Turns a draft into what is sent to the API (cleanFields) and decides whether it may be sent at all (validate). */
export default class TemplateDraftSubmission {
  static cleanFields(section: TemplateSection, fields: TemplateField[]) {
    const cleaned = fields.map((field, index) => {
      const fieldKey = field.key.trim() || `${section}_field_${TemplateFieldUtils.uid()}`;
      const usedSegmentKeys = new Set<string>();
      const hasSegmentAffixes = field.segments?.some((segment) => segment.prefix?.trim() || segment.suffix?.trim());
      const isVerticalOutside = section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(field.stickerGroupLayout);
      return TemplateFieldUtils.normalizeCounterField({
        ...field,
        key: fieldKey,
        label: field.label.trim().toUpperCase(),
        type: field.isCounter ? "number" : field.type ?? "text",
        displayFormat: hasSegmentAffixes ? undefined : field.displayFormat?.trim() || undefined,
        dateFormat: field.type === "date" ? DateFormatter.normalizeFormat(field.dateFormat) : undefined,
        defaultValue: !field.segments?.length && field.locked
          ? field.defaultValue?.trim() || field.label.trim()
          : field.defaultValue?.trim() || undefined,
        locked: !field.segments?.length ? field.locked === true : false,
        required: true,
        condition: undefined,
        showOnSticker: field.showOnSticker ?? true,
        stickerOrder: field.showOnSticker === false ? undefined : index,
        uppercase: field.uppercase ?? true,
        isCounter: !field.segments?.length ? field.isCounter : undefined,
        counterType: !field.segments?.length ? field.counterType : undefined,
        counterPad4: !field.segments?.length ? field.counterPad4 : undefined,
        fontScale: !isVerticalOutside ? field.fontScale : undefined,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          key: TemplateFieldUtils.uniqueSegmentKey(fieldKey, segment.key, segmentIndex, usedSegmentKeys),
          label: segment.label.trim().toUpperCase(),
          type: segment.isCounter ? "number" : segment.type ?? "text",
          dateFormat: segment.type === "date" ? DateFormatter.normalizeFormat(segment.dateFormat ?? field.dateFormat) : undefined,
          prefix: segment.prefix ?? "",
          suffix: segment.suffix ?? "",
          showOnSticker: segment.showOnSticker ?? true,
          stickerOrder: segment.showOnSticker === false ? undefined : index * 10 + segmentIndex,
          counterType: segment.counterType ?? TemplateFieldUtils.inferCounterType({ ...field, key: fieldKey }),
          counterPad4: segment.counterPad4,
        })),
      });
    });
    return section === "outside"
      ? TemplateFieldUtils.renumberStickerOrders(
        TemplateFieldUtils.renumberOutsideTableOrders(TemplateFormDefaults.enforceOutsideVerticalSingleRows(cleaned)),
      )
      : TemplateFieldUtils.renumberStickerOrders(cleaned);
  }

  /**
   * The create draft also rejects empty segment labels; the edit draft never has,
   * so the two keep their own predicate as well as their own wording.
   * Returns the message to show, or undefined when the draft is valid.
   */
  static validate(
    target: TemplateFormTarget,
    inside: TemplateField[],
    outside: TemplateField[],
    stickerLayouts: TemplateFormState["stickerLayouts"],
  ) {
    const messages = VALIDATION_MESSAGES[target];
    const hasEmptyLabel = [...inside, ...outside].some((field) =>
      !field.label || (target === "create" && field.segments?.some((segment) => !segment.label)),
    );
    if (hasEmptyLabel) return messages.emptyLabel;

    const layouts = TemplateFormDefaults.withRequiredStickerLayouts(stickerLayouts);
    if (!layouts.insideFrame && !layouts.outsideFrame && !layouts.customerName && !layouts.fscLogo) {
      return messages.noLayout;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      return messages.duplicateKey;
    }
    return undefined;
  }
}
