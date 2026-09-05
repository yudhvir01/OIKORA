import { NextResponse } from "next/server";

import type { Session } from "next-auth";

import { ADMIN_EQUIVALENT_ROLES } from "@/lib/team-roles";

// Gates destructive/admin-only actions on the caller's *active-membership*
// role (OWNER/ADMIN in the org they're currently in) rather than the legacy
// global `User.role` -- permissions are per-organization now (Week 19 route
// protection migration), so the same person can be an OWNER in one org and
// plain STAFF in another.
export function requireAdmin(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_EQUIVALENT_ROLES.has(session.user.activeMembershipRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
