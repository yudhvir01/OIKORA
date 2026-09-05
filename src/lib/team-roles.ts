export const MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "STOREKEEPER", "STAFF"] as const;
export type MembershipRoleValue = (typeof MEMBERSHIP_ROLES)[number];

// Roles with admin-equivalent permissions for their organization: managing
// the team, and (per the Week 19 route-protection migration) anything the
// old global `ADMIN` role used to gate. `STOREKEEPER` and `STAFF` share the
// same, non-destructive operational permissions (stock in/out/transfer) by
// simply not being in this set.
export const ADMIN_EQUIVALENT_ROLES = new Set<MembershipRoleValue>(["OWNER", "ADMIN"]);

type MembershipLike = { id: string; role: MembershipRoleValue };

// An organization must always keep at least one OWNER (otherwise nobody
// could ever regain OWNER-level control of it), so both role changes and
// removals are blocked when they'd leave zero owners.
export function wouldRemoveLastOwner(
  memberships: MembershipLike[],
  targetMembershipId: string,
  action: "remove" | { newRole: MembershipRoleValue },
): boolean {
  const target = memberships.find((m) => m.id === targetMembershipId);
  if (!target || target.role !== "OWNER") return false;

  const otherOwners = memberships.filter(
    (m) => m.role === "OWNER" && m.id !== targetMembershipId,
  );
  if (otherOwners.length > 0) return false;

  return action === "remove" || action.newRole !== "OWNER";
}
