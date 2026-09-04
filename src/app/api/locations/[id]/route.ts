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
  const address =
    typeof body?.address === "string" && body.address.trim() !== ""
      ? body.address.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.location.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: "A location with that name already exists" },
      { status: 409 },
    );
  }

  try {
    const location = await prisma.location.update({
      where: { id, organizationId },
      data: { name, address },
    });
    return NextResponse.json(location);
  } catch {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
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
    await prisma.location.delete({ where: { id, organizationId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }
}
