"use client";

import { useEffect, useState } from "react";

type TransactionType = "STOCK_IN" | "STOCK_OUT" | "TRANSFER_IN" | "TRANSFER_OUT";

type Transaction = {
  id: string;
  type: TransactionType;
  quantity: number;
  note: string | null;
  createdAt: string;
  location: { id: string; name: string };
  createdBy: { id: string; name: string | null; email: string };
};

type TransactionsResponse = {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const TYPE_LABELS: Record<TransactionType, string> = {
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  TRANSFER_IN: "Transfer in",
  TRANSFER_OUT: "Transfer out",
};

export function ProductTransactionHistory({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/products/${productId}/transactions?page=${page}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to load transaction history");
          return;
        }
        setData(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Failed to load transaction history");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [productId, page]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        Transaction history
      </h2>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="py-2 font-medium">Date</th>
            <th scope="col" className="py-2 font-medium">Type</th>
            <th scope="col" className="py-2 font-medium">Location</th>
            <th scope="col" className="py-2 font-medium">Quantity</th>
            <th scope="col" className="py-2 font-medium">By</th>
            <th scope="col" className="py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                Loading…
              </td>
            </tr>
          ) : !data || data.transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                No stock movements recorded for this product yet.
              </td>
            </tr>
          ) : (
            data.transactions.map((t) => (
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
                    {TYPE_LABELS[t.type]}
                  </span>
                </td>
                <td className="py-2 pr-2">{t.location.name}</td>
                <td className="py-2 pr-2">
                  {t.type === "STOCK_IN" || t.type === "TRANSFER_IN" ? "+" : "-"}
                  {t.quantity}
                </td>
                <td className="py-2 pr-2">{t.createdBy.name ?? t.createdBy.email}</td>
                <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                  {t.note ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Page {data.page} of {data.totalPages} &middot; {data.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
