import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { scopedDb } from "@/lib/scoped-db";
import { validateStockMovementInput } from "@/lib/stock-movement";

class InsufficientStockError extends Error {
  constructor(public available: number) {
    super("Insufficient stock");
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = scopedDb(session.user.activeOrganizationId);

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 20),
  );

  const transactions = await db.stockTransaction.findMany({
    where: {
      type: "STOCK_OUT",
      ...(productId ? { productId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      location: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const validated = validateStockMovementInput(body ?? {});
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error.message }, { status: 400 });
  }
  const { productId, locationId, quantity, note } = validated.data;
  const organizationId = session.user.activeOrganizationId;
  const db = scopedDb(organizationId);

  const [product, location] = await Promise.all([
    db.product.findUnique({ where: { id: productId } }),
    db.location.findUnique({ where: { id: locationId } }),
  ]);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const { count } = await tx.stockLevel.updateMany({
        where: { productId, locationId, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });

      if (count === 0) {
        const level = await tx.stockLevel.findUnique({
          where: { productId_locationId: { productId, locationId } },
        });
        throw new InsufficientStockError(level?.quantity ?? 0);
      }

      const stockLevel = await tx.stockLevel.findUniqueOrThrow({
        where: { productId_locationId: { productId, locationId } },
      });
      const transaction = await tx.stockTransaction.create({
        data: {
          type: "STOCK_OUT",
          quantity,
          productId,
          locationId,
          organizationId,
          note,
          createdById: session.user.id,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
          location: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return { stockLevel, transaction };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: `Insufficient stock: ${err.available} available at this location`,
        },
        { status: 409 },
      );
    }
    throw err;
  }
}
