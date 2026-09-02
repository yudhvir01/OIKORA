"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { logout } from "@/app/actions/auth";

type UserMenuProps = {
  name?: string | null;
  email: string;
  role: string;
};

export function UserMenu({ name, email, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const initial = (name?.trim()?.[0] ?? email[0]).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-foreground)] outline-none ring-[var(--accent)] transition-shadow focus-visible:ring-2"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg"
        >
          <div className="border-b border-[var(--border)] px-3.5 py-3">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {name?.trim() || email}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {name ? email : role}
            </p>
            {name ? (
              <p className="mt-0.5 text-xs text-[var(--muted)]">{role}</p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => startTransition(() => logout())}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
