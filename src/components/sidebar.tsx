"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", available: true },
  { href: "/dashboard/products", label: "Products", available: true },
  { href: "/dashboard/categories", label: "Categories", available: true },
  { href: "/dashboard/locations", label: "Locations", available: true },
  { href: "/dashboard/stock", label: "Stock", available: true },
  { href: "/dashboard/suppliers", label: "Suppliers", available: true },
  {
    href: "/dashboard/reorder-suggestions",
    label: "Reorder Suggestions",
    available: true,
  },
] as const;

function isActiveHref(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Main"
      className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 lg:w-56 lg:border-r lg:border-b-0 lg:py-6"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="sidebar-nav-list"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:hidden"
      >
        Menu
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      <ul
        id="sidebar-nav-list"
        className={`${open ? "flex" : "hidden"} mt-1 flex-col gap-1 lg:mt-0 lg:flex`}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActiveHref(pathname, item.href);
          return (
            <li key={item.href}>
              {item.available ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-600">
                  {item.label}
                  <span className="text-xs uppercase tracking-wide">Soon</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
