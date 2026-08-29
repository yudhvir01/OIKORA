import { auth } from "@/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: {
      product: { select: { sku: true, name: true } },
      location: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(transactions, [
    { header: "Date", value: (t) => t.createdAt.toISOString() },
    { header: "Type", value: (t) => t.type },
    { header: "SKU", value: (t) => t.product.sku },
    { header: "Product", value: (t) => t.product.name },
    { header: "Location", value: (t) => t.location.name },
    { header: "Quantity", value: (t) => t.quantity },
    { header: "Note", value: (t) => t.note ?? "" },
    {
      header: "Created By",
      value: (t) => t.createdBy.name ?? t.createdBy.email,
    },
  ]);

  return csvResponse(csv, "stock-transactions.csv");
}
