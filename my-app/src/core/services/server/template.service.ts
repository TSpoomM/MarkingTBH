import {
  templateRepository,
  TemplateRepository,
} from "@/src/core/repositories/template.repository";
import type { TemplateDetail, TemplateField } from "@/src/core/models/template";
import type { CreateTemplatePayload } from "@/src/core/models/template-form";
import TemplateParser from "@/src/core/templates/templateParser";
import { UserFacingError } from "@/src/core/errors/userFacingError";

export class TemplateService {
  constructor(private readonly repository: TemplateRepository) {}

  getTemplates(includeInactive = false) {
    return this.repository.findAll(includeInactive);
  }

  async isTemplateActive(templateId: number) {
    const rows = await this.repository.findAll(false, templateId);
    return rows.length > 0;
  }

  private isActiveValue(value: number | string | boolean | null | undefined) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") return !["", "0", "false", "inactive", "disabled", "n", "no"].includes(value.trim().toLowerCase());
    return true;
  }

  /** Customer list for pickers: active first, then by name; inactive rows only when asked for. */
  async listSummaries(includeInactive: boolean) {
    const rows = await this.repository.findAll(includeInactive);
    return rows
      .map((row) => ({ id: row.id, name: row.c_name, isActive: this.isActiveValue(row.is_active) }))
      .filter((template) => includeInactive || template.isActive)
      .sort((first, second) =>
        Number(second.isActive) - Number(first.isActive) ||
        first.name.localeCompare(second.name),
      );
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
    if (!current) throw new UserFacingError("ไม่พบข้อมูลลูกค้า");
    if (trimmed === current.c_name) return;
    const duplicate = templates.find((template) =>
      template.id !== templateId && template.c_name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) throw new UserFacingError(`มีลูกค้าชื่อ "${duplicate.c_name}" อยู่แล้ว กรุณาตั้งชื่ออื่น`);
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
    if (duplicate) throw new UserFacingError(`มีลูกค้าชื่อ "${duplicate.c_name}" อยู่แล้ว กรุณาตั้งชื่ออื่น`);

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
    // Both lookups read tb_template by id, so one query covers "customer missing" too.
    const latestTemplate = await this.repository.findLatestTemplate(id);
    if (!latestTemplate) throw new UserFacingError("ไม่พบข้อมูลลูกค้า");
    return {
      id,
      customerName: latestTemplate.c_name,
      templateId: latestTemplate.id,
      sticker: TemplateParser.parseSticker(latestTemplate.inside),
      inside: TemplateParser.parseFields(latestTemplate.inside, "Inside"),
      outside: TemplateParser.parseFields(latestTemplate.outside, "Outside", true),
    };
  }

  private buildInsideTemplateJson(
    previousInside: string | null,
    fields: TemplateField[],
    stickerPatch?: Partial<TemplateDetail["sticker"]>,
  ) {
    const currentSticker = TemplateParser.parseSticker(previousInside);
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
    if (!template) throw new UserFacingError("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    const affectedRows = await this.repository.updateTemplate(
      template.id,
      this.buildInsideTemplateJson(template.inside, insideFields, sticker),
      JSON.stringify(fields),
      updatedBy,
    );
    if (!affectedRows) throw new UserFacingError("อัปเดต Template ไม่สำเร็จ");
    return this.getTemplate(templateId);
  }
}

export const templateService = new TemplateService(templateRepository);
