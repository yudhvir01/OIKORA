import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await prisma.location.findMany({
    where: { organizationId: session.user.activeOrganizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;

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
  if (existing) {
    return NextResponse.json(
      { error: "A location with that name already exists" },
      { status: 409 },
    );
  }

  const location = await prisma.location.create({
    data: { name, address, organizationId },
  });
  return NextResponse.json(location, { status: 201 });
}
