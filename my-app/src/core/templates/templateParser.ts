import type { CounterType, TemplateDetail, TemplateField } from "@/src/core/models/template";
import { DEFAULT_STICKER_DEFAULTS, DEFAULT_STICKER_LAYOUTS } from "@/src/core/models/template-form";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import { UserFacingError } from "@/src/core/errors/userFacingError";

type Section = "Inside" | "Outside";
type PartialField = Partial<TemplateField>;

type StoredSegment = {
  key?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  dateFormat?: TemplateField["dateFormat"];
  isCounter?: boolean;
  counterType?: CounterType;
  counterPad4?: boolean;
};

/** Shape of the object-style JSON stored in tb_template.inside / tb_template.outside. */
type StoredConfig = {
  groups?: Array<{ label?: string; segments?: StoredSegment[] }>;
  fields?: PartialField[];
  tables?: Array<{ name?: string; fields?: PartialField[] }>;
};

const REQUIRED_STICKER_FIELDS: TemplateDetail["sticker"]["enabledFields"] = ["side", "format", "type", "other"];

/**
 * Reads the JSON that tb_template stores (several historical shapes) into TemplateField lists
 * and sticker settings. Pure: no database access, so every legacy format can be tested directly.
 */
export default class TemplateParser {
  static parseSticker(value: string | null): TemplateDetail["sticker"] {
    try {
      const parsed = JSON.parse(value ?? "") as {
        sticker?: {
          enabledFields?: Array<"side" | "format" | "type" | "other">;
          layouts?: Partial<TemplateDetail["sticker"]["layouts"]>;
          defaults?: Partial<TemplateDetail["sticker"]["defaults"]>;
          isActive?: boolean;
        };
      };
      if (Array.isArray(parsed.sticker?.enabledFields)) {
        return {
          enabledFields: [...REQUIRED_STICKER_FIELDS],
          layouts: {
            ...DEFAULT_STICKER_LAYOUTS,
            ...parsed.sticker.layouts,
          },
          defaults: {
            ...DEFAULT_STICKER_DEFAULTS,
            ...parsed.sticker.defaults,
          },
          isActive: parsed.sticker.isActive,
        };
      }
    } catch {
      // Older templates have no sticker configuration
    }
    return {
      enabledFields: [...REQUIRED_STICKER_FIELDS],
      layouts: DEFAULT_STICKER_LAYOUTS,
      defaults: DEFAULT_STICKER_DEFAULTS,
      isActive: true,
    };
  }

  static parseFields(value: string | null, section: Section, optional = false): TemplateField[] {
    if (!value?.trim()) {
      if (optional) return [];
      throw new UserFacingError(`Template ${section} ยังไม่มีข้อมูล`);
    }
    const trimmedValue = value.trim();
    try {
      const parsed: unknown = JSON.parse(trimmedValue);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const config = parsed as StoredConfig;
        if (section === "Inside" && Array.isArray(config.fields) && !Array.isArray(config.groups)) {
          return this.fromInsideFields(config.fields);
        }
        if (section === "Inside" && Array.isArray(config.groups)) {
          return this.fromInsideGroups(config.groups, config.fields ?? []);
        }
        if (section === "Outside" && Array.isArray(config.tables)) {
          return this.fromOutsideTables(config.tables);
        }
      }
      if (!Array.isArray(parsed)) throw new UserFacingError(`Template ${section} ต้องเป็น JSON Array`);
      return this.fromArray(parsed, section);
    } catch (error) {
      if (error instanceof UserFacingError) throw error;
      if (trimmedValue.startsWith("{") || trimmedValue.startsWith("[")) {
        throw new UserFacingError(`Template ${section} JSON ไม่สมบูรณ์ ข้อมูลอาจถูกตัดเพราะ column ในฐานข้อมูลสั้นเกินไป กรุณาแจ้งผู้ดูแลระบบ`);
      }
      return this.fromPlainText(trimmedValue);
    }
  }

  private static normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
  }

  private static normalizeFontScale(value: unknown): TemplateField["fontScale"] {
    if (value === "large") return "xlarge";
    return value === "normal" || value === "xlarge" ? value : undefined;
  }

  private static normalizeCondition(condition: TemplateField["condition"]): TemplateField["condition"] {
    if (!condition) return undefined;
    const stickerType = condition.stickerType as string | undefined;
    return {
      ...condition,
      stickerType: stickerType === "NON-TNR"
        ? "NON TNR"
        : stickerType === "FCS"
          ? "TNR"
          : condition.stickerType,
    } as TemplateField["condition"];
  }

  private static normalizeCounterSegments(field: TemplateField): TemplateField {
    const keyedField = TemplateFieldUtils.normalizeSegmentKeys(field);
    if (!keyedField.segments?.length) return keyedField;
    return {
      ...keyedField,
      segments: keyedField.segments.map((segment) => ({
        ...segment,
        type: segment.isCounter ? "number" : segment.type ?? "text",
        counterType: segment.isCounter
          ? segment.counterType ?? TemplateFieldUtils.inferCounterType(keyedField)
          : segment.counterType,
        showOnSticker: segment.isCounter ? true : segment.showOnSticker,
      })),
    };
  }

  private static fieldType(type: unknown): TemplateField["type"] {
    return ["number", "date", "textarea"].includes(String(type)) ? (type as TemplateField["type"]) : "text";
  }

  /** `{ fields: [...] }` - the inside shape written by the template editor. */
  private static fromInsideFields(fields: PartialField[]): TemplateField[] {
    return fields.map((field, index): TemplateField => {
      const label = String(field.label ?? field.key ?? `Inside ${index + 1}`);
      return this.normalizeCounterSegments({
        key: String(field.key ?? this.normalizeKey(label, index)),
        label,
        type: this.fieldType(field.type),
        required: Boolean(field.required),
        placeholder: field.placeholder,
        defaultValue: field.defaultValue,
        dateFormat: field.dateFormat,
        locked: field.locked,
        displayFormat: field.displayFormat,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          showOnSticker: segment.showOnSticker ?? field.showOnSticker ?? true,
          stickerOrder: segment.stickerOrder ?? (field.stickerOrder ?? index) * 10 + segmentIndex,
          type: segment.type,
          isCounter: segment.isCounter,
          counterPad4: segment.counterPad4,
        })),
        condition: this.normalizeCondition(field.condition),
        showOnSticker: field.showOnSticker ?? true,
        stickerOrder: field.stickerOrder ?? index,
        isCounter: field.isCounter,
        counterType: field.counterType,
        counterPad4: field.counterPad4,
        fontScale: this.normalizeFontScale(field.fontScale),
        hideLabel: field.hideLabel,
      });
    });
  }

  /** `{ groups: [...], fields: [...] }` - the original LOT NO. / PALLET NO. layout plus fixed rows. */
  private static fromInsideGroups(groups: NonNullable<StoredConfig["groups"]>, fixedFields: PartialField[]): TemplateField[] {
    const groupRows: TemplateField[] = groups.map((group, groupIndex) => {
      const label = String(group.label ?? `Inside ${groupIndex + 1}`);
      return this.normalizeCounterSegments({
        key: `inside_group_${groupIndex + 1}`,
        label,
        type: "text",
        required: true,
        showOnSticker: true,
        stickerOrder: groupIndex,
        segments: (group.segments ?? []).map((field, fieldIndex) => ({
          key: String(field.key ?? `inside_${groupIndex + 1}_${fieldIndex + 1}`),
          label: String(field.label ?? `Section ${fieldIndex + 1}`),
          prefix: field.prefix,
          suffix: field.suffix,
          dateFormat: field.dateFormat,
          showOnSticker: true,
          stickerOrder: groupIndex * 10 + fieldIndex,
          type: field.isCounter ? "number" : "text",
          isCounter: field.isCounter,
          counterType: field.counterType,
          counterPad4: field.counterPad4,
        })),
      });
    });
    const fixedRows: TemplateField[] = fixedFields.map((field, index) => ({
      key: String(field.key ?? `inside_fixed_${index + 1}`),
      label: String(field.label ?? `Inside ${index + 1}`),
      type: "text",
      required: true,
      showOnSticker: true,
      stickerOrder: groupRows.length + index,
    }));
    return [...groupRows, ...fixedRows];
  }

  /** `{ tables: [...] }` - outside tables, flattened to one field list with a group per table. */
  private static fromOutsideTables(tables: NonNullable<StoredConfig["tables"]>): TemplateField[] {
    return tables.flatMap((table, tableIndex) =>
      (table.fields ?? []).map((field, fieldIndex) => ({
        key: String(field.key ?? `outside_${tableIndex + 1}_${fieldIndex + 1}`),
        label: `${table.name ?? `นอกกรอบ ${tableIndex + 1}`} — ${field.label ?? `Field ${fieldIndex + 1}`}`,
        type: "text" as const,
        required: Boolean(field.required),
        defaultValue: field.defaultValue,
        dateFormat: field.dateFormat,
        locked: field.locked,
        condition: this.normalizeCondition(field.condition),
        showOnSticker: field.showOnSticker ?? true,
        stickerOrder: field.stickerOrder ?? fieldIndex,
        stickerGroup: String(table.name ?? `นอกกรอบ ${tableIndex + 1}`),
        stickerGroupOrder: tableIndex,
        uppercase: field.uppercase ?? true,
        fontScale: this.normalizeFontScale(field.fontScale),
        hideLabel: field.hideLabel,
      })),
    );
  }

  /** A plain JSON array: the current outside shape, and the oldest inside shape (array of labels). */
  private static fromArray(items: unknown[], section: Section): TemplateField[] {
    return items.map((item, index): TemplateField => {
      if (typeof item === "string") {
        return {
          key: this.normalizeKey(item, index),
          label: item,
          type: "text",
          required: false,
          showOnSticker: true,
          stickerOrder: index,
        };
      }
      const field = item as PartialField;
      const label = String(field.label ?? field.key ?? `Field ${index + 1}`);
      return this.normalizeCounterSegments({
        key: String(field.key ?? this.normalizeKey(label, index)),
        label,
        type: this.fieldType(field.type),
        required: Boolean(field.required),
        placeholder: field.placeholder,
        defaultValue: field.defaultValue,
        dateFormat: field.dateFormat,
        locked: field.locked,
        displayFormat: field.displayFormat,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          showOnSticker: segment.showOnSticker ?? field.showOnSticker ?? true,
          stickerOrder: segment.stickerOrder ?? (field.stickerOrder ?? index) * 10 + segmentIndex,
          type: segment.type,
          dateFormat: segment.dateFormat,
          isCounter: segment.isCounter,
          counterPad4: segment.counterPad4,
        })),
        condition: this.normalizeCondition(field.condition),
        showOnSticker: field.showOnSticker ?? true,
        stickerOrder: field.stickerOrder ?? index,
        stickerGroup: field.stickerGroup,
        stickerGroupOrder: field.stickerGroupOrder,
        stickerGroupLayout: field.stickerGroupLayout === "8x2" || field.stickerGroupLayout === "4x2" ? "8x2" as const : undefined,
        uppercase: section === "Outside" ? field.uppercase ?? true : field.uppercase,
        isCounter: field.isCounter,
        counterType: field.counterType,
        counterPad4: field.counterPad4,
        fontScale: this.normalizeFontScale(field.fontScale),
        hideLabel: field.hideLabel,
      });
    });
  }

  /** Oldest shape of all: labels separated by commas or line breaks. */
  private static fromPlainText(text: string): TemplateField[] {
    return text.split(/\r?\n|,/)
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        key: this.normalizeKey(label, index),
        label,
        type: "text" as const,
        required: false,
        showOnSticker: true,
        stickerOrder: index,
      }));
  }
}
