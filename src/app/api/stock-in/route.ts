import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateStockMovementInput } from "@/lib/stock-movement";

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
      type: "STOCK_IN",
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

  const [product, location] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.location.findUnique({ where: { id: locationId } }),
  ]);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 400 });
  }

  const [stockLevel, transaction] = await prisma.$transaction([
    prisma.stockLevel.upsert({
      where: { productId_locationId: { productId, locationId } },
      create: { productId, locationId, quantity },
      update: { quantity: { increment: quantity } },
    }),
    prisma.stockTransaction.create({
      data: {
        type: "STOCK_IN",
        quantity,
        productId,
        locationId,
        note,
        createdById: session.user.id,
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({ stockLevel, transaction }, { status: 201 });
}
