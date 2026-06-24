import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/services/chat";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId query parameter is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const messages = await ChatService.getMessages(supabase, conversationId, limit, offset);
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Failed to load messages:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, messageType, parentId, attachments } = body;

    if (!conversationId || content === undefined) {
      return NextResponse.json({ error: "conversationId and content are required fields" }, { status: 400 });
    }

    const message = await ChatService.sendMessage(
      supabase,
      conversationId,
      user.id,
      content,
      messageType || "text",
      parentId || null,
      attachments
    );

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
