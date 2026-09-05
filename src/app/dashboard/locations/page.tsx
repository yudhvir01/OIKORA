import { auth } from "@/auth";
import { LocationManager } from "@/components/location-manager";
import { scopedDb } from "@/lib/scoped-db";

export default async function LocationsPage() {
  const session = await auth();
  const db = scopedDb(session!.user.activeOrganizationId);
  const locations = await db.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Locations
      </h1>
      <LocationManager initialLocations={locations} />
    </div>
  );
}
