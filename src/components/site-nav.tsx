import Link from "next/link";

import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-avatar";

export async function SiteNav() {
  const session = await auth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-zinc-800">
      <Link href="/" className="font-semibold">
        Inventory
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user ? (
          <UserMenu
            name={session.user.name}
            email={session.user.email ?? ""}
            role={session.user.role}
          />
        ) : (
          <Link href="/login" className="text-sm font-medium">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
