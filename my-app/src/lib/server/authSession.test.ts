import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { AuthSessionService, SESSION_IDLE_SECONDS } from "./authSession";

const MINUTE = 60_000;
const START = Date.UTC(2026, 8, 24, 9, 0, 0);
const payload = { userInv: "somchai", empId: "10180" };

/** A service whose clock the test controls, plus a helper that issues a cookie value at the current time. */
function setup() {
  let time = START;
  const service = new AuthSessionService(() => time);
  const issue = () => {
    const response = NextResponse.json({});
    service.setCookie(response, payload);
    return response.cookies.get(service.getCookieName())!;
  };
  return { service, issue, advance: (ms: number) => { time += ms; } };
}

describe("AuthSessionService idle timeout", () => {
  it("is 30 minutes", () => {
    expect(SESSION_IDLE_SECONDS).toBe(30 * 60);
  });

  it("accepts a fresh cookie and returns the identity", () => {
    const { service, issue } = setup();
    expect(service.readFromCookieValue(issue().value)).toEqual(payload);
  });

  it("still accepts it just before 30 minutes and rejects it from 30 minutes on", () => {
    const { service, issue, advance } = setup();
    const { value } = issue();
    advance(29 * MINUTE + 59_000);
    expect(service.readFromCookieValue(value)).toEqual(payload);
    advance(1000);
    expect(service.readFromCookieValue(value)).toBeNull();
  });

  it("keeps the session alive when it is renewed, so only inactivity ends it", () => {
    const { service, issue, advance } = setup();
    let cookie = issue();
    for (let i = 0; i < 6; i += 1) { // 6 x 20 minutes of "activity" = 2 hours, far past 30
      advance(20 * MINUTE);
      const current = service.readFromCookieValue(cookie.value);
      expect(current).not.toBeNull();
      const response = NextResponse.json({});
      service.renewCookie(response, current!);
      cookie = response.cookies.get(service.getCookieName())!;
    }
    advance(31 * MINUTE); // then the user goes idle
    expect(service.readFromCookieValue(cookie.value)).toBeNull();
  });

  it("gives the browser the same 30 minutes", () => {
    const { issue } = setup();
    expect(issue().maxAge).toBe(SESSION_IDLE_SECONDS);
  });

  it("rejects a cookie that was tampered with, even if it has not expired", () => {
    const { service, issue } = setup();
    const [encoded, signature] = issue().value.split(".");
    const forged = Buffer.from(JSON.stringify({ userInv: "admin", empId: "1", exp: 9_999_999_999 })).toString("base64url");
    expect(service.readFromCookieValue(`${forged}.${signature}`)).toBeNull();
    expect(service.readFromCookieValue(`${encoded}.${"0".repeat(signature.length)}`)).toBeNull();
  });

  it("rejects a cookie that has no expiry (issued before idle timeouts existed)", () => {
    const { service } = setup();
    // A validly signed payload that lacks `exp`, made through the service's own signing.
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = (service as unknown as { sign(value: string): string }).sign(encoded);
    expect(service.readFromCookieValue(`${encoded}.${signature}`)).toBeNull();
  });

  it("rejects missing or malformed values", () => {
    const { service } = setup();
    for (const value of [undefined, "", "nodot", ".sig", "abc."]) {
      expect(service.readFromCookieValue(value)).toBeNull();
    }
  });
});
