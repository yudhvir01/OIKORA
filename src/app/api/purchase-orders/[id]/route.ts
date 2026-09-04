import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { canTransitionPurchaseOrderStatus } from "@/lib/purchase-order-status";
import { prisma } from "@/lib/prisma";

const INCLUDE = {
  supplier: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

const INCLUDE_WITH_LINE_ITEMS = {
  ...INCLUDE,
  lineItems: {
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id, organizationId: session.user.activeOrganizationId },
    include: INCLUDE_WITH_LINE_ITEMS,
  });
  if (!purchaseOrder) {
    return NextResponse.json(
      { error: "Purchase order not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(purchaseOrder);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (status !== "SUBMITTED" && status !== "CANCELLED") {
    return NextResponse.json(
      { error: "status must be one of: SUBMITTED, CANCELLED" },
      { status: 400 },
    );
  }

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id, organizationId: session.user.activeOrganizationId },
  });
  if (!purchaseOrder) {
    return NextResponse.json(
      { error: "Purchase order not found" },
      { status: 404 },
    );
  }

  if (!canTransitionPurchaseOrderStatus(purchaseOrder.status, status)) {
    return NextResponse.json(
      {
        error: `Cannot transition purchase order from ${purchaseOrder.status} to ${status}`,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: status as "SUBMITTED" | "CANCELLED",
      ...(status === "SUBMITTED" ? { submittedAt: new Date() } : {}),
    },
    include: INCLUDE,
  });

  return NextResponse.json(updated);
}
