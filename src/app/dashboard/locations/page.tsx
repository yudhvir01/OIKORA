import { LocationManager } from "@/components/location-manager";
import { prisma } from "@/lib/prisma";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
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
