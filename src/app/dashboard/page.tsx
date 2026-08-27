import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [totalProducts, totalCategories, totalLocations, products] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.location.count(),
      prisma.product.findMany({
        select: {
          reorderPoint: true,
          stockLevels: { select: { quantity: true } },
        },
      }),
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
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
