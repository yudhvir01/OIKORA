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
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 20),
  );

  // Cursor is `${name}::${id}` (opaque to the client). `name` alone isn't
  // unique, so the seek is a compound (name, id) comparison to avoid
  // skipping or repeating rows when two products share a name.
  const rawCursor = searchParams.get("cursor");
  const cursor = rawCursor
    ? (() => {
        const idx = rawCursor.lastIndexOf("::");
        return idx === -1
          ? null
          : { name: rawCursor.slice(0, idx), id: rawCursor.slice(idx + 2) };
      })()
    : null;

  const conditions = [
    ...(categoryId ? [{ categoryId }] : []),
    ...(search
      ? [
          {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { sku: { contains: search, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
    ...(cursor
      ? [
          {
            OR: [
              { name: { gt: cursor.name } },
              {
                AND: [{ name: cursor.name }, { id: { gt: cursor.id } }],
              },
            ],
          },
        ]
      : []),
  ];

  const where = conditions.length ? { AND: conditions } : {};

  // Keyset (cursor) pagination instead of OFFSET: Postgres seeks directly
  // via the (name, id) index rather than scanning and discarding every
  // prior row, so this stays fast regardless of how deep the page is.
  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: pageSize + 1,
  });

  const hasMore = products.length > pageSize;
  const page = products.slice(0, pageSize);
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? `${last.name}::${last.id}` : null;

  return NextResponse.json({
    products: page,
    pageSize,
    nextCursor,
    hasMore,
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
