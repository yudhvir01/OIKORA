export type StockMovementInput = {
  productId?: unknown;
  locationId?: unknown;
  quantity?: unknown;
  note?: unknown;
};

export type ValidatedStockMovement = {
  productId: string;
  locationId: string;
  quantity: number;
  note: string | null;
};

export type StockMovementValidationError = { field: string; message: string };

// Shared request-shape validation for the stock-in and stock-out endpoints:
// productId/locationId must be non-empty strings and quantity a positive
// integer. Existence of the referenced product/location is checked
// separately by the caller, since that needs a database lookup.
export function validateStockMovementInput(
  body: StockMovementInput,
): { data: ValidatedStockMovement } | { error: StockMovementValidationError } {
  const productId =
    typeof body?.productId === "string" ? body.productId.trim() : "";
  const locationId =
    typeof body?.locationId === "string" ? body.locationId.trim() : "";

  if (!productId || !locationId) {
    return {
      error: { field: "productId", message: "productId and locationId are required" },
    };
  }

  const quantity = Number(body?.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      error: { field: "quantity", message: "quantity must be a positive integer" },
    };
  }

  const note =
    typeof body?.note === "string" && body.note.trim() !== ""
      ? body.note.trim()
      : null;

  return { data: { productId, locationId, quantity, note } };
}
