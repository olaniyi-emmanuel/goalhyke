import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/services/chat";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const conversationId = searchParams.get("conversationId") || undefined;

    if (!query) {
      return NextResponse.json({ error: "query parameter is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const results = await ChatService.searchChat(supabase, user.id, query, conversationId);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Failed to perform search query:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
