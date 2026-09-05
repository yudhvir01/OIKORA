import Link from "next/link";

import { auth } from "@/auth";
import { OikoraMark } from "@/components/oikora-mark";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-avatar";
import { prisma } from "@/lib/prisma";

export async function SiteNav() {
  const session = await auth();
  const memberships = session?.user
    ? await prisma.membership.findMany({
        where: { userId: session.user.id },
        select: { organization: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const organizations = memberships.map((m) => m.organization);

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-zinc-800">
      <Link href="/" className="flex items-center gap-2.5 text-[var(--accent)]">
        <OikoraMark className="h-7 w-7 shrink-0" />
        <span className="flex flex-col leading-none text-[var(--foreground)]">
          <span className="font-brand-sans text-sm font-semibold tracking-[0.14em]">
            OIKORA
          </span>
          <span className="font-brand-mono text-[9px] tracking-[0.16em] text-[var(--accent)]">
            BUSINESS, IN SYNC.
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user ? (
          <>
            <OrgSwitcher
              organizations={organizations}
              activeOrganizationId={session.user.activeOrganizationId}
            />
            <UserMenu
              name={session.user.name}
              email={session.user.email ?? ""}
              role={session.user.role}
            />
          </>
        ) : (
          <Link href="/login" className="text-sm font-medium">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
