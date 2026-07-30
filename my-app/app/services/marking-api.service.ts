import type {
  Customer,
  CustomerTemplate,
  TemplateField,
} from "@/app/types/customer";
import type {
  SaveMarkingPayload,
} from "@/app/types/marking";

type ApiEnvelope<T> = { data: T; message?: string };

export class MarkingApiService {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body.data;
  }

  async getSession(): Promise<{ user?: { role?: string } }> {
    const response = await fetch("/api/session");
    const body = (await response.json()) as { user?: { role?: string }; message?: string };
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body;
  }

  getCustomers(): Promise<Customer[]> {
    return this.request("/api/customers");
  }

  getTemplate(customerId: number): Promise<CustomerTemplate> {
    return this.request(`/api/customers/${customerId}/template`);
  }

  async getNextLotStart(customerId: number, productionDate: string): Promise<number> {
    const result = await this.request<{ lotStart: number }>(
      `/api/customers/${customerId}/next-lot?productionDate=${encodeURIComponent(productionDate)}`,
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

  saveTemplate(customerId: number, inside: TemplateField[], outside: TemplateField[]): Promise<CustomerTemplate> {
    return this.request(`/api/customers/${customerId}/template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-role": "admin" },
      body: JSON.stringify({ inside, outside, updatedBy: "ADMIN" }),
    });
  }
}

export const markingApiService = new MarkingApiService();
