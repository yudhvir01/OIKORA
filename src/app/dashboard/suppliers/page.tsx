import { SupplierManager } from "@/components/supplier-manager";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Suppliers
      </h1>
      <SupplierManager initialSuppliers={suppliers} />
    </div>
  );
}
