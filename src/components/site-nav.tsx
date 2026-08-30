import Link from "next/link";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";

export async function SiteNav() {
  const session = await auth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-zinc-800">
      <Link href="/" className="font-semibold">
        Inventory
      </Link>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="max-w-[50vw] truncate text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.email} ({session.user.role})
            </span>
            <LogoutButton />
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
