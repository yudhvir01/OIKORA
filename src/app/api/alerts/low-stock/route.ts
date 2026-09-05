import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getLowStockProducts } from "@/lib/low-stock";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await getLowStockProducts(session.user.activeOrganizationId);
  return NextResponse.json({ products });
}
