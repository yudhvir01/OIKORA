# Progress Log

Running log of increments implemented, one entry per commit made by the
scheduled build process. Newest entries at the top.

Project start date: 2026-08-22
Target completion: ~4 months from start date (~2026-12-22)

- 2026-08-23: Added the dashboard shell: a `/dashboard` route with its own layout, a `Sidebar` component (Dashboard link active, other future modules listed but disabled with a "Soon" badge), and an empty dashboard page with placeholder stat cards (Total Products, Low Stock Items, Categories, Locations). The root `/` route now redirects to `/dashboard`. Completes the Phase 1 base layout item.

- 2026-08-22: Added login page, login/logout server actions, and a session-aware nav bar (`SiteNav`, `LoginForm`, `LogoutButton`) wired into the root layout. Completes the Phase 1 auth item.

- 2026-08-22: Added Auth.js (NextAuth v5) credentials provider backend: `src/auth.ts` with JWT sessions and bcrypt password checks against the `User` model, the `/api/auth/[...nextauth]` route handler, a Prisma client singleton using the `@prisma/adapter-pg` driver adapter (required by Prisma 7's generated client), and `.env.example` documenting `DATABASE_URL`/`AUTH_SECRET`. No login/logout UI yet.

- 2026-08-22: Added `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) wrapping `auth()` for route protection: unauthenticated requests to non-public routes redirect to `/login` with a `callbackUrl`, authenticated users are redirected away from `/login`, and a reserved `/admin` prefix redirects non-ADMIN users back to `/`. Verified with `npm run build`.

<!-- New entries are appended above this line by the daily build routine. -->
