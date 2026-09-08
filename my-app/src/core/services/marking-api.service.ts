import { httpService, HttpService } from "./http.service";
import type { Template, TemplateDetail } from "@/src/core/models/template";
import type { SaveMarkingPayload } from "@/src/core/models/marking";

export class MarkingApiService {
  constructor(private readonly http: HttpService) {}

  getTemplates(): Promise<Template[]> {
    return this.http.data<Template[]>("/api/templates?includeInactive=visible");
  }

  getTemplate(templateId: number): Promise<TemplateDetail> {
    return this.http.data<TemplateDetail>(`/api/templates/${templateId}/template`);
  }

  async getNextLotStart(templateId: number, productionDate: string): Promise<number> {
    const result = await this.http.data<{ lotStart: number }>(
      `/api/templates/${templateId}/next-lot?productionDate=${encodeURIComponent(productionDate)}`,
    );
    return result.lotStart;
  }

  saveMarking(payload: SaveMarkingPayload): Promise<{ id: number }> {
    return this.http.postJson<{ id: number }>("/api/markings", payload);
  }
}

export const markingApiService = new MarkingApiService(httpService);
