import { httpService, HttpService } from "./http.service";
import type { Template, TemplateDetail } from "@/src/core/models/template";
import type { SaveMarkingPayload } from "@/src/core/models/marking";

export interface LotProgress {
  lotStart: number;
  lastLotEnd: number;
}

export class MarkingApiService {
  constructor(private readonly http: HttpService) {}

  getTemplates(): Promise<Template[]> {
    return this.http.data<Template[]>("/api/templates");
  }

  getDestinations(): Promise<string[]> {
    return this.http.data<string[]>("/api/destinations");
  }

  getTemplate(templateId: number): Promise<TemplateDetail> {
    return this.http.data<TemplateDetail>(`/api/templates/${templateId}/template`);
  }

  async getNextLotStart(templateId: number): Promise<LotProgress> {
    return this.http.data<LotProgress>(
      `/api/templates/${templateId}/next-lot`,
    );
  }

  saveMarking(payload: SaveMarkingPayload): Promise<{ id: number }> {
    return this.http.postJson<{ id: number }>("/api/markings", payload);
  }
}

export const markingApiService = new MarkingApiService(httpService);
