import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 20),
  );

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

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
  if (existing) {
    return NextResponse.json(
      { error: "A product with that SKU already exists" },
      { status: 409 },
    );
  }

  const product = await prisma.product.create({
    data: { sku, name, unit, categoryId, reorderPoint },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json(product, { status: 201 });
}
