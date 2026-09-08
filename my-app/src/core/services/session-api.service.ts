import { httpService, HttpService } from "./http.service";

export type SessionUser = { role?: string };
export type SessionResponse = { user?: SessionUser };

/** Reads the signed-in user. Previously each page fetched /api/session on its own. */
export class SessionApiService {
  constructor(private readonly http: HttpService) {}

  getSession(): Promise<SessionResponse> {
    return this.http.json<SessionResponse>("/api/session");
  }

  async isAdmin() {
    try {
      const session = await this.getSession();
      return session.user?.role === "admin";
    } catch {
      return false;
    }
  }
}

export const sessionApiService = new SessionApiService(httpService);
