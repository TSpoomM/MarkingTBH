export type EnvSource = Record<string, string | undefined>;

const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_NAME", "DB_PORT"] as const;
const SETUP_HINT = "Copy .env.example to .env and fill in the values.";

/**
 * Reads the MySQL connection settings and fails with a message that names what is missing.
 * DB_PASSWORD may be empty (a local XAMPP root user has none), so it is not required.
 */
export function readDbConfig(env: EnvSource = process.env) {
  const missing = REQUIRED_DB_VARS.filter((name) => !env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing database environment variable(s): ${missing.join(", ")}. ${SETUP_HINT}`);
  }

  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`DB_PORT must be a port number between 1 and 65535 (got "${env.DB_PORT}"). ${SETUP_HINT}`);
  }

  return {
    host: env.DB_HOST!.trim(),
    user: env.DB_USER!.trim(),
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME!.trim(),
    port,
  };
}

/** Everything wrong with the environment, as readable lines; empty when the server can start. */
export function findEnvProblems(env: EnvSource = process.env) {
  const problems: string[] = [];
  try {
    readDbConfig(env);
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  if (env.NODE_ENV === "production" && !env.AUTH_SESSION_SECRET?.trim()) {
    problems.push(`AUTH_SESSION_SECRET is required in production. ${SETUP_HINT}`);
  }
  return problems;
}
