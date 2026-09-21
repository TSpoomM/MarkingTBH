// Self-issued, signed session cookie for the db_tbh_user login. Independent of
// hrkpisSession.ts (which reads the legacy PHP session file) - see session/route.ts
// for how the two are combined.
import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { APP_SESSION_COOKIE_NAME } from "@/src/lib/sessionCookieNames";

export type AppSessionPayload = { userInv: string; empId?: string };

const SESSION_COOKIE_NAME = APP_SESSION_COOKIE_NAME;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || "";
// Not logged in => back to /login (see middleware.ts); logged in => session
// itself expires after 30 minutes, which also sends the user back to /login.
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export class AuthSessionService {
  private getSigningSecret() {
    if (SESSION_SECRET) return SESSION_SECRET;
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SESSION_SECRET is required in production");
    }
    return "dev-only-change-me";
  }

  private sign(value: string) {
    return createHmac("sha256", this.getSigningSecret()).update(value).digest("hex");
  }

  getCookieName() {
    return SESSION_COOKIE_NAME;
  }

  private encode(payload: AppSessionPayload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${this.sign(encoded)}`;
  }

  setCookie(response: NextResponse, payload: AppSessionPayload) {
    response.cookies.set(SESSION_COOKIE_NAME, this.encode(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  clearCookie(response: NextResponse) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  readFromCookieValue(cookieValue: string | undefined): AppSessionPayload | null {
    if (!cookieValue) return null;

    const [encoded, signature] = cookieValue.split(".");
    if (!encoded || !signature) return null;

    const expectedBuffer = Buffer.from(this.sign(encoded));
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
      if (!payload || typeof payload.userInv !== "string") return null;
      return {
        userInv: payload.userInv,
        empId: typeof payload.empId === "string" ? payload.empId : undefined,
      };
    } catch {
      return null;
    }
  }
}

export const authSessionService = new AuthSessionService();
