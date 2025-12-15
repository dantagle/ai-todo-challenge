import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_identifier = searchParams.get("user_identifier");

  if (!user_identifier) {
    return NextResponse.json(
      { error: "user_identifier is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseServer
    .from("tasks")
    .select("*")
    .eq("user_identifier", user_identifier)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const user_identifier = body?.user_identifier?.trim();
  const title = body?.title?.trim();

  if (!user_identifier || !title) {
    return NextResponse.json(
      { error: "user_identifier and title are required" },
      { status: 400 }
    );
  }

  const n8nUrl = process.env.N8N_ENHANCE_WEBHOOK_URL;

  let enhancedTitle = title;
  let steps: any[] | null = null;

  if (n8nUrl) {
    try {
      const r = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const j = await r.json();

      // n8n devuelve array con 1 item: [{ enhanced_title, steps }]
      const first = Array.isArray(j) ? j[0] : j;

      if (r.ok && typeof first?.enhanced_title === "string") {
        enhancedTitle = first.enhanced_title;
      }
      if (r.ok && Array.isArray(first?.steps)) {
        steps = first.steps;
      }
    } catch {
      // fallback silencioso
    }
  }

  const { data, error } = await supabaseServer
    .from("tasks")
    .insert([{ user_identifier, title: enhancedTitle, steps, completed: false }])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
