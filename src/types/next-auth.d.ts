import type { DefaultSession } from "next-auth";

import type { MembershipRoleValue } from "@/lib/team-roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // The legacy global role. Kept for display/back-compat only --
      // authorization now goes through `activeMembershipRole` below, which
      // is per-organization (see Week 19 route-protection migration).
      role: "ADMIN" | "STAFF";
      activeOrganizationId: string;
      activeMembershipRole: MembershipRoleValue;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "STAFF";
    activeOrganizationId: string;
    activeMembershipRole: MembershipRoleValue;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "STAFF";
    activeOrganizationId: string;
    activeMembershipRole: MembershipRoleValue;
  }
}
