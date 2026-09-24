import { UserFacingError } from "@/src/core/errors/userFacingError";

/** The message a route may show the client: the error's own text if it is user-facing, otherwise `fallback`. */
export function clientMessage(error: unknown, fallback: string) {
  return error instanceof UserFacingError ? error.message : fallback;
}

/** Logs an error unless it is an expected, user-facing one (those are normal outcomes such as "not found"). */
export function logUnexpected(label: string, error: unknown) {
  if (!(error instanceof UserFacingError)) console.error(label, error);
}
