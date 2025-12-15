import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(req: Request) {
  // Safer than params in some dev setups
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // last segment

  if (!id) {
    return NextResponse.json({ error: "Missing task id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  const updates: Record<string, any> = {};
  if (typeof body?.title === "string") updates.title = body.title.trim();
  if (typeof body?.completed === "boolean") updates.completed = body.completed;
  if (body?.steps !== undefined) updates.steps = body.steps;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
