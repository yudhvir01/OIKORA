import { NextResponse } from "next/server";

import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";
import { TEAM_ADMIN_ROLES } from "@/lib/team-roles";

// Team management is gated on the active membership's per-org role
// (OWNER/ADMIN), not the legacy global `User.role` that `requireAdmin`
// checks -- there is no meaningful global "admin" for who can manage a
// specific organization's team.
export async function requireOrgAdmin(session: Session | null) {
  if (!session?.user) {
    return { denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), membership: null };
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: session.user.activeOrganizationId,
      },
    },
  });

  if (!membership || !TEAM_ADMIN_ROLES.has(membership.role)) {
    return { denied: NextResponse.json({ error: "Forbidden" }, { status: 403 }), membership: null };
  }

  return { denied: null, membership };
}
