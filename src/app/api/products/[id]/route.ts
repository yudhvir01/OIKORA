import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const unit = typeof body?.unit === "string" ? body.unit.trim() : "";
  const categoryId =
    typeof body?.categoryId === "string" ? body.categoryId.trim() : "";
  const reorderPoint = Number.isFinite(Number(body?.reorderPoint))
    ? Math.max(0, Math.trunc(Number(body.reorderPoint)))
    : 0;

  if (!sku || !name || !unit || !categoryId) {
    return NextResponse.json(
      { error: "sku, name, unit, and categoryId are required" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: "A product with that SKU already exists" },
      { status: 409 },
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { sku, name, unit, categoryId, reorderPoint },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
