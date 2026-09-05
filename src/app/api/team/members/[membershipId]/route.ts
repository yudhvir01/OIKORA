import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP_ROLES, wouldRemoveLastOwner } from "@/lib/team-roles";

const MEMBER_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;
  const { membershipId } = await params;

  const body = await request.json().catch(() => null);
  const role = typeof body?.role === "string" ? body.role : "";
  if (!MEMBERSHIP_ROLES.includes(role as (typeof MEMBERSHIP_ROLES)[number])) {
    return NextResponse.json(
      { error: `role must be one of: ${MEMBERSHIP_ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  // Scope the lookup to this org so an id from another organization can't
  // be used to reach its membership rows.
  const orgMemberships = await prisma.membership.findMany({
    where: { organizationId },
    select: { id: true, role: true },
  });
  if (!orgMemberships.some((m) => m.id === membershipId)) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (wouldRemoveLastOwner(orgMemberships, membershipId, { newRole: role as (typeof MEMBERSHIP_ROLES)[number] })) {
    return NextResponse.json(
      { error: "Cannot change the organization's last owner to a non-owner role" },
      { status: 409 },
    );
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { role: role as (typeof MEMBERSHIP_ROLES)[number] },
    include: MEMBER_INCLUDE,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ membershipId: string }> },
) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;
  const { membershipId } = await params;

  const orgMemberships = await prisma.membership.findMany({
    where: { organizationId },
    select: { id: true, role: true, userId: true },
  });
  const target = orgMemberships.find((m) => m.id === membershipId);
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.userId === session!.user.id) {
    return NextResponse.json(
      { error: "You can't remove yourself -- ask another owner or admin to do it" },
      { status: 400 },
    );
  }
  if (wouldRemoveLastOwner(orgMemberships, membershipId, "remove")) {
    return NextResponse.json(
      { error: "Cannot remove the organization's last owner" },
      { status: 409 },
    );
  }

  await prisma.membership.delete({ where: { id: membershipId } });
  return new NextResponse(null, { status: 204 });
}
