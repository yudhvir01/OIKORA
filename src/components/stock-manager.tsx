"use client";

import { useState } from "react";

type Product = { id: string; sku: string; name: string };
type Location = { id: string; name: string };

type StockLevel = {
  id: string;
  quantity: number;
  product: Product;
  location: Location;
};

type TransactionType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

type Transaction = {
  id: string;
  type: TransactionType;
  quantity: number;
  note: string | null;
  createdAt: Date | string;
  product: Product;
  location: Location;
  createdBy: { id: string; name: string | null; email: string };
};

function MovementForm({
  title,
  actionLabel,
  endpoint,
  products,
  locations,
  disabled,
  onSuccess,
}: {
  title: string;
  actionLabel: string;
  endpoint: string;
  products: Product[];
  locations: Location[];
  disabled: boolean;
  onSuccess: (data: { stockLevel: StockLevel; transaction: Transaction }) => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedQuantity = Number(quantity);
    if (!productId || !locationId) {
      setError("Select a product and a location");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          locationId,
          quantity: parsedQuantity,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Failed to ${actionLabel.toLowerCase()}`);
        return;
      }
      onSuccess(data);
      setQuantity("");
      setNote("");
    } finally {
      setPending(false);
    }
  }

  const idPrefix = endpoint.replace(/\W/g, "-");

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-product`} className="text-sm font-medium">
          Product
        </label>
        <select
          id={`${idPrefix}-product`}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-location`} className="text-sm font-medium">
          Location
        </label>
        <select
          id={`${idPrefix}-location`}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-quantity`} className="text-sm font-medium">
          Quantity
        </label>
        <input
          id={`${idPrefix}-quantity`}
          type="number"
          min={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-note`} className="text-sm font-medium">
          Note (optional)
        </label>
        <input
          id={`${idPrefix}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || disabled}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {actionLabel}
      </button>
    </form>
  );
}

function TransferForm({
  products,
  locations,
  disabled,
  onSuccess,
}: {
  products: Product[];
  locations: Location[];
  disabled: boolean;
  onSuccess: (data: {
    fromStockLevel: StockLevel;
    toStockLevel: StockLevel;
    transferOut: Transaction;
    transferIn: Transaction;
  }) => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id ?? "");
  const [toLocationId, setToLocationId] = useState(locations[1]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedQuantity = Number(quantity);
    if (!productId || !fromLocationId || !toLocationId) {
      setError("Select a product and both locations");
      return;
    }
    if (fromLocationId === toLocationId) {
      setError("Source and destination locations must be different");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/stock-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          fromLocationId,
          toLocationId,
          quantity: parsedQuantity,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to transfer stock");
        return;
      }
      onSuccess(data);
      setQuantity("");
      setNote("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Transfer stock
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="transfer-product" className="text-sm font-medium">
          Product
        </label>
        <select
          id="transfer-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="transfer-from" className="text-sm font-medium">
          From location
        </label>
        <select
          id="transfer-from"
          value={fromLocationId}
          onChange={(e) => setFromLocationId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="transfer-to" className="text-sm font-medium">
          To location
        </label>
        <select
          id="transfer-to"
          value={toLocationId}
          onChange={(e) => setToLocationId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="transfer-quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="transfer-quantity"
          type="number"
          min={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="transfer-note" className="text-sm font-medium">
          Note (optional)
        </label>
        <input
          id="transfer-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || disabled || locations.length < 2}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Transfer stock
      </button>
    </form>
  );
}

export function StockManager({
  products,
  locations,
  initialStockLevels,
  initialTransactions,
}: {
  products: Product[];
  locations: Location[];
  initialStockLevels: StockLevel[];
  initialTransactions: Transaction[];
}) {
  const [stockLevels, setStockLevels] = useState(initialStockLevels);
  const [transactions, setTransactions] = useState(initialTransactions);

  function upsertStockLevel(prev: StockLevel[], updated: StockLevel) {
    const idx = prev.findIndex((s) => s.id === updated.id);
    if (idx === -1) {
      return [...prev, updated].sort(
        (a, b) =>
          a.product.name.localeCompare(b.product.name) ||
          a.location.name.localeCompare(b.location.name),
      );
    }
    return prev.map((s) => (s.id === updated.id ? updated : s));
  }

  function applyResult(data: { stockLevel: StockLevel; transaction: Transaction }) {
    setStockLevels((prev) =>
      upsertStockLevel(prev, {
        ...data.stockLevel,
        product: data.transaction.product,
        location: data.transaction.location,
      }),
    );
    setTransactions((prev) => [data.transaction, ...prev].slice(0, 10));
  }

  function applyTransferResult(data: {
    fromStockLevel: StockLevel;
    toStockLevel: StockLevel;
    transferOut: Transaction;
    transferIn: Transaction;
  }) {
    setStockLevels((prev) => {
      const withFrom = upsertStockLevel(prev, {
        ...data.fromStockLevel,
        product: data.transferOut.product,
        location: data.transferOut.location,
      });
      return upsertStockLevel(withFrom, {
        ...data.toStockLevel,
        product: data.transferIn.product,
        location: data.transferIn.location,
      });
    });
    setTransactions((prev) =>
      [data.transferOut, data.transferIn, ...prev].slice(0, 10),
    );
  }

  const disabled = products.length === 0 || locations.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {disabled ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add at least one product and one location before recording stock
          movements.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        <MovementForm
          title="Receive stock"
          actionLabel="Receive stock"
          endpoint="/api/stock-in"
          products={products}
          locations={locations}
          disabled={disabled}
          onSuccess={applyResult}
        />
        <MovementForm
          title="Issue stock"
          actionLabel="Issue stock"
          endpoint="/api/stock-out"
          products={products}
          locations={locations}
          disabled={disabled}
          onSuccess={applyResult}
        />
        <TransferForm
          products={products}
          locations={locations}
          disabled={disabled}
          onSuccess={applyTransferResult}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Current stock levels
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2 font-medium">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {stockLevels.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-zinc-500 dark:text-zinc-400">
                  No stock recorded yet.
                </td>
              </tr>
            ) : (
              stockLevels.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-2">
                    {s.product.name} ({s.product.sku})
                  </td>
                  <td className="py-2 pr-2">{s.location.name}</td>
                  <td className="py-2 pr-2">{s.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Recent stock movements
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2 font-medium">Quantity</th>
              <th className="py-2 font-medium">By</th>
              <th className="py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-zinc-500 dark:text-zinc-400">
                  No stock movements yet.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className={
                        t.type === "STOCK_IN" || t.type === "TRANSFER_IN"
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      }
                    >
                      {
                        {
                          STOCK_IN: "In",
                          STOCK_OUT: "Out",
                          TRANSFER_IN: "Transfer in",
                          TRANSFER_OUT: "Transfer out",
                        }[t.type]
                      }
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    {t.product.name} ({t.product.sku})
                  </td>
                  <td className="py-2 pr-2">{t.location.name}</td>
                  <td className="py-2 pr-2">
                    {t.type === "STOCK_IN" || t.type === "TRANSFER_IN"
                      ? "+"
                      : "-"}
                    {t.quantity}
                  </td>
                  <td className="py-2 pr-2">
                    {t.createdBy.name ?? t.createdBy.email}
                  </td>
                  <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                    {t.note ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
