import { ProductList } from "@/components/product-list";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Products
      </h1>
      <ProductList categories={categories} />
    </div>
  );
}
