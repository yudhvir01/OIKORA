import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { scopedDb } from "@/lib/scoped-db";
import { getPurchaseOrderReceiveError } from "@/lib/purchase-order-receive";

const INCLUDE = {
  supplier: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lineItems: {
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} as const;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const organizationId = session.user.activeOrganizationId;
  const db = scopedDb(organizationId);

  const purchaseOrder = await db.purchaseOrder.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!purchaseOrder) {
    return NextResponse.json(
      { error: "Purchase order not found" },
      { status: 404 },
    );
  }
  const receiveError = getPurchaseOrderReceiveError(purchaseOrder);
  if (receiveError) {
    return NextResponse.json({ error: receiveError }, { status: 409 });
  }

  const locationId = purchaseOrder.locationId as string;
  const note = `Received via purchase order ${purchaseOrder.id}`;

  const updated = await db.$transaction(async (tx) => {
    for (const lineItem of purchaseOrder.lineItems) {
      await tx.stockLevel.upsert({
        where: {
          productId_locationId: {
            productId: lineItem.productId,
            locationId,
          },
        },
        create: {
          productId: lineItem.productId,
          locationId,
          quantity: lineItem.quantity,
          organizationId,
        },
        update: { quantity: { increment: lineItem.quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          type: "STOCK_IN",
          quantity: lineItem.quantity,
          productId: lineItem.productId,
          locationId,
          organizationId,
          note,
          createdById: session.user.id,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: INCLUDE,
    });
  });

  return NextResponse.json(updated);
}
