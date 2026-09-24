import { httpService, HttpService } from "./http.service";
import type { Template, TemplateDetail, TemplateField } from "@/src/core/models/template";
import type { CreateTemplatePayload, StickerLayouts } from "@/src/core/models/template-form";
import type { StickerDefaults } from "@/src/core/models/template";

export interface SaveTemplateSticker {
  enabledFields: string[];
  layouts: StickerLayouts;
  defaults: StickerDefaults;
}

export interface SaveTemplateInput {
  name?: string;
  isActive?: boolean;
  inside: TemplateField[];
  outside: TemplateField[];
  sticker: SaveTemplateSticker;
}

/** Client-side access to the template routes used by the manage-template page. */
export class TemplateApiService {
  constructor(private readonly http: HttpService) {}

  getTemplates(includeInactive: "1" | "visible" = "1"): Promise<Template[]> {
    return this.http.data<Template[]>(`/api/templates?includeInactive=${includeInactive}`);
  }

  getTemplate(templateId: string | number): Promise<TemplateDetail> {
    return this.http.data<TemplateDetail>(`/api/templates/${templateId}/template`);
  }

  saveTemplate(templateId: string | number, input: SaveTemplateInput): Promise<TemplateDetail> {
    return this.http.putJson<TemplateDetail>(`/api/templates/${templateId}/template`, input);
  }

  createTemplate(payload: CreateTemplatePayload): Promise<{ id: number; name: string }> {
    return this.http.postJson<{ id: number; name: string }>("/api/templates", payload);
  }
}

export const templateApiService = new TemplateApiService(httpService);
