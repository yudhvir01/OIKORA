import { auth } from "@/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const stockTotals = await prisma.stockLevel.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  const stockByProductId = new Map(
    stockTotals.map((s) => [s.productId, s._sum.quantity ?? 0]),
  );

  const csv = toCsv(products, [
    { header: "SKU", value: (p) => p.sku },
    { header: "Name", value: (p) => p.name },
    { header: "Category", value: (p) => p.category.name },
    { header: "Unit", value: (p) => p.unit },
    { header: "Reorder Point", value: (p) => p.reorderPoint },
    { header: "Total Stock", value: (p) => stockByProductId.get(p.id) ?? 0 },
  ]);

  return csvResponse(csv, "products.csv");
}
