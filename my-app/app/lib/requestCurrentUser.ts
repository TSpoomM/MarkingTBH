// Server-only: resolves the acting user's id from the verified hrkpis session cookie.
// Deliberately does not accept any client-supplied id — the request body/headers/query
// are not trusted for identity, since that would let a caller impersonate any employee.
import { getDevAuthSession, isDevAuthBypassEnabled } from "./devAuth";
import { getHrkpisSessionCookieName, readHrkpisSession } from "./hrkpisSession";

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const prefix = `${name}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

export async function getRequestCurrentUserId(request: Request): Promise<string> {
  if (isDevAuthBypassEnabled) return getDevAuthSession().empId;

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionId = parseCookie(cookieHeader, getHrkpisSessionCookieName());
  const session = await readHrkpisSession(sessionId);
  return session?.empId || "";
}
