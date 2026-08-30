import { prisma } from "@/lib/prisma";
import {
  getMovementTrend,
  getStockValueCents,
  getTopMovedProducts,
} from "@/lib/dashboard-analytics";

const TREND_DAYS = 7;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function DashboardPage() {
  const [
    totalProducts,
    totalCategories,
    totalLocations,
    products,
    topMovedProducts,
    movementTrend,
    stockValueCents,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.location.count(),
    prisma.product.findMany({
      select: {
        reorderPoint: true,
        stockLevels: { select: { quantity: true } },
      },
    }),
    getTopMovedProducts(30, 5),
    getMovementTrend(TREND_DAYS),
    getStockValueCents(),
  ]);

  const lowStockCount = products.filter((product) => {
    const totalQuantity = product.stockLevels.reduce(
      (sum, level) => sum + level.quantity,
      0,
    );
    return totalQuantity < product.reorderPoint;
  }).length;

  const stats = [
    { label: "Total Products", value: totalProducts },
    { label: "Low Stock Items", value: lowStockCount },
    { label: "Categories", value: totalCategories },
    { label: "Locations", value: totalLocations },
    {
      label: "Stock Value",
      value: currencyFormatter.format(stockValueCents / 100),
    },
  ];

  const maxTrendValue = Math.max(
    1,
    ...movementTrend.map((day) => Math.max(day.stockIn, day.stockOut)),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 px-5 py-4 dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Top products by movement (30 days)
          </h2>
          {topMovedProducts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              No stock movement recorded yet.
            </p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {topMovedProducts.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="py-1.5 pr-2 text-zinc-900 dark:text-zinc-50">
                      {product.name}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {product.sku}
                    </td>
                    <td className="py-1.5 text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {product.totalQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Movement trend (last {TREND_DAYS} days)
          </h2>
          <div className="mt-4 flex h-32 items-end gap-2">
            {movementTrend.map((day) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-24 w-full items-end gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-emerald-500/70"
                    style={{
                      height: `${(day.stockIn / maxTrendValue) * 100}%`,
                    }}
                    title={`In: ${day.stockIn}`}
                  />
                  <div
                    className="flex-1 rounded-t bg-red-500/70"
                    style={{
                      height: `${(day.stockOut / maxTrendValue) * 100}%`,
                    }}
                    title={`Out: ${day.stockOut}`}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" /> In
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500/70" /> Out
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
