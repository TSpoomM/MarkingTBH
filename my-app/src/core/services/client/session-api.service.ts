import { httpService, HttpService } from "./http.service";

export type SessionRole = "user" | "admin" | "super_admin";
export type SessionUser = { role?: SessionRole | string };
export type SessionResponse = { user?: SessionUser };

/** Reads the signed-in user. Previously each page fetched /api/session on its own. */
export class SessionApiService {
  constructor(private readonly http: HttpService) {}

  getSession(): Promise<SessionResponse> {
    return this.http.json<SessionResponse>("/api/session");
  }

  static hasAdminRole(session: SessionResponse) {
    return session.user?.role === "admin" || session.user?.role === "super_admin";
  }

  static hasSuperAdminRole(session: SessionResponse) {
    return session.user?.role === "super_admin";
  }

  async isAdmin() {
    try {
      return SessionApiService.hasAdminRole(await this.getSession());
    } catch {
      return false;
    }
  }

  async isSuperAdmin() {
    try {
      return SessionApiService.hasSuperAdminRole(await this.getSession());
    } catch {
      return false;
    }
  }

  /** Logout has nothing to unwrap, so this skips the {data,message} envelope httpService.postJson expects. */
  async logout() {
    await this.http.json("/api/auth/logout", { method: "POST" });
  }
}

export const sessionApiService = new SessionApiService(httpService);
