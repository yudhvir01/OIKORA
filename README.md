# Inventory Management

A personal inventory management system: products, categories, multi-location
stock levels, stock-in/out/transfer transactions, suppliers, purchase orders,
low-stock alerts, and reporting.

Built incrementally — see [ROADMAP.md](./ROADMAP.md) for the planned phases
and [PROGRESS.md](./PROGRESS.md) for a running log of what's been built.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://prisma.io) + PostgreSQL
- [NextAuth](https://next-auth.js.org) for authentication

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
