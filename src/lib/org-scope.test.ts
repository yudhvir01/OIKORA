import { describe, expect, it } from "vitest";

import { applyOrgScope } from "./org-scope";

describe("applyOrgScope", () => {
  it("injects organizationId into an empty where for a scoped model", () => {
    const result = applyOrgScope("Product", "findMany", {}, "org1");
    expect(result).toEqual({ where: { organizationId: "org1" } });
  });

  it("merges organizationId into an existing where without dropping other filters", () => {
    const result = applyOrgScope(
      "Product",
      "findMany",
      { where: { name: { contains: "widget" } } },
      "org1",
    );
    expect(result).toEqual({
      where: { name: { contains: "widget" }, organizationId: "org1" },
    });
  });

  it("scopes findUnique-by-id lookups, preserving the id filter", () => {
    const result = applyOrgScope(
      "Product",
      "findUnique",
      { where: { id: "prod1" } },
      "org1",
    );
    expect(result).toEqual({ where: { id: "prod1", organizationId: "org1" } });
  });

  it("scopes update/delete by id", () => {
    expect(
      applyOrgScope("Product", "update", { where: { id: "p1" }, data: { name: "x" } }, "org1"),
    ).toEqual({ where: { id: "p1", organizationId: "org1" }, data: { name: "x" } });

    expect(applyOrgScope("Product", "delete", { where: { id: "p1" } }, "org1")).toEqual({
      where: { id: "p1", organizationId: "org1" },
    });
  });

  it("scopes updateMany/deleteMany/count/aggregate/groupBy", () => {
    for (const operation of ["updateMany", "deleteMany", "count", "aggregate", "groupBy"]) {
      const result = applyOrgScope(
        "StockTransaction",
        operation,
        { where: { productId: "p1" } },
        "org1",
      );
      expect(result).toEqual({ where: { productId: "p1", organizationId: "org1" } });
    }
  });

  it("scopes upsert's where but leaves create/update payloads untouched", () => {
    const result = applyOrgScope(
      "StockLevel",
      "upsert",
      {
        where: { productId_locationId: { productId: "p1", locationId: "l1" } },
        create: { productId: "p1", locationId: "l1", quantity: 5 },
        update: { quantity: { increment: 5 } },
      },
      "org1",
    );
    expect(result).toEqual({
      where: {
        productId_locationId: { productId: "p1", locationId: "l1" },
        organizationId: "org1",
      },
      create: { productId: "p1", locationId: "l1", quantity: 5 },
      update: { quantity: { increment: 5 } },
    });
  });

  it("leaves create args untouched -- callers still set organizationId explicitly", () => {
    const args = { data: { name: "Widgets" } };
    expect(applyOrgScope("Category", "create", args, "org1")).toBe(args);
  });

  it("leaves non-scoped models (e.g. User, Membership) untouched", () => {
    const args = { where: { email: "a@example.com" } };
    expect(applyOrgScope("User", "findUnique", args, "org1")).toBe(args);
  });

  it("leaves operations with no model (e.g. raw queries) untouched", () => {
    const args = { where: {} };
    expect(applyOrgScope(undefined, "findMany", args, "org1")).toBe(args);
  });
});
