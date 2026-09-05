import { Prisma } from "@/generated/prisma/client";
import { applyOrgScope, type PlainArgs } from "@/lib/org-scope";
import { prisma } from "@/lib/prisma";

function orgScopeExtension(organizationId: string) {
  return Prisma.defineExtension({
    name: "org-scope",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          const scopedArgs = applyOrgScope(model, operation, args as PlainArgs, organizationId);
          return query(scopedArgs as typeof args);
        },
      },
    },
  });
}

/**
 * The Prisma client to use for anything tenant-scoped: every read/update/
 * delete issued through it is automatically confined to `organizationId`
 * (see `src/lib/org-scope.ts`). Routes should call this instead of the raw
 * `prisma` export whenever they're operating on organization data.
 */
export function scopedDb(organizationId: string) {
  return prisma.$extends(orgScopeExtension(organizationId));
}

export type ScopedPrismaClient = ReturnType<typeof scopedDb>;
