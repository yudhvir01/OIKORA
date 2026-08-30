export type PurchaseOrderStatus = "DRAFT" | "SUBMITTED" | "RECEIVED" | "CANCELLED";

// Receiving (-> RECEIVED) is handled by a dedicated endpoint once line
// items exist, since it needs to create stock-in transactions atomically.
export const PURCHASE_ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CANCELLED"],
};

export function canTransitionPurchaseOrderStatus(
  from: string,
  to: string,
): boolean {
  return (PURCHASE_ORDER_TRANSITIONS[from] ?? []).includes(to);
}
