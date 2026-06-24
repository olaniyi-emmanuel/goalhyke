import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: stickers, error: stickErr } = await supabase
      .from("stickers")
      .select("*")
      .order("pack_name", { ascending: true });

    if (stickErr) throw stickErr;

    return NextResponse.json({ success: true, stickers: stickers || [] });
  } catch (error: any) {
    console.error("Failed to load stickers:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
