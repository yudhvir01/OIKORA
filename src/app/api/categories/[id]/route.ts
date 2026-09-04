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
  const organizationId = session!.user.activeOrganizationId;

  const { id } = await params;
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
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: "A category with that name already exists" },
      { status: 409 },
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id, organizationId },
      data: { name, description },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;

  const { id } = await params;

  try {
    await prisma.category.delete({ where: { id, organizationId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}
