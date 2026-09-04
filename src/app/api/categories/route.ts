import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { organizationId: session.user.activeOrganizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" && body.description.trim() !== ""
      ? body.description.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A category with that name already exists" },
      { status: 409 },
    );
  }

  const category = await prisma.category.create({
    data: { name, description, organizationId },
  });
  return NextResponse.json(category, { status: 201 });
}
