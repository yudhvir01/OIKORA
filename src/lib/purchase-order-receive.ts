export type ReceivablePurchaseOrder = {
  status: string;
  locationId: string | null;
  lineItems: readonly unknown[];
};

// Preconditions for POST /api/purchase-orders/[id]/receive: only a
// SUBMITTED order with a receiving location and at least one line item can
// be received. Returns a human-readable error, or null if receivable.
export function getPurchaseOrderReceiveError(
  purchaseOrder: ReceivablePurchaseOrder,
): string | null {
  if (purchaseOrder.status !== "SUBMITTED") {
    return `Cannot receive a purchase order with status ${purchaseOrder.status}`;
  }
  if (!purchaseOrder.locationId) {
    return "Purchase order has no receiving location";
  }
  if (purchaseOrder.lineItems.length === 0) {
    return "Cannot receive a purchase order with no line items";
  }
  return null;
}
