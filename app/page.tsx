"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  user_identifier: string;
  title: string;
  steps: string[] | null;
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

  // UI-only: show/hide suggested steps per task
  const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatReply, setChatReply] = useState<string | null>(null);

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
      setTasks((data?.tasks ?? []) as Task[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // set default showSteps when tasks arrive (only if not set yet)
  useEffect(() => {
    setShowSteps((prev) => {
      const next = { ...prev };
      for (const t of tasks) {
        if (next[t.id] === undefined) {
          // default: show if it has steps and task isn't completed
          next[t.id] = Array.isArray(t.steps) && t.steps.length > 0 && !t.completed;
        }
      }
      return next;
    });
  }, [tasks]);

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
      if (data?.task) {
        setTasks((prev) => [data.task as Task, ...prev]);
      } else {
        await loadTasks();
      }
    } finally {
      setSavingId(null);
    }
  }

  async function sendChat() {
    const msg = chatMessage.trim();
    if (!msg || !canLoad) return;

    setSendingChat(true);
    setChatReply(null);

    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "whatsapp",
          from: userIdentifier.trim(),
          message: msg,
        }),
      });

      const text = await res.text();
      setChatReply(text || "(empty response)");

      if (res.ok) {
        setChatMessage("");
        await loadTasks();
      }
    } finally {
      setSendingChat(false);
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

      if (data?.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? (data.task as Task) : t)));
      } else {
        await loadTasks();
      }
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

      if (data?.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? (data.task as Task) : t)));
      } else {
        await loadTasks();
      }

      cancelEdit(task.id);
    } finally {
      setSavingId(null);
    }
  }

  async function removeSteps(task: Task) {
    setSavingId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: null }),
      });

      const { data } = await safeJson(res);
      if (!res.ok) throw new Error(data?.error ?? "Failed to remove steps");

      if (data?.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? (data.task as Task) : t)));
      } else {
        await loadTasks();
      }

      setShowSteps((prev) => ({ ...prev, [task.id]: false }));
    } finally {
      setSavingId(null);
    }
  }

  function toggleStepsUI(taskId: string) {
    setShowSteps((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  // Small reusable style helpers (tokenized)
  const cardStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  };

  const buttonStyle: React.CSSProperties = {
    background: "var(--card)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    cursor: "pointer",
  };

  const chipStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--foreground)",
    background: "var(--chip)",
    border: "1px solid var(--border)",
    padding: "4px 8px",
    borderRadius: 999,
  };

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        To-Do List (Supabase)
      </h1>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        Add, edit, and complete tasks. Data persists via Supabase.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <label style={{ fontSize: 14, color: "var(--muted)" }}>User Identifier:</label>
        <input
          value={userIdentifier}
          onChange={(e) => setUserIdentifier(e.target.value)}
          placeholder="name or email"
          style={{ flex: 1, padding: 10, borderRadius: 10, ...inputStyle }}
        />
        <button
          onClick={loadTasks}
          disabled={!canLoad || loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            ...buttonStyle,
            cursor: !canLoad || loading ? "not-allowed" : "pointer",
            opacity: !canLoad || loading ? 0.7 : 1,
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
          style={{ flex: 1, padding: 12, borderRadius: 12, ...inputStyle }}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || !canLoad || savingId === "new"}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 800,
            ...buttonStyle,
            cursor:
              !newTitle.trim() || !canLoad || savingId === "new" ? "not-allowed" : "pointer",
            opacity: !newTitle.trim() || !canLoad || savingId === "new" ? 0.7 : 1,
          }}
        >
          {savingId === "new" ? "Adding..." : "Add"}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        {tasks.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No tasks yet. Add one above.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {tasks.map((task) => {
              const isEditing = editing[task.id] !== undefined;
              const hasSteps = Array.isArray(task.steps) && task.steps.length > 0;
              const isSaving = savingId === task.id;
              const isStepsVisible = !!showSteps[task.id];

              return (
                <li
                  key={task.id}
                  style={{
                    ...cardStyle,
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  {/* LEFT: checkbox + content */}
                  <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task)}
                      disabled={isSaving}
                      style={{ width: 18, height: 18, marginTop: 3 }}
                      aria-label="Complete task"
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      {!isEditing ? (
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            lineHeight: 1.25,
                            textDecoration: task.completed ? "line-through" : "none",
                            color: task.completed ? "var(--muted2)" : "var(--foreground)",
                            wordBreak: "break-word",
                          }}
                        >
                          {task.title}
                        </div>
                      ) : (
                        <input
                          value={editing[task.id] ?? ""}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 10,
                            fontSize: 16,
                            ...inputStyle,
                          }}
                        />
                      )}

                      {/* Suggested steps */}
                      {hasSteps && !isEditing && (
                        <div style={{ marginTop: 10 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={chipStyle}>Suggested steps</span>

                            <button
                              type="button"
                              onClick={() => toggleStepsUI(task.id)}
                              style={{
                                ...chipStyle,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {isStepsVisible ? "Hide" : "Show"}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeSteps(task)}
                              disabled={isSaving}
                              style={{
                                ...chipStyle,
                                fontWeight: 900,
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.7 : 1,
                              }}
                              title="Removes steps from the DB (PATCH steps:null)"
                            >
                              {isSaving ? "…" : "Remove"}
                            </button>
                          </div>

                          {isStepsVisible && (
                            <ul
                              style={{
                                margin: "10px 0 0 0",
                                paddingLeft: 18,
                                color: "var(--foreground)",
                                fontSize: 14,
                                lineHeight: 1.5,
                              }}
                            >
                              {(task.steps ?? []).slice(0, 10).map((s, i) => (
                                <li key={i} style={{ marginBottom: 6, color: "var(--muted)" }}>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 10 }}>
                        {new Date(task.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          ...buttonStyle,
                        }}
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(task)}
                          disabled={isSaving}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            fontWeight: 900,
                            ...buttonStyle,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            opacity: isSaving ? 0.7 : 1,
                          }}
                        >
                          {isSaving ? "Saving…" : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelEdit(task.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            ...buttonStyle,
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

      {/* --- Floating button + Side Drawer: WhatsApp Simulator --- */}
      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          padding: "12px 14px",
          borderRadius: 999,
          ...buttonStyle,
          fontWeight: 900,
          boxShadow: "var(--shadow)",
          zIndex: 50,
        }}
        title="Open WhatsApp simulator"
      >
        {chatOpen ? "Close" : "WhatsApp"}
      </button>

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 380,
          maxWidth: "90vw",
          background: "var(--card)",
          color: "var(--foreground)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          transform: chatOpen ? "translateX(0)" : "translateX(110%)",
          transition: "transform 200ms ease",
          zIndex: 49,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>WhatsApp Simulator</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Calls <code>/api/inbox</code>. Triggers only with <b>#to-do</b> / <b>#todo</b>.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            style={{
              ...buttonStyle,
              borderRadius: 10,
              padding: "8px 10px",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            border: "1px solid var(--border)",
            background: "var(--chip)",
            padding: "8px 10px",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 4, color: "var(--foreground)" }}>
            From (user_identifier)
          </div>
          <div style={{ wordBreak: "break-word" }}>{userIdentifier.trim() || "(empty)"}</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="#to-do comprar leche"
            style={{ flex: 1, padding: 12, borderRadius: 12, ...inputStyle }}
          />
          <button
            type="button"
            onClick={sendChat}
            disabled={!chatMessage.trim() || !canLoad || sendingChat}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              fontWeight: 900,
              ...buttonStyle,
              cursor: !chatMessage.trim() || !canLoad || sendingChat ? "not-allowed" : "pointer",
              opacity: !chatMessage.trim() || !canLoad || sendingChat ? 0.7 : 1,
            }}
          >
            {sendingChat ? "…" : "Send"}
          </button>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Tip: try <code>#to-do pay rent</code> to create a task.
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {chatReply ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                padding: 12,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--chip)",
                color: "var(--foreground)",
                fontSize: 12,
              }}
            >
              {chatReply}
            </pre>
          ) : (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 12,
                padding: 12,
                color: "var(--muted2)",
                fontSize: 12,
              }}
            >
              No messages yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
