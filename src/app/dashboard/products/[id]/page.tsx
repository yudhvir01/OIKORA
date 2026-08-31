import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductTransactionHistory } from "@/components/product-transaction-history";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      stockLevels: {
        include: { location: { select: { id: true, name: true } } },
        orderBy: { location: { name: "asc" } },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const totalQuantity = product.stockLevels.reduce(
    (sum, level) => sum + level.quantity,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/dashboard/products"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          &larr; Back to products
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {product.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {product.sku} &middot; {product.category.name} &middot; {product.unit}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Total stock
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {totalQuantity}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Reorder point
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {product.reorderPoint}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Stock by location
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th scope="col" className="py-2 font-medium">Location</th>
                <th scope="col" className="py-2 font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {product.stockLevels.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-zinc-500 dark:text-zinc-400">
                    No stock recorded for this product yet.
                  </td>
                </tr>
              ) : (
                product.stockLevels.map((level) => (
                  <tr
                    key={level.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-2">{level.location.name}</td>
                    <td className="py-2 pr-2">{level.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductTransactionHistory productId={product.id} />
    </div>
  );
}
