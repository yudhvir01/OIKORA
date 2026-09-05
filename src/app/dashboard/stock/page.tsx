import { auth } from "@/auth";
import { StockManager } from "@/components/stock-manager";
import { scopedDb } from "@/lib/scoped-db";

export default async function StockPage() {
  const session = await auth();
  const db = scopedDb(session!.user.activeOrganizationId);
  const [products, locations, stockLevels, transactions] = await Promise.all([
    db.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true },
    }),
    db.location.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.stockLevel.findMany({
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { location: { name: "asc" } }],
    }),
    db.stockTransaction.findMany({
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Stock
      </h1>
      <StockManager
        products={products}
        locations={locations}
        initialStockLevels={stockLevels}
        initialTransactions={transactions}
      />
    </div>
  );
}
