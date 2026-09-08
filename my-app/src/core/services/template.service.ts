import {
  templateRepository,
  TemplateRepository,
} from "../repositories/template.repository";
import type { CounterType, TemplateDetail, TemplateField } from "@/src/core/models/template";
import { DEFAULT_STICKER_DEFAULTS, DEFAULT_STICKER_LAYOUTS, type CreateTemplatePayload } from "@/src/core/models/template-form";

export class TemplateService {
  constructor(private readonly repository: TemplateRepository) {}

  private requiredStickerFields(): TemplateDetail["sticker"]["enabledFields"] {
    return ["side", "format", "type", "other"];
  }

  private normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
  }

  private counterType(field: Pick<TemplateField, "key" | "label">): CounterType {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private normalizeFontScale(value: unknown): TemplateField["fontScale"] {
    if (value === "large") return "xlarge";
    return value === "normal" || value === "xlarge" ? value : undefined;
  }

  private uniqueSegmentKey(
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

  private normalizeSegmentKeys(field: TemplateField): TemplateField {
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

  private normalizeCondition(condition: TemplateField["condition"]): TemplateField["condition"] {
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

  private normalizeCounterSegments(field: TemplateField): TemplateField {
    const keyedField = this.normalizeSegmentKeys(field);
    if (!keyedField.segments?.length) return keyedField;
    return {
      ...keyedField,
      segments: keyedField.segments.map((segment) => ({
        ...segment,
        type: segment.isCounter ? "number" : segment.type ?? "text",
        counterType: segment.isCounter
          ? segment.counterType ?? this.counterType(keyedField)
          : segment.counterType,
        showOnSticker: segment.isCounter ? true : segment.showOnSticker,
      })),
    };
  }

  private parseSticker(value: string | null): TemplateDetail["sticker"] {
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
          enabledFields: this.requiredStickerFields(),
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
      enabledFields: this.requiredStickerFields(),
      layouts: DEFAULT_STICKER_LAYOUTS,
      defaults: DEFAULT_STICKER_DEFAULTS,
      isActive: true,
    };
  }

  private parseFields(
    value: string | null,
    section: "Inside" | "Outside",
    optional = false,
  ): TemplateField[] {
    if (!value?.trim()) {
      if (optional) return [];
      throw new Error(`Template ${section} ยังไม่มีข้อมูล`);
    }
    const trimmedValue = value.trim();
    try {
      const parsed: unknown = JSON.parse(trimmedValue);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const config = parsed as {
          groups?: Array<{ label?: string; segments?: Array<{ key?: string; label?: string; prefix?: string; suffix?: string; dateFormat?: TemplateField["dateFormat"]; isCounter?: boolean; counterType?: CounterType; counterPad4?: boolean }> }>;
          fields?: Array<Partial<TemplateField>>;
          tables?: Array<{ name?: string; fields?: Array<Partial<TemplateField>> }>;
        };
        if (section === "Inside" && Array.isArray(config.fields) && !Array.isArray(config.groups)) {
          return config.fields.map((field, index): TemplateField => {
            const label = String(field.label ?? field.key ?? `Inside ${index + 1}`);
            return this.normalizeCounterSegments({
              key: String(field.key ?? this.normalizeKey(label, index)),
              label,
              type: ["number", "date", "textarea"].includes(String(field.type))
                ? (field.type as TemplateField["type"])
                : "text",
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
        if (section === "Inside" && Array.isArray(config.groups)) {
          const groupRows: TemplateField[] = config.groups.map((group, groupIndex) => {
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
          const fixedRows: TemplateField[] = (config.fields ?? []).map((field, index) => ({
            key: String(field.key ?? `inside_fixed_${index + 1}`),
            label: String(field.label ?? `Inside ${index + 1}`),
            type: "text",
            required: true,
            showOnSticker: true,
            stickerOrder: groupRows.length + index,
          }));
          return [...groupRows, ...fixedRows];
        }
        if (section === "Outside" && Array.isArray(config.tables)) {
          return config.tables.flatMap((table, tableIndex) =>
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
      }
      if (!Array.isArray(parsed)) throw new Error(`Template ${section} ต้องเป็น JSON Array`);
      return parsed.map((item, index): TemplateField => {
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
        const field = item as Partial<TemplateField>;
        const label = String(field.label ?? field.key ?? `Field ${index + 1}`);
        return this.normalizeCounterSegments({
          key: String(field.key ?? this.normalizeKey(label, index)),
          label,
          type: ["number", "date", "textarea"].includes(String(field.type))
            ? (field.type as TemplateField["type"])
            : "text",
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
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Template")) throw error;
      if (trimmedValue.startsWith("{") || trimmedValue.startsWith("[")) {
        throw new Error(`Template ${section} JSON ไม่สมบูรณ์ อาจถูกตัดเพราะ column tb_template.${section.toLowerCase()} สั้นเกินไป`);
      }
      return trimmedValue.split(/\r?\n|,/)
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

  getTemplates(includeInactive = false) {
    return this.repository.findAll(includeInactive);
  }

  getTemplateHistory() {
    return this.repository.findHistory();
  }

  async renameTemplateIfChanged(templateId: number, name: string | undefined) {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const templates = await this.repository.findAll(true);
    const current = templates.find((template) => template.id === templateId);
    if (!current) throw new Error("ไม่พบข้อมูลลูกค้า");
    if (trimmed === current.c_name) return;
    const duplicate = templates.find((template) =>
      template.id !== templateId && template.c_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) throw new Error(`มีลูกค้าชื่อ "${duplicate.c_name}" อยู่แล้ว กรุณาตั้งชื่ออื่น`);
    await this.repository.updateName(templateId, trimmed);
  }

  async updateTemplateActiveIfChanged(templateId: number, isActive: boolean | undefined) {
    if (isActive === undefined) return;
    await this.repository.updateActive(templateId, isActive);
  }

  async createTemplate(input: CreateTemplatePayload, createdBy: string) {
    const name = input.name.trim();
    const templates = await this.repository.findAll(true);
    const duplicate = templates.find((template) => template.c_name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) throw new Error(`มีลูกค้าชื่อ "${duplicate.c_name}" อยู่แล้ว กรุณาตั้งชื่ออื่น`);

    const inside = input.template
      ? JSON.stringify({
        version: 2,
        sticker: input.template.sticker,
        fields: input.template.inside,
      })
      : JSON.stringify({
        version: input.configuration.version,
        sticker: input.configuration.sticker,
        groups: input.configuration.inside.groups,
        fields: input.configuration.inside.fields,
      });
    const outside = input.template
      ? JSON.stringify(input.template.outside)
      : JSON.stringify({
        version: input.configuration.version,
        tables: input.configuration.outside.tables,
      });
    const templateId = await this.repository.createWithTemplate(
      name,
      inside,
      outside,
      createdBy,
      input.isActive ?? true,
    );
    return { id: templateId, name };
  }

  async getTemplate(id: number): Promise<TemplateDetail> {
    const templates = await this.repository.findAll(true);
    const template = templates.find((item) => item.id === id);
    if (!template) throw new Error("ไม่พบข้อมูลลูกค้า");

    const latestTemplate = await this.repository.findLatestTemplate(id);
    if (!latestTemplate) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    return {
      id,
      customerName: latestTemplate.c_name,
      templateId: latestTemplate.id,
      sticker: this.parseSticker(latestTemplate.inside),
      inside: this.parseFields(latestTemplate.inside, "Inside"),
      outside: this.parseFields(latestTemplate.outside, "Outside", true),
    };
  }

  private buildInsideTemplateJson(
    previousInside: string | null,
    fields: TemplateField[],
    stickerPatch?: Partial<TemplateDetail["sticker"]>,
  ) {
    const currentSticker = this.parseSticker(previousInside);
    const sticker = {
      ...currentSticker,
      ...stickerPatch,
      layouts: {
        ...currentSticker.layouts,
        ...stickerPatch?.layouts,
      },
      defaults: {
        ...currentSticker.defaults,
        ...stickerPatch?.defaults,
      },
    };
    return JSON.stringify({
      version: 2,
      sticker,
      fields,
    });
  }

  async saveTemplate(
    templateId: number,
    insideFields: TemplateField[],
    fields: TemplateField[],
    sticker: Partial<TemplateDetail["sticker"]> | undefined,
    updatedBy: string,
  ) {
    const template = await this.repository.findLatestTemplate(templateId);
    if (!template) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    const affectedRows = await this.repository.updateTemplate(
      template.id,
      this.buildInsideTemplateJson(template.inside, insideFields, sticker),
      JSON.stringify(fields),
      updatedBy,
    );
    if (!affectedRows) throw new Error("อัปเดต Template ไม่สำเร็จ");
    return this.getTemplate(templateId);
  }
}

export const templateService = new TemplateService(templateRepository);
