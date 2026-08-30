import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { parseProductsCsv, type ProductRowError } from "@/lib/product-import";

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const text = await request.text();
  if (!text.trim()) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }

  const { rows, errors } = parseProductsCsv(text);
  if (rows.length === 0) {
    return NextResponse.json(
      { created: 0, updated: 0, errors: errors.length ? errors : [{ line: 0, message: "No rows to import" }] },
      { status: 400 },
    );
  }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryIdByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id]),
  );

  const rowErrors: ProductRowError[] = [...errors];
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const categoryId = categoryIdByName.get(row.category.toLowerCase());
    if (!categoryId) {
      rowErrors.push({
        line: row.line,
        message: `Unknown category "${row.category}"`,
      });
      continue;
    }

    const existing = await prisma.product.findUnique({
      where: { sku: row.sku },
      select: { id: true },
    });

    const data = {
      name: row.name,
      unit: row.unit,
      categoryId,
      reorderPoint: row.reorderPoint,
      unitCostCents: row.unitCostCents,
    };

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.product.create({ data: { sku: row.sku, ...data } });
      created++;
    }
  }

  return NextResponse.json({
    created,
    updated,
    errors: rowErrors.sort((a, b) => a.line - b.line),
  });
}
