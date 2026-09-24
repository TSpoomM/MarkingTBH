import { httpService, HttpService } from "./http.service";
import type { MarkingHistoryItem } from "@/src/core/models/marking";
import type { TemplateHistoryItem } from "@/src/core/models/history";

export class HistoryApiService {
  constructor(private readonly http: HttpService) {}

  async getHistory(limit = 200): Promise<MarkingHistoryItem[]> {
    const data = await this.http.optionalData<MarkingHistoryItem[]>(`/api/markings?limit=${limit}`);
    return data ?? [];
  }

  async getTemplateHistory(): Promise<TemplateHistoryItem[]> {
    const data = await this.http.optionalData<TemplateHistoryItem[]>("/api/templates?history=1");
    return data ?? [];
  }
}

export const historyApiService = new HistoryApiService(httpService);
