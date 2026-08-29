import { prisma } from "@/lib/prisma";
import { getLowStockProducts, type LowStockProduct } from "@/lib/low-stock";

export type ReorderSuggestion = LowStockProduct & {
  suggestedSupplier: { id: string; name: string } | null;
};

// Low-stock products paired with a suggested supplier: whoever they were
// last ordered from, inferred from purchase order line item history. A
// product that has never appeared on a purchase order has no suggestion.
export async function getReorderSuggestions(): Promise<ReorderSuggestion[]> {
  const lowStockProducts = await getLowStockProducts();
  if (lowStockProducts.length === 0) return [];

  const lineItems = await prisma.purchaseOrderLineItem.findMany({
    where: { productId: { in: lowStockProducts.map((p) => p.id) } },
    select: {
      productId: true,
      purchaseOrder: {
        select: { createdAt: true, supplier: { select: { id: true, name: true } } },
      },
    },
    orderBy: { purchaseOrder: { createdAt: "desc" } },
  });

  const latestSupplierByProductId = new Map<
    string,
    { id: string; name: string }
  >();
  for (const lineItem of lineItems) {
    if (!latestSupplierByProductId.has(lineItem.productId)) {
      latestSupplierByProductId.set(
        lineItem.productId,
        lineItem.purchaseOrder.supplier,
      );
    }
  }

  return lowStockProducts.map((product) => ({
    ...product,
    suggestedSupplier: latestSupplierByProductId.get(product.id) ?? null,
  }));
}
