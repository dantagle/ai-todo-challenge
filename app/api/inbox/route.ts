import { NextResponse } from "next/server";

type InboxPayload = {
  channel?: string;          // "whatsapp" | "slack" | "web" | etc.
  from?: string;             // phone or user id
  user_identifier?: string;  // optional explicit user id
  message?: string;          // the text message
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as InboxPayload | null;

  const channel = (body?.channel ?? "unknown").toString();
  const from = (body?.from ?? "").toString().trim();
  const user_identifier = (body?.user_identifier ?? from).toString().trim();
  const message = (body?.message ?? "").toString().trim();

  if (!user_identifier || !message) {
    return NextResponse.json(
      { error: "user_identifier (or from) and message are required" },
      { status: 400 }
    );
  }

  // Optional: lightweight trigger filter (useful for WhatsApp)
  // Only create tasks when message includes "#to-do" or "#todo"
  const shouldTrigger = /#to-?do\b/i.test(message);
  const title = message.replace(/#to-?do\b/gi, "").trim();

  if (!shouldTrigger) {
    return NextResponse.json({
      ok: true,
      triggered: false,
      reason: "Message did not include #to-do / #todo",
      channel,
    });
  }

  if (!title) {
    return NextResponse.json(
      { error: "Message contained trigger but title is empty" },
      { status: 400 }
    );
  }

  // Call your existing tasks endpoint (API-first reuse)
  // This preserves: n8n enhancement + DB insert logic in one place.
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const r = await fetch(`${origin}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_identifier, title }),
  });

  const text = await r.text();
  const data = text ? JSON.parse(text) : null;

  if (!r.ok) {
    return NextResponse.json(
      {
        ok: false,
        triggered: true,
        channel,
        error: data?.error ?? "Failed to create task",
      },
      { status: r.status }
    );
  }

  return NextResponse.json({
    ok: true,
    triggered: true,
    channel,
    task: data?.task,
  });
}
