// Opt-in timing for finding slow steps: set TIMING=1 in .env.local and watch the server console.
const ENABLED = process.env.TIMING === "1";
const SLOW_MS = Number(process.env.TIMING_SLOW_MS) || 0;

export class Timing {
  get enabled() {
    return ENABLED;
  }

  /** Runs `task` and logs how long it took; a no-op wrapper when timing is off. */
  async measure<T>(label: string, task: () => Promise<T>): Promise<T> {
    if (!ENABLED) return task();
    const start = performance.now();
    try {
      return await task();
    } finally {
      const elapsed = performance.now() - start;
      if (elapsed >= SLOW_MS) console.log(`[timing] ${elapsed.toFixed(1).padStart(7)} ms  ${label}`);
    }
  }

  /** One-line summary of a SQL statement, so log lines stay readable. */
  describeSql(sql: unknown) {
    const text = typeof sql === "string" ? sql : (sql as { sql?: string } | undefined)?.sql ?? "";
    return text.replace(/\s+/g, " ").trim().slice(0, 90);
  }
}

export const timing = new Timing();
