import { describe, expect, it } from "vitest";

import { getPurchaseOrderReceiveError } from "@/lib/purchase-order-receive";

const base = {
  status: "SUBMITTED",
  locationId: "loc-1",
  lineItems: [{ id: "li-1" }],
};

describe("getPurchaseOrderReceiveError", () => {
  it("allows a submitted order with a location and line items", () => {
    expect(getPurchaseOrderReceiveError(base)).toBeNull();
  });

  for (const status of ["DRAFT", "RECEIVED", "CANCELLED"]) {
    it(`rejects a purchase order with status ${status}`, () => {
      const error = getPurchaseOrderReceiveError({ ...base, status });
      expect(error).toContain(status);
    });
  }

  it("rejects an order with no receiving location", () => {
    const error = getPurchaseOrderReceiveError({ ...base, locationId: null });
    expect(error).toMatch(/receiving location/);
  });

  it("rejects an order with no line items", () => {
    const error = getPurchaseOrderReceiveError({ ...base, lineItems: [] });
    expect(error).toMatch(/no line items/);
  });
});
