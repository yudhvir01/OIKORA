import { describe, expect, it } from "vitest";

import { validateStockMovementInput } from "@/lib/stock-movement";

describe("validateStockMovementInput", () => {
  it("accepts a well-formed request", () => {
    const result = validateStockMovementInput({
      productId: " p1 ",
      locationId: " l1 ",
      quantity: 5,
      note: "  restock  ",
    });
    expect(result).toEqual({
      data: { productId: "p1", locationId: "l1", quantity: 5, note: "restock" },
    });
  });

  it("defaults a missing/blank note to null", () => {
    const result = validateStockMovementInput({
      productId: "p1",
      locationId: "l1",
      quantity: 1,
      note: "   ",
    });
    expect("data" in result && result.data.note).toBeNull();
  });

  const invalidBodies: Record<string, Record<string, unknown>> = {
    "missing productId": { locationId: "l1", quantity: 1 },
    "blank productId": { productId: "", locationId: "l1", quantity: 1 },
    "blank locationId": { productId: "p1", locationId: "  ", quantity: 1 },
  };
  for (const [description, body] of Object.entries(invalidBodies)) {
    it(`rejects a request with ${description}`, () => {
      const result = validateStockMovementInput(body);
      expect("error" in result).toBe(true);
    });
  }

  for (const quantity of [0, -1, 1.5, NaN, undefined]) {
    it(`rejects a non-positive-integer quantity: ${quantity}`, () => {
      const result = validateStockMovementInput({
        productId: "p1",
        locationId: "l1",
        quantity,
      });
      expect("error" in result).toBe(true);
    });
  }
});
