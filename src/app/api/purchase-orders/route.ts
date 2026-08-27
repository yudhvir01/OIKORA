import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const INCLUDE = {
  supplier: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

const STATUS_VALUES = ["DRAFT", "SUBMITTED", "RECEIVED", "CANCELLED"] as const;
type StatusFilter = (typeof STATUS_VALUES)[number];

function parseStatus(value: string | null): StatusFilter | undefined {
  return value && (STATUS_VALUES as readonly string[]).includes(value)
    ? (value as StatusFilter)
    : undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get("status"));
  const supplierId = searchParams.get("supplierId") ?? undefined;

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(supplierId ? { supplierId } : {}),
    },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchaseOrders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const supplierId =
    typeof body?.supplierId === "string" ? body.supplierId.trim() : "";
  const note =
    typeof body?.note === "string" && body.note.trim() !== ""
      ? body.note.trim()
      : null;

  if (!supplierId) {
    return NextResponse.json(
      { error: "supplierId is required" },
      { status: 400 },
    );
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
  }

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      note,
      createdById: session.user.id,
    },
    include: INCLUDE,
  });

  return NextResponse.json(purchaseOrder, { status: 201 });
}
