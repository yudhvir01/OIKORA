"use client";

import { useState } from "react";

type Category = {
  id: string;
  name: string;
  description: string | null;
};

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create category");
        return;
      }
      setCategories((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setDescription("");
    } finally {
      setPending(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update category");
        return;
      }
      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? data : c))
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
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to delete category");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add category
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="py-2 font-medium">Name</th>
            <th scope="col" className="py-2 font-medium">Description</th>
            <th scope="col" className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-zinc-500 dark:text-zinc-400">
                No categories yet.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr
                key={category.id}
                className="border-b border-zinc-100 dark:border-zinc-900"
              >
                {editingId === category.id ? (
                  <>
                    <td className="py-2 pr-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="flex gap-2 py-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleUpdate(category.id)}
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
                    <td className="py-2 pr-2">{category.name}</td>
                    <td className="py-2 pr-2 text-zinc-500 dark:text-zinc-400">
                      {category.description ?? "—"}
                    </td>
                    <td className="flex gap-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDelete(category.id)}
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
