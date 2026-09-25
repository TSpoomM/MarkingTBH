import { UserFacingError } from "@/src/core/errors/userFacingError";

/**
 * A marking asked for lot numbers that an earlier marking of the same customer, branch and year
 * already used. Repeating a lot is allowed on purpose (e.g. a reprint), so the caller may confirm it.
 */
export class LotOverlapError extends UserFacingError {
  constructor(
    readonly lotStart: number,
    readonly lotEnd: number,
  ) {
    super(`LOT ${lotStart}-${lotEnd} เคยพิมพ์ไปแล้ว`);
    this.name = "LotOverlapError";
  }
}
