/**
 * An error whose message was written for the end user and is safe to show as-is
 * (duplicate name, record not found, ...). Any other Error is treated as internal:
 * routes log it and answer with a generic message instead of leaking details such as SQL.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
