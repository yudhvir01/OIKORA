import { getReorderSuggestions } from "@/lib/reorder-suggestions";

export default async function ReorderSuggestionsPage() {
  const suggestions = await getReorderSuggestions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reorder Suggestions
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Products below their reorder point, with the supplier they were
          last ordered from.
        </p>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 font-medium">SKU</th>
            <th className="py-2 font-medium">Product</th>
            <th className="py-2 font-medium">In stock</th>
            <th className="py-2 font-medium">Reorder point</th>
            <th className="py-2 font-medium">Suggested supplier</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-zinc-500 dark:text-zinc-400">
                Nothing needs reordering right now.
              </td>
            </tr>
          ) : (
            suggestions.map((product) => (
              <tr
                key={product.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-2 pr-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {product.sku}
                </td>
                <td className="py-2 pr-2">{product.name}</td>
                <td className="py-2 pr-2 text-red-600">
                  {product.totalStock} {product.unit}
                </td>
                <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                  {product.reorderPoint} {product.unit}
                </td>
                <td className="py-2 pr-2">
                  {product.suggestedSupplier ? (
                    product.suggestedSupplier.name
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">
                      No order history
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
