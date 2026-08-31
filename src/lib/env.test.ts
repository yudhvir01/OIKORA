import { afterEach, describe, expect, it, vi } from "vitest";

import { assertRequiredEnvVars } from "@/lib/env";

describe("assertRequiredEnvVars", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does nothing outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => assertRequiredEnvVars()).not.toThrow();
  });

  it("does nothing in production when all required vars are set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/db");
    vi.stubEnv("AUTH_SECRET", "secret");
    expect(() => assertRequiredEnvVars()).not.toThrow();
  });

  it("throws naming every missing required var in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => assertRequiredEnvVars()).toThrowError(
      /DATABASE_URL.*AUTH_SECRET/,
    );
  });

  it("throws naming only the vars that are actually missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/db");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => assertRequiredEnvVars()).toThrowError(/AUTH_SECRET/);
    expect(() => assertRequiredEnvVars()).not.toThrowError(/DATABASE_URL/);
  });
});
