// Server-only: resolves the acting user's id from the verified hrkpis session cookie.
// Deliberately does not accept any client-supplied id — the request body/headers/query
// are not trusted for identity, since that would let a caller impersonate any employee.
import { devAuthService, isDevAuthBypassEnabled } from "./devAuth";
import { authSessionService } from "./authSession";
import { hrkpisSessionService } from "./hrkpisSession";

export class RequestCurrentUserService {
  private parseCookie(cookieHeader: string, name: string): string | undefined {
    const prefix = `${name}=`;
    const match = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
  }

  async getCurrentUserId(request: Request): Promise<string> {
    if (isDevAuthBypassEnabled) return devAuthService.getSession().empId;

    const cookieHeader = request.headers.get("cookie") || "";
    const appSessionValue = this.parseCookie(cookieHeader, authSessionService.getCookieName());
    const appSession = authSessionService.readFromCookieValue(appSessionValue);
    if (appSession) return appSession.empId || appSession.userInv;

    const sessionId = this.parseCookie(cookieHeader, hrkpisSessionService.getCookieName());
    const session = await hrkpisSessionService.readSession(sessionId);
    return session?.empId || "";
  }
}

export const requestCurrentUserService = new RequestCurrentUserService();
