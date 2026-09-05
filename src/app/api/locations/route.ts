import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { scopedDb } from "@/lib/scoped-db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = scopedDb(session.user.activeOrganizationId);

  const locations = await db.location.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;
  const db = scopedDb(organizationId);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const address =
    typeof body?.address === "string" && body.address.trim() !== ""
      ? body.address.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await db.location.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A location with that name already exists" },
      { status: 409 },
    );
  }

  const location = await db.location.create({
    data: { name, address, organizationId },
  });
  return NextResponse.json(location, { status: 201 });
}
