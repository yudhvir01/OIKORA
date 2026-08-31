export type StockTransferInput = {
  productId?: unknown;
  fromLocationId?: unknown;
  toLocationId?: unknown;
  quantity?: unknown;
  note?: unknown;
};

export type ValidatedStockTransfer = {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note: string | null;
};

export type StockTransferValidationError = { field: string; message: string };

// Shared request-shape validation for the stock-transfer endpoint: productId
// and both location ids must be non-empty strings, the two locations must
// differ, and quantity must be a positive integer. Existence of the
// referenced product/locations is checked separately by the caller, since
// that needs a database lookup.
export function validateStockTransferInput(
  body: StockTransferInput,
): { data: ValidatedStockTransfer } | { error: StockTransferValidationError } {
  const productId =
    typeof body?.productId === "string" ? body.productId.trim() : "";
  const fromLocationId =
    typeof body?.fromLocationId === "string" ? body.fromLocationId.trim() : "";
  const toLocationId =
    typeof body?.toLocationId === "string" ? body.toLocationId.trim() : "";

  if (!productId || !fromLocationId || !toLocationId) {
    return {
      error: {
        field: "productId",
        message: "productId, fromLocationId, and toLocationId are required",
      },
    };
  }

  if (fromLocationId === toLocationId) {
    return {
      error: {
        field: "toLocationId",
        message: "fromLocationId and toLocationId must be different",
      },
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

  return { data: { productId, fromLocationId, toLocationId, quantity, note } };
}
