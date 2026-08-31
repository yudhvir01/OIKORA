const REQUIRED_IN_PRODUCTION = ["DATABASE_URL", "AUTH_SECRET"] as const;

// Fails fast with a clear, actionable error when required env vars are
// missing in production, instead of surfacing as a cryptic downstream
// database-connection or session-signing error once a request comes in
// (or, worse, a build that hangs retrying a DB connection that was never
// going to succeed). Imported for its side effect by src/lib/prisma.ts,
// which is on the import path of nearly every server-side route.
export function assertRequiredEnvVars(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Set them in your deployment platform's project settings — see .env.example.",
    );
  }
}

assertRequiredEnvVars();
