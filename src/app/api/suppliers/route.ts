import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const contactName =
    typeof body?.contactName === "string" && body.contactName.trim() !== ""
      ? body.contactName.trim()
      : null;
  const email =
    typeof body?.email === "string" && body.email.trim() !== ""
      ? body.email.trim()
      : null;
  const phone =
    typeof body?.phone === "string" && body.phone.trim() !== ""
      ? body.phone.trim()
      : null;
  const address =
    typeof body?.address === "string" && body.address.trim() !== ""
      ? body.address.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.supplier.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A supplier with that name already exists" },
      { status: 409 },
    );
  }

  const supplier = await prisma.supplier.create({
    data: { name, contactName, email, phone, address },
  });
  return NextResponse.json(supplier, { status: 201 });
}
