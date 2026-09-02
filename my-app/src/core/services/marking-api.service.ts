import type {
  Template,
  TemplateDetail,
  TemplateField,
} from "@/src/core/models/template";
import type {
  SaveMarkingPayload,
} from "@/src/core/models/marking";
import type { DataApiEnvelope } from "@/src/core/models/api";

export class MarkingApiService {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as DataApiEnvelope<T>;
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body.data;
  }

  async getSession(): Promise<{ user?: { role?: string } }> {
    const response = await fetch("/api/session");
    const body = (await response.json()) as { user?: { role?: string }; message?: string };
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body;
  }

  getTemplates(): Promise<Template[]> {
    return this.request("/api/templates?includeInactive=visible");
  }

  getTemplate(templateId: number): Promise<TemplateDetail> {
    return this.request(`/api/templates/${templateId}/template`);
  }

  async getNextLotStart(templateId: number, productionDate: string): Promise<number> {
    const result = await this.request<{ lotStart: number }>(
      `/api/templates/${templateId}/next-lot?productionDate=${encodeURIComponent(productionDate)}`,
    );
    return result.lotStart;
  }

  saveMarking(payload: SaveMarkingPayload): Promise<{ id: number }> {
    return this.request("/api/markings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  saveTemplate(templateId: number, inside: TemplateField[], outside: TemplateField[]): Promise<TemplateDetail> {
    return this.request(`/api/templates/${templateId}/template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inside, outside }),
    });
  }
}

export const markingApiService = new MarkingApiService();
