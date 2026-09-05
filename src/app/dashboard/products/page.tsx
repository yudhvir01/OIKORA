import { auth } from "@/auth";
import { ProductList } from "@/components/product-list";
import { scopedDb } from "@/lib/scoped-db";

export default async function ProductsPage() {
  const session = await auth();
  const db = scopedDb(session!.user.activeOrganizationId);
  const categories = await db.category.findMany({
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
