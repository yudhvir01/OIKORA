import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: purchaseOrderId } = await params;
  const organizationId = session.user.activeOrganizationId;

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId, organizationId },
  });
  if (!purchaseOrder) {
    return NextResponse.json(
      { error: "Purchase order not found" },
      { status: 404 },
    );
  }
  if (purchaseOrder.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Line items can only be added to a draft purchase order" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const productId =
    typeof body?.productId === "string" ? body.productId.trim() : "";
  const quantity = Number(body?.quantity);
  const unitCostCents =
    body?.unitCostCents === undefined || body?.unitCostCents === null
      ? null
      : Number(body.unitCostCents);

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "quantity must be a positive integer" },
      { status: 400 },
    );
  }
  if (
    unitCostCents !== null &&
    (!Number.isInteger(unitCostCents) || unitCostCents < 0)
  ) {
    return NextResponse.json(
      { error: "unitCostCents must be a non-negative integer" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, organizationId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  const lineItem = await prisma.purchaseOrderLineItem.create({
    data: { purchaseOrderId, productId, quantity, unitCostCents, organizationId },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
    },
  });

  return NextResponse.json(lineItem, { status: 201 });
}
