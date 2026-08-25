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

type Transaction = {
  id: string;
  quantity: number;
  note: string | null;
  createdAt: Date | string;
  product: Product;
  location: Location;
  createdBy: { id: string; name: string | null; email: string };
};

export function StockInManager({
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
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleReceive(e: React.FormEvent) {
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
      const res = await fetch("/api/stock-in", {
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
        setError(data.error ?? "Failed to receive stock");
        return;
      }

      setStockLevels((prev) => {
        const idx = prev.findIndex((s) => s.id === data.stockLevel.id);
        const updated: StockLevel = {
          ...data.stockLevel,
          product: data.transaction.product,
          location: data.transaction.location,
        };
        if (idx === -1) {
          return [...prev, updated].sort(
            (a, b) =>
              a.product.name.localeCompare(b.product.name) ||
              a.location.name.localeCompare(b.location.name),
          );
        }
        return prev.map((s) => (s.id === updated.id ? updated : s));
      });
      setTransactions((prev) => [data.transaction, ...prev].slice(0, 10));
      setQuantity("");
      setNote("");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleReceive}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-end sm:flex-wrap"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="stock-in-product" className="text-sm font-medium">
            Product
          </label>
          <select
            id="stock-in-product"
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
          <label htmlFor="stock-in-location" className="text-sm font-medium">
            Location
          </label>
          <select
            id="stock-in-location"
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
        <div className="flex w-28 flex-col gap-1">
          <label htmlFor="stock-in-quantity" className="text-sm font-medium">
            Quantity
          </label>
          <input
            id="stock-in-quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-1 min-w-40 flex-col gap-1">
          <label htmlFor="stock-in-note" className="text-sm font-medium">
            Note (optional)
          </label>
          <input
            id="stock-in-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending || products.length === 0 || locations.length === 0}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Receive stock
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {products.length === 0 || locations.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add at least one product and one location before receiving stock.
        </p>
      ) : null}

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
          Recent stock-in transactions
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 font-medium">Date</th>
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
                <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                  No stock-in transactions yet.
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
                    {t.product.name} ({t.product.sku})
                  </td>
                  <td className="py-2 pr-2">{t.location.name}</td>
                  <td className="py-2 pr-2">+{t.quantity}</td>
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
