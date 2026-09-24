/**
 * Lets an action run at most once per interval, however often it is requested.
 * Used to tell the server "the user is still here" without a request per keystroke.
 */
export default class ActivityThrottle {
  private lastRun: number;

  constructor(
    private readonly intervalMs: number,
    private readonly now: () => number = Date.now,
  ) {
    this.lastRun = now();
  }

  /** True when the interval has passed since the last time this returned true (or since creation). */
  tryRun() {
    const current = this.now();
    if (current - this.lastRun < this.intervalMs) return false;
    this.lastRun = current;
    return true;
  }
}
