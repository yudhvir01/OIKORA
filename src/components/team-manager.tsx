"use client";

import { useState } from "react";

import { MEMBERSHIP_ROLES, type MembershipRoleValue } from "@/lib/team-roles";

type Member = {
  id: string;
  role: MembershipRoleValue;
  user: { id: string; name: string | null; email: string };
};

export function TeamManager({
  initialMembers,
  currentUserId,
}: {
  initialMembers: Member[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRoleValue>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add member");
        return;
      }
      setMembers((prev) => [...prev, data]);
      setEmail("");
      setRole("STAFF");
    } finally {
      setPending(false);
    }
  }

  async function handleRoleChange(membershipId: string, newRole: MembershipRoleValue) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/team/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change role");
        return;
      }
      setMembers((prev) => prev.map((m) => (m.id === membershipId ? data : m)));
    } finally {
      setPending(false);
    }
  }

  async function handleRemove(membershipId: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/team/members/${membershipId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to remove member");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="member-email" className="text-sm font-medium">
            Email of an existing OIKORA account
          </label>
          <input
            id="member-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="member-role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRoleValue)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {MEMBERSHIP_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add member
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th scope="col" className="py-2 font-medium">Name</th>
              <th scope="col" className="py-2 font-medium">Email</th>
              <th scope="col" className="py-2 font-medium">Role</th>
              <th scope="col" className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-zinc-500 dark:text-zinc-400">
                  No members yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-2">{member.user.name ?? "—"}</td>
                  <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                    {member.user.email}
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      aria-label={`Role for ${member.user.email}`}
                      value={member.role}
                      disabled={pending || member.user.id === currentUserId}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as MembershipRoleValue)
                      }
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {MEMBERSHIP_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    {member.user.id === currentUserId ? (
                      <span className="text-xs text-zinc-400 dark:text-zinc-600">You</span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleRemove(member.id)}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
