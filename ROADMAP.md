# Roadmap

A 4-month incremental build plan for this inventory management system. Each
phase is a set of milestones; each milestone should be broken into small,
real, working increments (roughly one commit's worth of work each) rather
than implemented all at once.

Tech stack: Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth.

## Phase 1 — Foundation (Weeks 1-4)
- [x] Auth: credentials-based login/logout with NextAuth, session handling
- [ ] User roles (Admin/Staff) and route protection middleware
- [ ] Base layout: nav, sidebar, empty dashboard shell
- [ ] Category model + CRUD (API routes + UI)
- [ ] Product model + CRUD (SKU, name, category, unit, reorder point)
- [ ] Product list view with search/filter/pagination
- [ ] Seed script for demo data

## Phase 2 — Core Operations (Weeks 5-8)
- [ ] Location/warehouse model (support multiple locations)
- [ ] StockLevel model (product x location quantities)
- [ ] Stock-in transaction flow (receive stock, updates StockLevel)
- [ ] Stock-out transaction flow (issue/consume stock)
- [ ] Stock transfer between locations
- [ ] Transaction history/audit log per product
- [ ] Low-stock indicator on product list (below reorder point)

## Phase 3 — Suppliers, Orders & Alerts (Weeks 9-13)
- [ ] Supplier model + CRUD
- [ ] Purchase order model (draft, submitted, received)
- [ ] Purchase order line items, linking to products/suppliers
- [ ] Receiving a PO auto-creates stock-in transactions
- [ ] Low-stock email/notification alerts
- [ ] Reorder suggestions view (products below reorder point + supplier)

## Phase 4 — Reporting, Polish & Deploy (Weeks 14-17)
- [ ] Dashboard analytics (stock value, movement trends, top products)
- [ ] CSV export for products/transactions
- [ ] CSV import for bulk product upload
- [ ] Basic test coverage for core flows (auth, stock in/out, PO receive)
- [ ] Accessibility and responsive polish pass
- [ ] Deploy to Vercel + hosted Postgres (Neon), production env vars
- [ ] Final README with setup instructions and screenshots

---

Progress is tracked in `PROGRESS.md`. When a task above is completed, check
it off here too so the two files stay in sync.
