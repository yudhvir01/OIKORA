import { scopedDb } from "@/lib/scoped-db";

export type TopMovedProduct = {
  productId: string;
  sku: string;
  name: string;
  totalQuantity: number;
};

// Products with the most stock movement (in + out + transfers, by unit
// quantity) in the trailing `days` days. A proxy for "what's busy" until
// there's a dedicated activity metric.
export async function getTopMovedProducts(
  organizationId: string,
  days: number,
  limit: number,
): Promise<TopMovedProduct[]> {
  const db = scopedDb(organizationId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const totals = await db.stockTransaction.groupBy({
    by: ["productId"],
    where: { createdAt: { gte: since } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (totals.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: totals.map((t) => t.productId) } },
    select: { id: true, sku: true, name: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  return totals
    .map((t) => {
      const product = productById.get(t.productId);
      if (!product) return null;
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        totalQuantity: t._sum.quantity ?? 0,
      };
    })
    .filter((entry): entry is TopMovedProduct => entry !== null);
}

export type MovementTrendDay = {
  date: string;
  stockIn: number;
  stockOut: number;
};

// Daily stock-in vs. stock-out unit totals for the trailing `days` days,
// oldest first. Transfers are excluded since they don't change total
// stock on hand, only its location.
export async function getMovementTrend(
  organizationId: string,
  days: number,
): Promise<MovementTrendDay[]> {
  const db = scopedDb(organizationId);
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const transactions = await db.stockTransaction.findMany({
    where: {
      createdAt: { gte: since },
      type: { in: ["STOCK_IN", "STOCK_OUT"] },
    },
    select: { type: true, quantity: true, createdAt: true },
  });

  const byDate = new Map<string, { stockIn: number; stockOut: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDate.set(d.toISOString().slice(0, 10), { stockIn: 0, stockOut: 0 });
  }

  for (const tx of transactions) {
    const key = tx.createdAt.toISOString().slice(0, 10);
    const entry = byDate.get(key);
    if (!entry) continue;
    if (tx.type === "STOCK_IN") entry.stockIn += tx.quantity;
    else entry.stockOut += tx.quantity;
  }

  return Array.from(byDate.entries()).map(([date, totals]) => ({
    date,
    ...totals,
  }));
}

// Total value of stock on hand, in cents: sum over every StockLevel of
// quantity * the owning product's unitCostCents. Products without a cost
// set don't contribute (treated as unpriced, not free), so the total is a
// lower bound whenever some products are missing a cost.
export async function getStockValueCents(organizationId: string): Promise<number> {
  const db = scopedDb(organizationId);
  const levels = await db.stockLevel.findMany({
    where: { product: { unitCostCents: { not: null } } },
    select: { quantity: true, product: { select: { unitCostCents: true } } },
  });

  return levels.reduce(
    (total, level) => total + level.quantity * (level.product.unitCostCents ?? 0),
    0,
  );
}
