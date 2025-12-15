import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_identifier = searchParams.get("user_identifier");

  if (!user_identifier) {
    return NextResponse.json({ error: "user_identifier is required" }, { status: 400 });
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

  const { data, error } = await supabaseServer
    .from("tasks")
    .insert([{ user_identifier, title, completed: false }])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
