import { StockInManager } from "@/components/stock-in-manager";
import { prisma } from "@/lib/prisma";

export default async function StockPage() {
  const [products, locations, stockLevels, transactions] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true },
    }),
    prisma.location.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.stockLevel.findMany({
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { location: { name: "asc" } }],
    }),
    prisma.stockTransaction.findMany({
      where: { type: "STOCK_IN" },
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
      <StockInManager
        products={products}
        locations={locations}
        initialStockLevels={stockLevels}
        initialTransactions={transactions}
      />
    </div>
  );
}
