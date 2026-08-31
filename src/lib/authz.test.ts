import { describe, expect, it } from "vitest";

import { requireAdmin } from "@/lib/authz";
import type { Session } from "next-auth";

describe("requireAdmin", () => {
  it("returns 401 when there is no session", async () => {
    const res = requireAdmin(null);
    expect(res?.status).toBe(401);
    expect(await res?.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the session has no user", async () => {
    const res = requireAdmin({} as Session);
    expect(res?.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin session", async () => {
    const session = { user: { role: "STAFF" } } as unknown as Session;
    const res = requireAdmin(session);
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ error: "Forbidden" });
  });

  it("returns null for an admin session", () => {
    const session = { user: { role: "ADMIN" } } as unknown as Session;
    expect(requireAdmin(session)).toBeNull();
  });
});
