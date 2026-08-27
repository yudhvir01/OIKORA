import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function loadDraftLineItem(
  purchaseOrderId: string,
  lineItemId: string,
) {
  const lineItem = await prisma.purchaseOrderLineItem.findUnique({
    where: { id: lineItemId },
    include: { purchaseOrder: true },
  });
  if (!lineItem || lineItem.purchaseOrderId !== purchaseOrderId) {
    return { lineItem: null, error: "Line item not found", status: 404 };
  }
  if (lineItem.purchaseOrder.status !== "DRAFT") {
    return {
      lineItem: null,
      error: "Line items can only be edited on a draft purchase order",
      status: 409,
    };
  }
  return { lineItem, error: null, status: 200 };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lineItemId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: purchaseOrderId, lineItemId } = await params;
  const { error, status } = await loadDraftLineItem(
    purchaseOrderId,
    lineItemId,
  );
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const body = await request.json().catch(() => null);
  const quantity = Number(body?.quantity);
  const unitCostCents =
    body?.unitCostCents === undefined || body?.unitCostCents === null
      ? null
      : Number(body.unitCostCents);

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

  const updated = await prisma.purchaseOrderLineItem.update({
    where: { id: lineItemId },
    data: { quantity, unitCostCents },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lineItemId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: purchaseOrderId, lineItemId } = await params;
  const { error, status } = await loadDraftLineItem(
    purchaseOrderId,
    lineItemId,
  );
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  await prisma.purchaseOrderLineItem.delete({ where: { id: lineItemId } });
  return new NextResponse(null, { status: 204 });
}
