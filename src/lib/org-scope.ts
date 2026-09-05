// Multi-tenancy "can't forget it" mechanism (Week 18 roadmap item): every
// business table carries an `organizationId`, and every read/update/delete
// against one of these models must be confined to the caller's active
// organization. Rather than trust each route to remember a manual
// `where: { organizationId }` filter, `scopedDb()` wraps the Prisma client
// in a query extension that injects it automatically.
//
// The merge logic below is a plain, DB-free function so it can be unit
// tested directly; `scopedDb()` just wires it into a Prisma client
// extension.

// Kept in sync with the `organizationId` fields in prisma/schema.prisma.
export const ORG_SCOPED_MODELS = new Set([
  "Category",
  "Product",
  "Location",
  "Supplier",
  "PurchaseOrder",
  "PurchaseOrderLineItem",
  "StockLevel",
  "StockTransaction",
]);

// Operations that take a `where` clause selecting existing rows. Scoping
// these is what prevents one organization from reading, counting, or
// mutating another organization's rows (by listing or by guessing an id) --
// the actual security boundary. `create`/`upsert`'s `create` branch aren't
// included: those write a brand-new row, and the required `organizationId`
// scalar on every business model means an unscoped create simply fails
// validation rather than leaking data, so callers still set it explicitly.
const WHERE_SCOPED_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
]);

export type PlainArgs = Record<string, unknown>;

/**
 * Returns `args` with `organizationId` merged into its `where` (and, for
 * `upsert`, its `where` only -- `create`/`update` payloads are left alone)
 * when `model`/`operation` are org-scoped. Non-scoped models/operations are
 * returned unchanged.
 */
export function applyOrgScope(
  model: string | undefined,
  operation: string,
  args: PlainArgs,
  organizationId: string,
): PlainArgs {
  if (!model || !ORG_SCOPED_MODELS.has(model)) {
    return args;
  }

  if (WHERE_SCOPED_OPERATIONS.has(operation)) {
    const where = (args.where as PlainArgs | undefined) ?? {};
    return { ...args, where: { ...where, organizationId } };
  }

  if (operation === "upsert") {
    const where = (args.where as PlainArgs | undefined) ?? {};
    return { ...args, where: { ...where, organizationId } };
  }

  return args;
}
