import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP_ROLES } from "@/lib/team-roles";

const MEMBER_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A session's activeOrganizationId is only ever set to an org the user
  // has a Membership in (see src/auth.ts), so being authenticated is
  // sufficient here -- no separate membership check needed.
  const organizationId = session.user.activeOrganizationId;

  const members = await prisma.membership.findMany({
    where: { organizationId },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

// Adds an existing OIKORA account to the active organization by email.
// There's no self-serve account creation anywhere in this app yet, so an
// email with no matching account can't be onboarded this way -- that's a
// real, explicit gap (not this route's job to fill) rather than a stub.
export async function POST(request: Request) {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const organizationId = session!.user.activeOrganizationId;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!MEMBERSHIP_ROLES.includes(role as (typeof MEMBERSHIP_ROLES)[number])) {
    return NextResponse.json(
      { error: `role must be one of: ${MEMBERSHIP_ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      {
        error:
          "No OIKORA account exists for that email yet. Self-serve invites for brand-new accounts aren't available yet -- ask them to sign in with an existing account first.",
      },
      { status: 404 },
    );
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "That user is already a member of this organization" },
      { status: 409 },
    );
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const created = await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId,
      role: role as (typeof MEMBERSHIP_ROLES)[number],
    },
    include: MEMBER_INCLUDE,
  });

  await sendEmail({
    to: user.email,
    subject: `You've been added to ${organization.name} on OIKORA`,
    text: `${session!.user.name ?? session!.user.email} added you to ${organization.name} as ${role}. Sign in to OIKORA and use the organization switcher in the nav to access it.`,
  });

  return NextResponse.json(created, { status: 201 });
}
