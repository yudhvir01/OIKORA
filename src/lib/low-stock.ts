import { scopedDb } from "@/lib/scoped-db";

export type LowStockProduct = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  reorderPoint: number;
  totalStock: number;
};

// Products whose stock (summed across all locations) has fallen below
// their reorder point. `reorderPoint = 0` means "no alerting configured
// for this product", so those are excluded even at zero stock.
export async function getLowStockProducts(
  organizationId: string,
): Promise<LowStockProduct[]> {
  const db = scopedDb(organizationId);
  const products = await db.product.findMany({
    where: { reorderPoint: { gt: 0 } },
    select: { id: true, sku: true, name: true, unit: true, reorderPoint: true },
  });
  if (products.length === 0) return [];

  const stockTotals = await db.stockLevel.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) } },
    _sum: { quantity: true },
  });
  const stockByProductId = new Map(
    stockTotals.map((s) => [s.productId, s._sum.quantity ?? 0]),
  );

  return products
    .map((product) => ({
      ...product,
      totalStock: stockByProductId.get(product.id) ?? 0,
    }))
    .filter((product) => product.totalStock < product.reorderPoint)
    .sort((a, b) => a.totalStock - b.totalStock);
}
