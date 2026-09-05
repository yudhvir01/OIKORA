import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { scopedDb } from "@/lib/scoped-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = scopedDb(session.user.activeOrganizationId);

  const { id: productId } = await params;

  const product = await db.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 20),
  );

  const where = { productId };

  const [transactions, total] = await Promise.all([
    db.stockTransaction.findMany({
      where,
      include: {
        location: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.stockTransaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
