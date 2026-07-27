import type {
  Customer,
  CustomerTemplate,
  SaveMarkingPayload,
  TemplateField,
} from "../types";

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

  saveMarking(payload: SaveMarkingPayload): Promise<{ id: number }> {
    return this.request("/api/markings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  saveOutsideTemplate(customerId: number, outside: TemplateField[]): Promise<CustomerTemplate> {
    return this.request(`/api/customers/${customerId}/template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-role": "admin" },
      body: JSON.stringify({ outside, updatedBy: "ADMIN" }),
    });
  }
}

export const markingApiService = new MarkingApiService();
