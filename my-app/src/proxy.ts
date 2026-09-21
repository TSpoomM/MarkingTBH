import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDevAuthBypassEnabled } from "@/src/lib/devAuth";
import { APP_SESSION_COOKIE_NAME, PHP_SESSION_COOKIE_NAME } from "@/src/lib/sessionCookieNames";

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

/**
 * Gates every page behind /login. Runs on the Edge runtime, which can't read the
 * PHP session file or verify the HMAC-signed app_session cookie (both need Node
 * APIs) - so this only checks whether a session cookie is present. Real
 * verification still happens server-side in /api/session and the login route;
 * this just keeps an unauthenticated visitor from landing anywhere but /login.
 * The app_session cookie itself expires after 30 minutes (see authSession.ts),
 * so an idle session naturally falls back to this redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated =
    isDevAuthBypassEnabled ||
    request.cookies.has(APP_SESSION_COOKIE_NAME) ||
    request.cookies.has(PHP_SESSION_COOKIE_NAME);

  if (pathname === "/login") {
    if (isAuthenticated) return redirectTo(request, "/");
    return NextResponse.next();
  }

  if (!isAuthenticated) return redirectTo(request, "/login");

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
