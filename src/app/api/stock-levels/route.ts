import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { scopedDb } from "@/lib/scoped-db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = scopedDb(session.user.activeOrganizationId);

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;

  const stockLevels = await db.stockLevel.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { location: { name: "asc" } }],
  });

  return NextResponse.json(stockLevels);
}
