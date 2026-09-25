import { httpService, HttpService } from "./http.service";

export type SessionRole = "user" | "admin" | "super_admin";
export type SessionUser = { role?: SessionRole | string };
export type SessionResponse = { user?: SessionUser };

/** How long a session answer is shared between callers, e.g. the app shell and the page below it. */
const SESSION_REUSE_MS = 10 * 1000;

/** Reads the signed-in user. Previously each page fetched /api/session on its own. */
export class SessionApiService {
  constructor(private readonly http: HttpService) {}

  private pending: Promise<SessionResponse> | null = null;
  private fetchedAt = 0;

  /**
   * Reuses a request already in flight or one finished moments ago, so the app shell and the page
   * it mounts share one call. `fresh` forces a real request, which the idle timer relies on.
   */
  getSession({ fresh = false }: { fresh?: boolean } = {}): Promise<SessionResponse> {
    if (!fresh && this.pending && Date.now() - this.fetchedAt < SESSION_REUSE_MS) return this.pending;
    this.fetchedAt = Date.now();
    const request = this.http.json<SessionResponse>("/api/session");
    this.pending = request;
    // Failures are not reused: the next call asks the server again.
    request.catch(() => {
      if (this.pending === request) this.pending = null;
    });
    return request;
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
    this.pending = null;
    await this.http.json("/api/auth/logout", { method: "POST" });
  }
}

export const sessionApiService = new SessionApiService(httpService);
