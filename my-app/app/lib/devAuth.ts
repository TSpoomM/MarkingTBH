import type { HrkpisSession } from "./hrkpisSession";

export const isDevAuthBypassEnabled =
  process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";

const DEV_AUTH_EMP_ID = process.env.DEV_AUTH_EMP_ID?.trim() || "10180";

export function getDevAuthSession(): HrkpisSession {
  return {
    userId: DEV_AUTH_EMP_ID,
    empId: DEV_AUTH_EMP_ID,
    userInv: DEV_AUTH_EMP_ID,
  };
}

