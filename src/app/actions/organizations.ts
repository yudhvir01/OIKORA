"use server";

import { revalidatePath } from "next/cache";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SwitchOrganizationState = { error?: string } | undefined;

// Switches the signed-in user's active organization (Week 18/19 org
// switcher). Membership is re-checked here -- not just relied on for the
// jwt callback's own check -- so this returns a clean error instead of a
// silently-ignored update when called with an org the user doesn't belong
// to.
export async function switchActiveOrganization(
  organizationId: string,
): Promise<SwitchOrganizationState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId },
    },
  });
  if (!membership) {
    return { error: "You are not a member of that organization" };
  }

  await unstable_update({ user: { activeOrganizationId: organizationId } });
  revalidatePath("/", "layout");
}
