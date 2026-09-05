import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { scopedDb } from "@/lib/scoped-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;
  const db = scopedDb(organizationId);

  const { id } = await params;
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

  const existing = await db.supplier.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (existing && existing.id !== id) {
    return NextResponse.json(
      { error: "A supplier with that name already exists" },
      { status: 409 },
    );
  }

  try {
    const supplier = await db.supplier.update({
      where: { id },
      data: { name, contactName, email, phone, address },
    });
    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const db = scopedDb(session!.user.activeOrganizationId);

  const { id } = await params;

  try {
    await db.supplier.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }
}
