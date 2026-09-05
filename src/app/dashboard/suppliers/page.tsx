import { auth } from "@/auth";
import { SupplierManager } from "@/components/supplier-manager";
import { scopedDb } from "@/lib/scoped-db";

export default async function SuppliersPage() {
  const session = await auth();
  const db = scopedDb(session!.user.activeOrganizationId);
  const suppliers = await db.supplier.findMany({
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
