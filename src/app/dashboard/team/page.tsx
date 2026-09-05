import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TeamManager } from "@/components/team-manager";
import { prisma } from "@/lib/prisma";
import { TEAM_ADMIN_ROLES, type MembershipRoleValue } from "@/lib/team-roles";

export default async function TeamPage() {
  const session = await auth();
  const organizationId = session!.user.activeOrganizationId;

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session!.user.id, organizationId } },
  });
  if (!membership || !TEAM_ADMIN_ROLES.has(membership.role)) {
    redirect("/dashboard");
  }

  const members = await prisma.membership.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Team
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Members of this organization and their roles.
        </p>
      </div>
      <TeamManager
        initialMembers={members.map((m) => ({
          id: m.id,
          role: m.role as MembershipRoleValue,
          user: m.user,
        }))}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
