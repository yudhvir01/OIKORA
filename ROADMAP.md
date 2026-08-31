# Roadmap

A 4-month incremental build plan for this inventory management system. Each
phase is a set of milestones; each milestone should be broken into small,
real, working increments (roughly one commit's worth of work each) rather
than implemented all at once.

Tech stack: Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth.

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
- [ ] Accessibility and responsive polish pass
- [ ] Deploy to Vercel + hosted Postgres (Neon), production env vars
- [ ] Final README with setup instructions and screenshots

---

Progress is tracked in `PROGRESS.md`. When a task above is completed, check
it off here too so the two files stay in sync.
