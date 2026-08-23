import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", available: true },
  { href: "/dashboard/products", label: "Products", available: false },
  { href: "/dashboard/categories", label: "Categories", available: false },
  { href: "/dashboard/stock", label: "Stock", available: false },
  { href: "/dashboard/suppliers", label: "Suppliers", available: false },
] as const;

export function Sidebar() {
  return (
    <nav className="w-56 shrink-0 border-r border-zinc-200 px-4 py-6 dark:border-zinc-800">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            {item.available ? (
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
        ))}
      </ul>
    </nav>
  );
}
