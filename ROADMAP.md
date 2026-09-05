# Roadmap

A 4-month incremental build plan for this inventory management system. Each
phase is a set of milestones; each milestone should be broken into small,
real, working increments (roughly one commit's worth of work each) rather
than implemented all at once.

Tech stack: Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth.

Phases 1-4 shipped the single-tenant core (products, stock, purchasing,
reporting). Phase 5 below is an 8-week extension with one explicit goal:
turn the single-tenant demo into a multi-company product built to hold up
under real, unattended growth — not "million products" as one company's
catalog, but many companies (each with its own catalog, users, and roles)
running on the same deployment without ever seeing each other's data. The
target bar is inFlow's actual daily workflow (Products, Purchases, Sales)
done with a cleaner, faster, dark-mode-capable UI and an architecture that
doesn't need a rewrite the moment it has real customers — not inFlow's
entire feature catalog (no barcode/label printing, multi-currency, B2B
showroom, or POS in this phase).

**Tenant model:** flat — each company is an independent `Organization`; a
user can belong to more than one (e.g. someone tracking 4 separate
companies) and switches between them with an org switcher in the nav. Each
organization's data is fully isolated; there is no cross-org roll-up view.

**Database for this phase:** the ambient `DATABASE_URL` already configured
in this environment (a live db.prisma.io Postgres instance) is this
project's own dev database for the duration of Phase 5 — migrate, seed, and
integration-test against it directly, no separate provisioning step needed.

## Phase 1 — Foundation (Weeks 1-4)
- [x] Auth: credentials-based login/logout with NextAuth, session handling
- [x] User roles (Admin/Staff) and route protection middleware
- [x] Base layout: nav, sidebar, empty dashboard shell
- [x] Category model + CRUD (API routes + UI)
- [x] Product model + CRUD (SKU, name, category, unit, reorder point)
- [x] Product list view with search/filter/pagination
- [x] Seed script for demo data

## Phase 2 — Core Operations (Weeks 5-8)
- [x] Location/warehouse model (support multiple locations)
- [x] StockLevel model (product x location quantities)
- [x] Stock-in transaction flow (receive stock, updates StockLevel)
- [x] Stock-out transaction flow (issue/consume stock)
- [x] Stock transfer between locations
- [x] Transaction history/audit log per product
- [x] Low-stock indicator on product list (below reorder point)

## Phase 3 — Suppliers, Orders & Alerts (Weeks 9-13)
- [x] Supplier model + CRUD
- [x] Purchase order model (draft, submitted, received)
- [x] Purchase order line items, linking to products/suppliers
- [x] Receiving a PO auto-creates stock-in transactions
- [x] Low-stock email/notification alerts
- [x] Reorder suggestions view (products below reorder point + supplier)

## Phase 4 — Reporting, Polish & Deploy (Weeks 14-17)
- [x] Dashboard analytics (stock value, movement trends, top products)
- [x] CSV export for products/transactions
- [x] CSV import for bulk product upload
- [x] Basic test coverage for core flows (auth, stock in/out, PO receive)
- [x] Accessibility and responsive polish pass
- [x] Deploy to Vercel + hosted Postgres (Neon), production env vars
- [x] Final README with setup instructions and screenshots

## Phase 5 — Multi-Tenant Scale-Out (Weeks 18-25)

A single-tenant flat schema is the one thing that's expensive to retrofit
once real customer data exists, so tenancy comes first, before Sales, and
Sales is built org-scoped from its first migration instead of being
retrofitted twice. The later weeks turn the deferred scalability items from
the tech-stack review (background jobs, pre-aggregated analytics, hardening)
into scheduled work instead of "fix it when it hurts."

### Week 18 — Multi-tenancy data model
- [x] `Organization` model (the tenant/company): `id`, `name`, `slug`,
      timestamps
- [x] `Membership` join table: `User` ↔ `Organization` with a `role` enum
      (`OWNER` / `ADMIN` / `STOREKEEPER` / `STAFF`), `@@unique([userId,
      organizationId])` — replaces today's global `Role` enum on `User`
      (a user's permissions are now per-organization, not global)
- [x] `organizationId` added to every business table (`Product`, `Category`,
      `Location`, `Supplier`, `PurchaseOrder`, `PurchaseOrderLineItem`,
      `StockLevel`, `StockTransaction`) with the FK indexed on every table
- [x] Data migration: create one "Default Organization," attach every
      existing `User` to it via `Membership` (existing `ADMIN` → `OWNER`,
      existing `STAFF` → `STAFF`), and backfill `organizationId` on every
      existing row to that org — run and verified against the dev database
      before moving on
- [x] A Prisma Client Extension (`$extends`) that auto-injects
      `organizationId` into `where` clauses for every tenant-scoped model,
      applied per-request from the active org in session — this is the
      "can't forget it" mechanism, not a convention every route has to
      remember; routes call a scoped client (e.g. `scopedDb(orgId)`) instead
      of the raw `prisma` export for anything tenant-scoped. Every route is
      manually scoped by `organizationId` today (correct, but relies on each
      route remembering to do it) — the extension is what makes that
      unforgettable.
- [ ] Session/JWT extended with `activeOrganizationId` (done — pinned to the
      user's earliest membership at login); a server action to switch it
      (re-issues the session) for users in more than one org (not done — no
      user can belong to more than one org yet, since Team invites are a
      Week 19 item, so there's nothing to switch between)

### Week 19 — Org switcher, RBAC & tenancy hardening
- [ ] Org switcher in the nav (next to the account menu): lists every
      organization the signed-in user belongs to, switches
      `activeOrganizationId` on selection
- [ ] Org-scoped "Team" admin panel (`/dashboard/team`, `OWNER`/`ADMIN`
      only): list members, invite by email (reuses `src/lib/email.ts`'s
      nodemailer-with-console-fallback pattern), change or revoke a
      member's role
- [ ] Route protection updated everywhere `ADMIN`/`STAFF` was checked, now
      checking the active membership's role instead of the old global
      `User.role`; `STOREKEEPER` gets the same operational permissions
      `STAFF` had (stock in/out/transfer, no destructive CRUD)
- [ ] Ops: switch to a pooled database connection string (Neon's built-in
      pgbouncer pooler) so serverless function concurrency doesn't exhaust
      Postgres connections under real load
- [ ] Ops: wire the existing low-stock alert endpoint to an actual scheduler
      (Vercel Cron hitting `/api/alerts/low-stock/notify` on a daily
      schedule, per organization) — today it's implemented but nothing
      calls it
- [ ] CI: add a Postgres service container to `.github/workflows/ci.yml`,
      run `prisma migrate deploy` against it, and add a new
      `npm run test:integration` job (separate from the existing unit
      suite, which stays DB-free for fast local runs) seeded with two
      organizations that each get products/orders/users — every scoped
      route and the Prisma extension get an assertion that org A can never
      read or mutate org B's rows

### Week 20 — Sales module, part 1 (data + core flow)
- [ ] `Customer` model + CRUD (mirrors `Supplier`), org-scoped
- [ ] `SalesOrder` model — status enum mirroring `PurchaseOrderStatus`
      (`DRAFT` / `SUBMITTED` / `FULFILLED` / `CANCELLED`), `customer`/
      `location`/`createdBy` relations, org-scoped
- [ ] `SalesOrderLineItem` model (`product`, `quantity`, `unitPriceCents`),
      cascade-deleted with its parent order
- [ ] REST routes for sales orders + line items, restricted to `DRAFT`
      status while editable (mirrors the existing purchase-order-line-item
      routes), all going through the scoped Prisma client from Week 18
- [ ] `POST /api/sales-orders/[id]/fulfill` — atomically decrements
      `StockLevel` per line with the existing race-safe conditional
      `updateMany` (reuse `validateStockMovementInput`'s pattern so a sales
      order can't oversell), records a `STOCK_OUT` transaction per line,
      marks the order `FULFILLED`

### Week 21 — Sales module, part 2 (UI + reporting)
- [ ] `/dashboard/customers` CRUD screen
- [ ] `/dashboard/sales-orders` list + detail screens, matching the existing
      purchase-order list/detail pattern
- [ ] Per-order margin display on the sales order detail page (line price
      minus `Product.unitCostCents`, already on the model — no new data
      needed)
- [ ] Dashboard additions: revenue trend and top customers, alongside the
      existing stock-value/movement-trend/top-products cards
- [ ] Unit tests for the new validation/business-logic functions (fulfillment
      preconditions, oversell prevention), following the existing
      `purchase-order-receive.test.ts` pattern, plus integration tests
      confirming sales orders respect org scoping like everything else

### Week 22 — Background jobs & pre-aggregated analytics
- [ ] `Job` table (`type`, `status`: `PENDING`/`RUNNING`/`DONE`/`FAILED`,
      `payload` jsonb, `organizationId`, `result` jsonb, timestamps) — a
      minimal DB-backed queue, no new infrastructure (no Redis) needed
- [ ] `POST /api/products/import` changed to enqueue a `Job` and return its
      id immediately instead of processing inline; a Vercel Cron-triggered
      worker endpoint claims pending jobs (`UPDATE ... WHERE status =
      'PENDING' RETURNING`, race-safe like the existing stock mutations) and
      processes them in batches, so a large import can't hit a function
      timeout
- [ ] Import UI polls job status and shows progress instead of blocking on
      the request
- [ ] Same treatment for CSV export once files are large enough to matter
- [ ] Daily rollup job: a scheduled job that pre-aggregates yesterday's
      `StockTransaction` rows into a `DailyStockSummary` table (per org, per
      product: in/out totals) and sales into a `DailySalesSummary` table
      (per org: revenue, order count)
- [ ] Dashboard analytics (`dashboard-analytics.ts`) reads from the rollup
      tables for anything older than today, falling back to the existing
      live `groupBy` only for today's not-yet-rolled-up data — bounds the
      query cost regardless of how much transaction history accumulates

### Week 23 — Design system & dark mode, full rollout
Foundational pieces already shipped ahead of schedule: indigo/cool-slate
tokens in `globals.css`, a working theme toggle with the view-transition
circle animation, the account menu, and the sidebar active-state highlight.
This week finishes the rollout to the rest of the app.
- [x] Indigo/cool-slate token set in `globals.css` (light + dark), Tailwind's
      `dark:` variant routed through `[data-theme]` instead of
      `prefers-color-scheme`
- [x] Theme toggle in the nav with no-flash init and a real animation
- [x] Sidebar active-state highlight using the accent tokens
- [x] Account menu (avatar → name/email/role + sign out)
- [ ] Migrate the remaining ad hoc `zinc-*` utility classes (product list,
      category/location/supplier managers, stock manager's forms, all data
      tables, login form) onto the token set
- [ ] Table/form component pass: consistent input, button, and badge styles
      built once and reused, rather than each manager screen styling its
      own
- [ ] Re-run the WCAG AA contrast check from the earlier accessibility pass
      against both themes with the final token values, not just the old
      zinc pairing
- [ ] Update README screenshots to the new design

### Week 24 — Security & scale hardening
- [ ] Org-scoping audit: a scripted pass over every API route confirming it
      uses the scoped Prisma client from Week 18, not the raw one, for any
      tenant-scoped model — closes the gap between "the extension makes
      leaks hard" and "nothing was missed before the extension existed"
- [ ] Rate limiting on auth endpoints (login) and the Team invite endpoint —
      a Postgres-backed counter (no new infrastructure) is enough at this
      stage; bounds credential-stuffing and invite-spam
- [ ] `error.tsx` and `not-found.tsx` boundaries for the dashboard route
      group, with structured server-side error logging (context: org id,
      user id, route) so failures are diagnosable without a full
      observability vendor
- [ ] Load-check the org-scoping Prisma extension and the new background
      job claim query under concurrent load in the integration test suite
      (simulate many orgs, many concurrent jobs)

### Week 25 — Final polish & scale-readiness review
- [ ] Full regression pass across Products, Purchases, and Sales in both
      themes, as more than one organization, as each role
- [ ] README rewrite: multi-tenant setup instructions, the org
      switcher, the background-job architecture, and an explicit
      "Known scale ceiling" section documenting what's deliberately not
      built yet and why it's safe to defer:
      - A caching layer (Redis) for read-heavy screens — add when latency,
        not headcount, becomes the bottleneck
      - Hot-row contention handling for an extremely popular single SKU
        under massive concurrent write load — only worth the complexity
        once real traffic shows it
      - A dedicated search engine (Elasticsearch/Meilisearch) beyond
        Postgres trigram search — Postgres comfortably covers tens of
        millions of rows; revisit only past that
      - Multi-region database deployment — a single-region Postgres is
        correct until latency data says otherwise
- [ ] Final deploy: run the Phase 5 migrations against production, verify
      the pooled connection string and cron jobs are configured in Vercel's
      production environment, confirm CI's integration suite is green

---

Progress is tracked in `PROGRESS.md`. When a task above is completed, check
it off here too so the two files stay in sync.
