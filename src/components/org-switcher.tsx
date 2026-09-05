"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { switchActiveOrganization } from "@/app/actions/organizations";

type Organization = { id: string; name: string };

type OrgSwitcherProps = {
  organizations: Organization[];
  activeOrganizationId: string;
};

export function OrgSwitcher({ organizations, activeOrganizationId }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = organizations.find((org) => org.id === activeOrganizationId);

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

  // A user in only one organization has nothing to switch between yet
  // (Team invites are a separate Week 19 item) -- show the org name as a
  // plain label instead of a dropdown with a single, always-selected item.
  if (organizations.length <= 1) {
    return (
      <span className="hidden truncate text-sm text-[var(--muted)] sm:inline">
        {active?.name ?? ""}
      </span>
    );
  }

  function handleSelect(organizationId: string) {
    if (organizationId === activeOrganizationId) {
      setOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchActiveOrganization(organizationId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="flex max-w-40 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)] transition-shadow hover:bg-[var(--surface-2)] focus-visible:ring-2 disabled:opacity-50"
      >
        <span className="truncate">{pending ? "Switching…" : (active?.name ?? "Select organization")}</span>
        <span aria-hidden="true" className="shrink-0 text-xs text-[var(--muted)]">▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full left-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg"
        >
          <p className="border-b border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--muted)]">
            Switch organization
          </p>
          {error ? (
            <p role="alert" className="px-3.5 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              role="menuitemradio"
              aria-checked={org.id === activeOrganizationId}
              onClick={() => handleSelect(org.id)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="truncate">{org.name}</span>
              {org.id === activeOrganizationId ? (
                <span aria-hidden="true" className="text-[var(--accent)]">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
