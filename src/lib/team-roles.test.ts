import { describe, expect, it } from "vitest";

import { wouldRemoveLastOwner } from "./team-roles";

const memberships = [
  { id: "m1", role: "OWNER" as const },
  { id: "m2", role: "ADMIN" as const },
];

describe("wouldRemoveLastOwner", () => {
  it("blocks removing the sole owner", () => {
    expect(wouldRemoveLastOwner(memberships, "m1", "remove")).toBe(true);
  });

  it("blocks demoting the sole owner to a non-owner role", () => {
    expect(wouldRemoveLastOwner(memberships, "m1", { newRole: "ADMIN" })).toBe(true);
  });

  it("allows re-affirming the sole owner as owner", () => {
    expect(wouldRemoveLastOwner(memberships, "m1", { newRole: "OWNER" })).toBe(false);
  });

  it("allows removing/demoting an owner when another owner remains", () => {
    const twoOwners = [...memberships, { id: "m3", role: "OWNER" as const }];
    expect(wouldRemoveLastOwner(twoOwners, "m1", "remove")).toBe(false);
    expect(wouldRemoveLastOwner(twoOwners, "m1", { newRole: "STAFF" })).toBe(false);
  });

  it("is a no-op for non-owner memberships", () => {
    expect(wouldRemoveLastOwner(memberships, "m2", "remove")).toBe(false);
  });

  it("is a no-op for an unknown membership id", () => {
    expect(wouldRemoveLastOwner(memberships, "does-not-exist", "remove")).toBe(false);
  });
});
