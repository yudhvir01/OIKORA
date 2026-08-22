"use client";

import { useTransition } from "react";

import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="text-sm font-medium text-zinc-600 hover:text-black disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
