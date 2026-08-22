# Progress Log

Running log of increments implemented, one entry per commit made by the
scheduled build process. Newest entries at the top.

Project start date: 2026-08-22
Target completion: ~4 months from start date (~2026-12-22)

- 2026-08-22: Added Auth.js (NextAuth v5) credentials provider backend: `src/auth.ts` with JWT sessions and bcrypt password checks against the `User` model, the `/api/auth/[...nextauth]` route handler, a Prisma client singleton using the `@prisma/adapter-pg` driver adapter (required by Prisma 7's generated client), and `.env.example` documenting `DATABASE_URL`/`AUTH_SECRET`. No login/logout UI yet.

<!-- New entries are appended above this line by the daily build routine. -->
