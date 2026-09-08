import { basePathService } from "@/src/lib/basePath";
import type { ApiEnvelope } from "@/src/core/models/api";

/**
 * Single client-side entry point for calling the app's API routes.
 * Applies the deploy basePath and unwraps the { data, message } envelope,
 * so no component or controller has to call fetch() itself.
 */
export class HttpService {
  async json<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(basePathService.withBasePath(path), init);
    const body = (await response.json()) as T & { message?: string };
    if (!response.ok) throw new Error(body?.message || "Request failed");
    return body;
  }

  /** Unwraps `data` and fails when the route answered without a payload. */
  async data<T>(path: string, init?: RequestInit): Promise<T> {
    const body = await this.json<ApiEnvelope<T>>(path, init);
    if (body.data === undefined) throw new Error(body.message || "Request failed");
    return body.data;
  }

  /** Unwraps `data`, tolerating routes that legitimately answer with nothing. */
  async optionalData<T>(path: string, init?: RequestInit): Promise<T | undefined> {
    const body = await this.json<ApiEnvelope<T>>(path, init);
    return body.data;
  }

  postJson<T>(path: string, payload: unknown): Promise<T> {
    return this.send("POST", path, payload);
  }

  putJson<T>(path: string, payload: unknown): Promise<T> {
    return this.send("PUT", path, payload);
  }

  private send<T>(method: "POST" | "PUT", path: string, payload: unknown) {
    return this.data<T>(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
}

export const httpService = new HttpService();
