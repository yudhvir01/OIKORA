import { describe, expect, it } from "vitest";

import { validateStockTransferInput } from "@/lib/stock-transfer";

describe("validateStockTransferInput", () => {
  it("accepts a well-formed request", () => {
    const result = validateStockTransferInput({
      productId: " p1 ",
      fromLocationId: " l1 ",
      toLocationId: " l2 ",
      quantity: 3,
      note: "  moving stock  ",
    });
    expect(result).toEqual({
      data: {
        productId: "p1",
        fromLocationId: "l1",
        toLocationId: "l2",
        quantity: 3,
        note: "moving stock",
      },
    });
  });

  it("defaults a missing/blank note to null", () => {
    const result = validateStockTransferInput({
      productId: "p1",
      fromLocationId: "l1",
      toLocationId: "l2",
      quantity: 1,
      note: "   ",
    });
    expect("data" in result && result.data.note).toBeNull();
  });

  const invalidBodies: Record<string, Record<string, unknown>> = {
    "missing productId": { fromLocationId: "l1", toLocationId: "l2", quantity: 1 },
    "blank fromLocationId": {
      productId: "p1",
      fromLocationId: "",
      toLocationId: "l2",
      quantity: 1,
    },
    "blank toLocationId": {
      productId: "p1",
      fromLocationId: "l1",
      toLocationId: "  ",
      quantity: 1,
    },
  };
  for (const [description, body] of Object.entries(invalidBodies)) {
    it(`rejects a request with ${description}`, () => {
      const result = validateStockTransferInput(body);
      expect("error" in result).toBe(true);
    });
  }

  it("rejects identical source and destination locations", () => {
    const result = validateStockTransferInput({
      productId: "p1",
      fromLocationId: "l1",
      toLocationId: "l1",
      quantity: 1,
    });
    expect("error" in result && result.error.field).toBe("toLocationId");
  });

  for (const quantity of [0, -1, 1.5, NaN, undefined]) {
    it(`rejects a non-positive-integer quantity: ${quantity}`, () => {
      const result = validateStockTransferInput({
        productId: "p1",
        fromLocationId: "l1",
        toLocationId: "l2",
        quantity,
      });
      expect("error" in result).toBe(true);
    });
  }
});
