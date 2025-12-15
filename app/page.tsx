"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  user_identifier: string;
  title: string;
  steps: any | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

async function safeJson(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { data, text };
}

export default function Home() {
  const [userIdentifier, setUserIdentifier] = useState("daniel@demo.com");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const canLoad = useMemo(() => userIdentifier.trim().length > 0, [userIdentifier]);

  async function loadTasks() {
    if (!canLoad) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/tasks?user_identifier=${encodeURIComponent(userIdentifier.trim())}`
      );

      const { data } = await safeJson(res);

      if (!res.ok) throw new Error(data?.error ?? "Failed to load tasks");
      setTasks(data?.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();

    const title = newTitle.trim();
    if (!title || !canLoad) return;

    setSavingId("new");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_identifier: userIdentifier.trim(), title }),
      });

      const { data } = await safeJson(res);

      if (!res.ok) throw new Error(data?.error ?? "Failed to add task");

      setNewTitle("");
      if (data?.task) setTasks((prev) => [data.task, ...prev]);
      else await loadTasks(); // fallback si no vino task
    } finally {
      setSavingId(null);
    }
  }

  async function toggleComplete(task: Task) {
    setSavingId(task.id);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      const { data } = await safeJson(res);

      if (!res.ok) throw new Error(data?.error ?? "Failed to update task");

      if (data?.task) setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      else await loadTasks();
    } finally {
      setSavingId(null);
    }
  }

  function startEdit(task: Task) {
    setEditing((prev) => ({ ...prev, [task.id]: task.title }));
  }

  function cancelEdit(taskId: string) {
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
  }

  async function saveEdit(task: Task) {
    const title = (editing[task.id] ?? "").trim();
    if (!title) return;

    setSavingId(task.id);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const { data } = await safeJson(res);

      if (!res.ok) throw new Error(data?.error ?? "Failed to update title");

      if (data?.task) setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      else await loadTasks();

      cancelEdit(task.id);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        To-Do List (Supabase)
      </h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Add, edit, and complete tasks. Data persists via Supabase.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <label style={{ fontSize: 14, color: "#333" }}>User Identifier:</label>
        <input
          value={userIdentifier}
          onChange={(e) => setUserIdentifier(e.target.value)}
          placeholder="name or email"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
        <button
          onClick={loadTasks}
          disabled={!canLoad || loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      <form onSubmit={addTask} style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || !canLoad || savingId === "new"}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {savingId === "new" ? "Adding..." : "Add"}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        {tasks.length === 0 ? (
          <p style={{ color: "#666" }}>No tasks yet. Add one above.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {tasks.map((task) => {
              const isEditing = editing[task.id] !== undefined;

              return (
                <li
                  key={task.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 14,
                    padding: 14,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task)}
                      disabled={savingId === task.id}
                      style={{ width: 18, height: 18 }}
                    />

                    <div style={{ flex: 1 }}>
                      {!isEditing ? (
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            textDecoration: task.completed ? "line-through" : "none",
                            color: task.completed ? "#777" : "#111",
                          }}
                        >
                          {task.title}
                        </div>
                      ) : (
                        <input
                          value={editing[task.id]}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          style={{
                            width: "100%",
                            padding: 10,
                            border: "1px solid #ddd",
                            borderRadius: 10,
                          }}
                        />
                      )}

                      <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                        {new Date(task.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(task)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid #ddd",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => saveEdit(task)}
                          disabled={savingId === task.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {savingId === task.id ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={() => cancelEdit(task.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
