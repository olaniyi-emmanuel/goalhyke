import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/services/chat";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const conversations = await ChatService.getConversations(supabase, user.id);
    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    console.error("Failed to fetch conversations:", error);
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
    const { type, name, description, buddyId, memberIds } = body;

    if (!type || (type !== "dm" && type !== "group")) {
      return NextResponse.json({ error: "Invalid conversation type" }, { status: 400 });
    }

    if (type === "dm") {
      if (!buddyId) {
        return NextResponse.json({ error: "buddyId is required for DM" }, { status: 400 });
      }
      const conversation = await ChatService.getOrCreateDM(supabase, user.id, buddyId);
      return NextResponse.json({ success: true, conversation });
    } else {
      if (!name) {
        return NextResponse.json({ error: "Group name is required" }, { status: 400 });
      }
      const allMembers = memberIds || [];
      const conversation = await ChatService.createGroup(supabase, name, description || null, user.id, allMembers);
      return NextResponse.json({ success: true, conversation });
    }
  } catch (error: any) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
