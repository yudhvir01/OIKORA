import { describe, expect, it } from "vitest";

import { canTransitionPurchaseOrderStatus } from "@/lib/purchase-order-status";

describe("canTransitionPurchaseOrderStatus", () => {
  it("allows DRAFT -> SUBMITTED", () => {
    expect(canTransitionPurchaseOrderStatus("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows DRAFT -> CANCELLED", () => {
    expect(canTransitionPurchaseOrderStatus("DRAFT", "CANCELLED")).toBe(true);
  });

  it("allows SUBMITTED -> CANCELLED", () => {
    expect(canTransitionPurchaseOrderStatus("SUBMITTED", "CANCELLED")).toBe(true);
  });

  it("rejects SUBMITTED -> SUBMITTED (no-op resubmit)", () => {
    expect(canTransitionPurchaseOrderStatus("SUBMITTED", "SUBMITTED")).toBe(false);
  });

  it("rejects transitions out of a terminal state", () => {
    expect(canTransitionPurchaseOrderStatus("RECEIVED", "CANCELLED")).toBe(false);
    expect(canTransitionPurchaseOrderStatus("CANCELLED", "SUBMITTED")).toBe(false);
  });

  it("rejects transitioning directly to RECEIVED (must go through the receive endpoint)", () => {
    expect(canTransitionPurchaseOrderStatus("SUBMITTED", "RECEIVED")).toBe(false);
  });
});
