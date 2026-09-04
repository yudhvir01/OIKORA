import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateStockTransferInput } from "@/lib/stock-transfer";

class InsufficientStockError extends Error {
  constructor(public available: number) {
    super("Insufficient stock");
  }
}

const TRANSACTION_INCLUDE = {
  product: { select: { id: true, sku: true, name: true } },
  location: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 20),
  );

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      type: { in: ["TRANSFER_IN", "TRANSFER_OUT"] },
      organizationId: session.user.activeOrganizationId,
      ...(productId ? { productId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: TRANSACTION_INCLUDE,
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
  const validated = validateStockTransferInput(body ?? {});
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error.message }, { status: 400 });
  }
  const { productId, fromLocationId, toLocationId, quantity, note } =
    validated.data;
  const organizationId = session.user.activeOrganizationId;

  const [product, fromLocation, toLocation] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId, organizationId } }),
    prisma.location.findUnique({ where: { id: fromLocationId, organizationId } }),
    prisma.location.findUnique({ where: { id: toLocationId, organizationId } }),
  ]);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }
  if (!fromLocation) {
    return NextResponse.json(
      { error: "Source location not found" },
      { status: 400 },
    );
  }
  if (!toLocation) {
    return NextResponse.json(
      { error: "Destination location not found" },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.stockLevel.updateMany({
        where: {
          productId,
          locationId: fromLocationId,
          organizationId,
          quantity: { gte: quantity },
        },
        data: { quantity: { decrement: quantity } },
      });

      if (count === 0) {
        const level = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: { productId, locationId: fromLocationId },
          },
        });
        throw new InsufficientStockError(level?.quantity ?? 0);
      }

      const fromStockLevel = await tx.stockLevel.findUniqueOrThrow({
        where: {
          productId_locationId: { productId, locationId: fromLocationId },
        },
      });

      const toStockLevel = await tx.stockLevel.upsert({
        where: {
          productId_locationId: { productId, locationId: toLocationId },
        },
        create: { productId, locationId: toLocationId, quantity, organizationId },
        update: { quantity: { increment: quantity } },
      });

      const transferOut = await tx.stockTransaction.create({
        data: {
          type: "TRANSFER_OUT",
          quantity,
          productId,
          locationId: fromLocationId,
          organizationId,
          note,
          createdById: session.user.id,
        },
        include: TRANSACTION_INCLUDE,
      });

      const transferIn = await tx.stockTransaction.create({
        data: {
          type: "TRANSFER_IN",
          quantity,
          productId,
          locationId: toLocationId,
          organizationId,
          note,
          createdById: session.user.id,
        },
        include: TRANSACTION_INCLUDE,
      });

      return { fromStockLevel, toStockLevel, transferOut, transferIn };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: `Insufficient stock: ${err.available} available at the source location`,
        },
        { status: 409 },
      );
    }
    throw err;
  }
}
