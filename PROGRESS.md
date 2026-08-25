# Progress Log

Running log of increments implemented, one entry per commit made by the
scheduled build process. Newest entries at the top.

Project start date: 2026-08-22
Target completion: ~4 months from start date (~2026-12-22)

- 2026-08-23: Added the `Category` model + migration (`name` unique, optional `description`), REST API routes (`GET`/`POST /api/categories`, `PATCH`/`DELETE /api/categories/[id]`, each requiring an authenticated session), and a `/dashboard/categories` CRUD screen (`CategoryManager` client component) supporting create, inline edit, and delete. Completes the Phase 1 category item.

- 2026-08-23: Added the dashboard shell: a `/dashboard` route with its own layout, a `Sidebar` component (Dashboard link active, other future modules listed but disabled with a "Soon" badge), and an empty dashboard page with placeholder stat cards (Total Products, Low Stock Items, Categories, Locations). The root `/` route now redirects to `/dashboard`. Completes the Phase 1 base layout item.

- 2026-08-22: Added login page, login/logout server actions, and a session-aware nav bar (`SiteNav`, `LoginForm`, `LogoutButton`) wired into the root layout. Completes the Phase 1 auth item.

- 2026-08-22: Added Auth.js (NextAuth v5) credentials provider backend: `src/auth.ts` with JWT sessions and bcrypt password checks against the `User` model, the `/api/auth/[...nextauth]` route handler, a Prisma client singleton using the `@prisma/adapter-pg` driver adapter (required by Prisma 7's generated client), and `.env.example` documenting `DATABASE_URL`/`AUTH_SECRET`. No login/logout UI yet.

- 2026-08-22: Added `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) wrapping `auth()` for route protection: unauthenticated requests to non-public routes redirect to `/login` with a `callbackUrl`, authenticated users are redirected away from `/login`, and a reserved `/admin` prefix redirects non-ADMIN users back to `/`. Verified with `npm run build`.

- 2026-08-24: Added the `Product` model (`sku` unique, `name`, `unit`, `reorderPoint` defaulting to 0, required `Category` relation) + migration, and REST API routes (`GET`/`POST /api/products` with search/category filter/pagination on GET, `PATCH`/`DELETE /api/products/[id]`), each requiring an authenticated session and validating the referenced category exists. Completes the Phase 1 product model item.

- 2026-08-24: Added the `/dashboard/products` list view (`ProductList` client component) with a debounced name/SKU search box, a category filter dropdown, and page-based pagination against `GET /api/products`. Enabled the "Products" sidebar link. Completes the Phase 1 product list view item.

- 2026-08-24: Added `prisma/seed.ts`, wired up via `migrations.seed` in `prisma.config.ts` (run with `npm run db:seed` / `prisma db seed`, executed by `tsx`). Upserts two demo users (admin/staff), 4 categories, and 8 products so a fresh database has usable data. Completes the Phase 1 seed script item.

- 2026-08-24: Added the `Location` model (`name` unique, optional `address`) + migration, REST API routes (`GET`/`POST /api/locations`, `PATCH`/`DELETE /api/locations/[id]`), and a `/dashboard/locations` CRUD screen (`LocationManager`), each requiring an authenticated session. Enabled the "Locations" sidebar link. Starts and completes the Phase 2 location/warehouse model item.

- 2026-08-24: Added the `StockLevel` model (quantity per product x location, unique on `[productId, locationId]`) + migration and foreign keys to `Product`/`Location`, plus a read-only `GET /api/stock-levels` route (optionally filtered by `productId`/`locationId`) for an authenticated session. Quantity mutations are intentionally left to the upcoming stock-in/stock-out/transfer transaction flows rather than direct CRUD. Completes the Phase 2 StockLevel model item.

- 2026-08-25: Added the `StockTransaction` model (`type` enum `STOCK_IN`/`STOCK_OUT`/`TRANSFER_IN`/`TRANSFER_OUT`, `quantity`, `product`/`location`/`createdBy` relations, `note`) + migration, and `GET`/`POST /api/stock-in` routes: `POST` validates the product/location exist and quantity is a positive integer, then atomically upserts the matching `StockLevel` (incrementing existing quantity) and records a `STOCK_IN` transaction in a single `$transaction`. `GET` lists recent stock-in transactions, optionally filtered by product/location. UI for this flow is not built yet, so the Phase 2 stock-in roadmap item stays unchecked.

<!-- New entries are appended above this line by the daily build routine. -->
