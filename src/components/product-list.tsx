"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  reorderPoint: number;
  totalStock: number;
  category: { id: string; name: string };
};

type Category = { id: string; name: string };

type ProductsResponse = {
  products: Product[];
  pageSize: number;
  nextCursor: string | null;
  hasMore: boolean;
};

type ImportResult = {
  created: number;
  updated: number;
  errors: { line: number; message: string }[];
};

export function ProductList({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  // Stack of cursors visited so far, so "Previous" can pop back. `null`
  // at index 0 always means "from the start."
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const cursor = cursorStack[cursorIndex];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryId) params.set("categoryId", categoryId);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to load products");
          return;
        }
        setData(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Failed to load products");
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search, categoryId, cursor, refreshKey]);

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok) {
        setImportError(json.error ?? "Import failed");
        return;
      }
      setImportResult(json);
      resetToFirstPage();
      setRefreshKey((k) => k + 1);
    } catch {
      setImportError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  function resetToFirstPage() {
    setCursorStack([null]);
    setCursorIndex(0);
  }

  function goNext() {
    if (!data?.nextCursor) return;
    setCursorStack((stack) => [
      ...stack.slice(0, cursorIndex + 1),
      data.nextCursor,
    ]);
    setCursorIndex((i) => i + 1);
  }

  function goPrevious() {
    setCursorIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <input
            id="search"
            placeholder="Name or SKU"
            value={search}
            onChange={(e) => {
              resetToFirstPage();
              setSearch(e.target.value);
            }}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => {
              resetToFirstPage();
              setCategoryId(e.target.value);
            }}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/api/products/export"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Export CSV
        </Link>
        <label className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
          {importing ? "Importing…" : "Import CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImportFile(file);
            }}
          />
        </label>
      </div>

      {importError ? <p className="text-sm text-red-600">{importError}</p> : null}
      {importResult ? (
        <div className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <p className="text-zinc-900 dark:text-zinc-50">
            Import complete: {importResult.created} created, {importResult.updated}{" "}
            updated
            {importResult.errors.length > 0
              ? `, ${importResult.errors.length} row(s) skipped`
              : ""}
            .
          </p>
          {importResult.errors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-red-600">
              {importResult.errors.map((err, i) => (
                <li key={i}>
                  Line {err.line}: {err.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="py-2 font-medium">SKU</th>
            <th scope="col" className="py-2 font-medium">Name</th>
            <th scope="col" className="py-2 font-medium">Category</th>
            <th scope="col" className="py-2 font-medium">Unit</th>
            <th scope="col" className="py-2 font-medium">Stock</th>
            <th scope="col" className="py-2 font-medium">Reorder point</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                Loading…
              </td>
            </tr>
          ) : !data || data.products.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                No products found.
              </td>
            </tr>
          ) : (
            data.products.map((product) => {
              const isLowStock = product.totalStock < product.reorderPoint;
              return (
                <tr
                  key={product.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-2 font-mono text-xs">{product.sku}</td>
                  <td className="py-2 pr-2">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="hover:underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                    {product.category.name}
                  </td>
                  <td className="py-2 pr-2">{product.unit}</td>
                  <td className="py-2 pr-2">
                    <span className="inline-flex items-center gap-1.5">
                      {product.totalStock}
                      {isLowStock ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                          Low stock
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="py-2 pr-2">{product.reorderPoint}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {data && (cursorIndex > 0 || data.hasMore) ? (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>Showing {data.products.length} products</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cursorIndex <= 0}
              onClick={goPrevious}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!data.hasMore}
              onClick={goNext}
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
