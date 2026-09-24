import { describe, expect, it, vi } from "vitest";
import { Database } from "./db";
import { findEnvProblems, readDbConfig } from "./serverEnv";
import { clientMessage } from "./apiError";
import { UserFacingError } from "@/src/core/errors/userFacingError";

const validDb = { DB_HOST: "localhost", DB_USER: "root", DB_NAME: "tbh", DB_PORT: "3306" };

describe("readDbConfig", () => {
  it("reads a complete configuration, allowing an empty password", () => {
    expect(readDbConfig(validDb)).toEqual({ host: "localhost", user: "root", password: "", database: "tbh", port: 3306 });
    expect(readDbConfig({ ...validDb, DB_PASSWORD: "secret" }).password).toBe("secret");
  });

  it("names every missing variable in one message", () => {
    expect(() => readDbConfig({ DB_HOST: "localhost", DB_USER: "  " }))
      .toThrow("Missing database environment variable(s): DB_USER, DB_NAME, DB_PORT");
  });

  it("points at .env.example so a newcomer knows what to do", () => {
    expect(() => readDbConfig({})).toThrow(".env.example");
  });

  it.each(["abc", "0", "70000", "33.5", "-1"])("rejects DB_PORT %s", (port) => {
    expect(() => readDbConfig({ ...validDb, DB_PORT: port })).toThrow("DB_PORT must be a port number");
  });
});

describe("findEnvProblems", () => {
  it("is empty for a working setup", () => {
    expect(findEnvProblems(validDb)).toEqual([]);
    expect(findEnvProblems({ ...validDb, NODE_ENV: "production", AUTH_SESSION_SECRET: "x" })).toEqual([]);
  });

  it("does not require the session secret outside production", () => {
    expect(findEnvProblems({ ...validDb, NODE_ENV: "development" })).toEqual([]);
  });

  it("requires the session secret in production", () => {
    const problems = findEnvProblems({ ...validDb, NODE_ENV: "production" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("AUTH_SESSION_SECRET");
  });

  it("reports database and secret problems together", () => {
    expect(findEnvProblems({ NODE_ENV: "production" })).toHaveLength(2);
  });
});

describe("clientMessage", () => {
  it("shows the text of a user-facing error", () => {
    expect(clientMessage(new UserFacingError("Destination นี้มีอยู่แล้ว"), "fallback")).toBe("Destination นี้มีอยู่แล้ว");
  });

  it("hides the text of any other error", () => {
    expect(clientMessage(new Error("Unknown column 'x' in tb_destination"), "fallback")).toBe("fallback");
    expect(clientMessage("string", "fallback")).toBe("fallback");
    expect(clientMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("Database", () => {
  it("does not touch the environment until the pool is used, then explains what is missing", () => {
    vi.stubEnv("DB_HOST", "");
    try {
      const database = new Database(); // creating it must not throw
      expect(() => database.pool).toThrow("Missing database environment variable(s): DB_HOST");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
