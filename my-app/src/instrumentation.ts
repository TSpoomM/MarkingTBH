/**
 * Runs once when the Next.js server starts. A misconfigured environment is reported here,
 * rather than as a confusing failure on the first request. In production it stops the server.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { findEnvProblems } = await import("@/src/lib/server/serverEnv");
  const problems = findEnvProblems();
  if (!problems.length) return;

  const report = problems.map((problem) => `  - ${problem}`).join("\n");
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Server is misconfigured:\n${report}`);
  }
  console.error(`Environment problems (the app will not work until fixed):\n${report}`);
}
