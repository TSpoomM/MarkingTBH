import type { ApiEnvelope } from "@/src/core/models/api";
import type { MarkingHistoryItem } from "@/src/core/models/marking";
import type { TemplateHistoryItem } from "@/src/core/models/history";

export class HistoryApiService {
  private async request<T>(url: string): Promise<T | undefined> {
    const response = await fetch(url);
    const body = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body.data;
  }

  async getHistory(limit = 200): Promise<MarkingHistoryItem[]> {
    const data = await this.request<MarkingHistoryItem[]>(`/api/markings?limit=${limit}`);
    return data ?? [];
  }

  async getTemplateHistory(): Promise<TemplateHistoryItem[]> {
    const data = await this.request<TemplateHistoryItem[]>("/api/templates?history=1");
    return data ?? [];
  }
}

export const historyApiService = new HistoryApiService();
