import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const sessionId = searchParams.get("sessionId");

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "preferences") {
      const { data: prefs } = await supabase
        .from("ai_chat_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return NextResponse.json(prefs || { 
        user_id: user.id, 
        motivation_style: "supportive", 
        preferred_hours: "", 
        learning_interests: [], 
        recurring_struggles: [] 
      });
    }

    if (action === "messages" && sessionId) {
      const { data: messages } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      return NextResponse.json(messages || []);
    }

    // Default Dashboard Fetch: sessions list, tasks list, goals list
    const { data: sessions } = await supabase
      .from("ai_chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    const { data: tasks } = await supabase
      .from("ai_chat_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    return NextResponse.json({
      sessions: sessions || [],
      tasks: tasks || [],
      goals: goals || []
    });
  } catch (error: any) {
    console.error("GET ai-chat failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      sessionId,
      sessionTitle,
      taskId,
      taskTitle,
      goalId,
      priority,
      messageId,
      reactionEmoji,
      motivationStyle,
      preferredHours,
      learningInterests,
      recurringStruggles,
      fileUrl,
      fileName,
      messageType
    } = body;

    // A. CHAT SESSIONS OPERATIONS
    if (action === "create_session") {
      const { data: newSession, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
          user_id: user.id,
          title: sessionTitle || "New Conversation",
          is_pinned: false,
          is_bookmarked: false
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, session: newSession });
    }

    if (action === "rename_session" && sessionId) {
      const { error } = await supabase
        .from("ai_chat_sessions")
        .update({ title: sessionTitle || "Renamed Session", updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "pin_session" && sessionId) {
      const { data: current } = await supabase
        .from("ai_chat_sessions")
        .select("is_pinned")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (current) {
        const { error } = await supabase
          .from("ai_chat_sessions")
          .update({ is_pinned: !current.is_pinned })
          .eq("id", sessionId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    if (action === "bookmark_session" && sessionId) {
      const { data: current } = await supabase
        .from("ai_chat_sessions")
        .select("is_bookmarked")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (current) {
        const { error } = await supabase
          .from("ai_chat_sessions")
          .update({ is_bookmarked: !current.is_bookmarked })
          .eq("id", sessionId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete_session" && sessionId) {
      const { error } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // B. AI TASKS OPERATIONS
    if (action === "add_task" && taskTitle) {
      const { error } = await supabase
        .from("ai_chat_tasks")
        .insert({
          user_id: user.id,
          goal_id: goalId || null,
          title: taskTitle,
          priority: priority || "medium",
          is_completed: false
        });

      if (error) throw error;
      
      const { data: tasks } = await supabase
        .from("ai_chat_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({ success: true, tasks });
    }

    if (action === "toggle_task" && taskId) {
      const { data: current } = await supabase
        .from("ai_chat_tasks")
        .select("is_completed")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();

      if (current) {
        const { error } = await supabase
          .from("ai_chat_tasks")
          .update({ is_completed: !current.is_completed })
          .eq("id", taskId)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      const { data: tasks } = await supabase
        .from("ai_chat_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({ success: true, tasks });
    }

    if (action === "delete_task" && taskId) {
      const { error } = await supabase
        .from("ai_chat_tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      const { data: tasks } = await supabase
        .from("ai_chat_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({ success: true, tasks });
    }

    if (action === "clear_completed_tasks") {
      const { error } = await supabase
        .from("ai_chat_tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("is_completed", true);

      if (error) throw error;

      const { data: tasks } = await supabase
        .from("ai_chat_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({ success: true, tasks });
    }

    // C. USER PREFERENCES OPERATIONS
    if (action === "update_preferences") {
      const { error } = await supabase
        .from("ai_chat_preferences")
        .upsert({
          user_id: user.id,
          motivation_style: motivationStyle || "supportive",
          preferred_hours: preferredHours || "",
          learning_interests: learningInterests || [],
          recurring_struggles: recurringStruggles || [],
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // D. FILE / ATTACHMENT SAVE
    if (action === "save_attachment" && sessionId && fileUrl && fileName) {
      const { data: newMsg, error } = await supabase
        .from("ai_chat_messages")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          sender: "user",
          content: `Shared file: ${fileName}`,
          message_type: messageType || "file",
          attachment_url: fileUrl,
          attachment_name: fileName
        })
        .select()
        .single();

      if (error) throw error;

      // Update session timestamp
      await supabase
        .from("ai_chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true, message: newMsg });
    }

    // E. MESSAGE REACTIONS
    if (action === "add_reaction" && messageId && reactionEmoji) {
      const { data: msg } = await supabase
        .from("ai_chat_messages")
        .select("reactions")
        .eq("id", messageId)
        .eq("user_id", user.id)
        .single();

      if (msg) {
        const reactions = msg.reactions || {};
        const uids = (reactions as any)[reactionEmoji] || [];
        
        let newUids;
        if (uids.includes(user.id)) {
          newUids = uids.filter((id: string) => id !== user.id);
        } else {
          newUids = [...uids, user.id];
        }

        const updatedReactions = { ...reactions } as any;
        if (newUids.length === 0) {
          delete updatedReactions[reactionEmoji];
        } else {
          updatedReactions[reactionEmoji] = newUids;
        }

        const { error } = await supabase
          .from("ai_chat_messages")
          .update({ reactions: updatedReactions })
          .eq("id", messageId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    // F. TOGGLE MESSAGE BOOKMARK
    if (action === "toggle_message_bookmark" && messageId) {
      const { data: msg } = await supabase
        .from("ai_chat_messages")
        .select("is_bookmarked")
        .eq("id", messageId)
        .eq("user_id", user.id)
        .single();

      if (msg) {
        const { error } = await supabase
          .from("ai_chat_messages")
          .update({ is_bookmarked: !msg.is_bookmarked })
          .eq("id", messageId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    console.error("POST ai-chat failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
