"use client";

import { useState } from "react";

type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type SupplierFormState = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
};

const EMPTY_FORM: SupplierFormState = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
};

export function SupplierManager({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create supplier");
        return;
      }
      setSuppliers((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm(EMPTY_FORM);
    } finally {
      setPending(false);
    }
  }

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setEditForm({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update supplier");
        return;
      }
      setSuppliers((prev) =>
        prev
          .map((s) => (s.id === id ? data : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to delete supplier");
        return;
      }
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="contactName" className="text-sm font-medium">
            Contact name
          </label>
          <input
            id="contactName"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 lg:col-span-5 lg:w-fit"
        >
          Add supplier
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Contact</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Phone</th>
            <th className="py-2 font-medium">Address</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-zinc-500 dark:text-zinc-400">
                No suppliers yet.
              </td>
            </tr>
          ) : (
            suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                {editingId === supplier.id ? (
                  <>
                    <td className="py-2 pr-2">
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={editForm.contactName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            contactName: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="flex gap-2 py-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleUpdate(supplier.id)}
                        className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-2">{supplier.name}</td>
                    <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                      {supplier.contactName ?? "—"}
                    </td>
                    <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                      {supplier.email ?? "—"}
                    </td>
                    <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                      {supplier.phone ?? "—"}
                    </td>
                    <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                      {supplier.address ?? "—"}
                    </td>
                    <td className="flex gap-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(supplier)}
                        className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(supplier.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
