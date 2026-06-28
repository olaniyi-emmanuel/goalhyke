import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Message and sessionId are required" }, { status: 400 });
    }

    // 1. Save user's message
    const { error: userMsgErr } = await supabase
      .from("ai_chat_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        sender: "user",
        content: message,
        message_type: "text"
      });
    if (userMsgErr) throw userMsgErr;

    // 2. Load Active Goals context
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    const goalsContext = goals && goals.length > 0 
      ? goals.map(g => `- Goal ID "${g.id}": "${g.title}" (Category: "${g.category}", progress: ${g.progress}%, streak: ${g.streak} days)`).join("\n")
      : "No active goals currently defined.";

    // 3. Load Active Chatbot Tasks context
    const { data: tasks } = await supabase
      .from("ai_chat_tasks")
      .select("*")
      .eq("user_id", user.id);

    const tasksContext = tasks && tasks.length > 0
      ? tasks.map(t => `- Task ID "${t.id}": "${t.title}" (Priority: ${t.priority}, Completed: ${t.is_completed})`).join("\n")
      : "No active chatbot subtasks defined yet.";

    // 4. Load User AI Preferences context
    const { data: prefs } = await supabase
      .from("ai_chat_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const prefsContext = prefs 
      ? `Motivation style: ${prefs.motivation_style}. Preferred working hours: ${prefs.preferred_hours || "not set"}. Recurring struggles: ${prefs.recurring_struggles?.join(", ") || "none"}. Interests: ${prefs.learning_interests?.join(", ") || "none"}.`
      : "No custom preferences set.";

    // 5. Load recent history (last 8 messages)
    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const chatHistory = history 
      ? [...history].reverse().map(h => `${h.sender === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n")
      : "";

    const systemPrompt = `You are CrushIT AI—the user's elite, high-energy accountability coach, productivity partner, and assistant.
GoalHyke is a gamified accountability app where users stake tokens on their daily habits. If they fail, they are penalized; if they recover, they retain stakes.
Your role:
1. Help users plan, improve, and prioritize big goals (convert ideas like "become cloud engineer" into a visual roadmap).
2. Automatically break down high-level goals into actionable tasks, subtasks, and daily actions with estimated effort and priority.
3. Act as a supportive, high-energy accountability coach: motivate them, celebrate wins, suggest recovery plans if they miss days, and push them past procrastination.
4. Support the app itself: answer questions about GoalHyke rules (tokens, streaks, referees, check-ins, micro-penalties).
5. Help users manage their tasks. You have autonomous database abilities. If the user tells you to create a task, complete a task, or delete a task, you MUST append a command tag at the very end of your response:
   - To create a task: [CMD: CREATE_TASK | Task Title]
   - To toggle/complete a task: [CMD: TOGGLE_TASK | Task ID]
   - To delete a task: [CMD: DELETE_TASK | Task ID]
   - To suggest a goal breakdown: [CMD: CREATE_GOAL | Title | Category | Description]

User Profile Name: ${user.user_metadata?.full_name || "Crusher"}
User Preferences: ${prefsContext}

Active Goals Context:
${goalsContext}

Active Tasks Context:
${tasksContext}

Keep your responses structured, clear, and actionable. Use Markdown headings, bullet points, checklists, and tables where appropriate.

Conversation History:
${chatHistory}

Current Message:
User: ${message}

Assistant:`;

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!openrouterApiKey && !geminiApiKey) {
      return NextResponse.json({ error: "No API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY)" }, { status: 500 });
    }

    let response: Response;
    let isOpenRouter = false;

    if (openrouterApiKey) {
      isOpenRouter = true;
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterApiKey}`,
          "HTTP-Referer": "https://goalhyke.com",
          "X-Title": "GoalHyke"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          stream: true,
          max_tokens: 1000
        })
      });
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI stream query failed:", errText);
      return NextResponse.json({ error: "AI model streaming failure" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";
        let fullAssistantResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            if (isOpenRouter) {
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith("data: ")) {
                  const dataStr = trimmed.replace("data: ", "").trim();
                  if (dataStr === "[DONE]") {
                    break;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) {
                      fullAssistantResponse += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch {}
                }
              }
            } else {
              // Native Gemini Outer Bracket Scanner
              let depth = 0;
              let startIdx = -1;
              let successIdx = -1;

              for (let i = 0; i < buffer.length; i++) {
                if (buffer[i] === "{") {
                  if (depth === 0) startIdx = i;
                  depth++;
                } else if (buffer[i] === "}") {
                  depth--;
                  if (depth === 0 && startIdx !== -1) {
                    const jsonStr = buffer.substring(startIdx, i + 1);
                    try {
                      const chunkData = JSON.parse(jsonStr);
                      const text = chunkData.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        fullAssistantResponse += text;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                      }
                      successIdx = i;
                    } catch (e) {
                      // Incomplete JSON segment, wait for next buffer chunk
                    }
                  }
                }
              }

              if (successIdx !== -1) {
                buffer = buffer.substring(successIdx + 1);
              }
            }
          }

          // Strip CMD actions for final database text insertion
          const commandRegex = /\[CMD:\s*([^\|\]]+)(?:\s*\|\s*([^\]]+))?\]/g;
          const cleanText = fullAssistantResponse.replace(commandRegex, "").trim();

          // Save assistant message to the database
          const { error: asstMsgErr } = await supabase
            .from("ai_chat_messages")
            .insert({
              session_id: sessionId,
              user_id: user.id,
              sender: "assistant",
              content: cleanText,
              message_type: "text"
            });

          if (asstMsgErr) {
            console.error("Failed to save assistant stream message to database:", asstMsgErr);
          }

          // Parse and execute database actions
          let cmdMatch;
          commandRegex.lastIndex = 0;
          while ((cmdMatch = commandRegex.exec(fullAssistantResponse)) !== null) {
            const cmdType = cmdMatch[1].trim();
            const cmdParams = cmdMatch[2] ? cmdMatch[2].split("|").map(s => s.trim()) : [];

            try {
              if (cmdType === "CREATE_TASK" && cmdParams[0]) {
                await supabase.from("ai_chat_tasks").insert({
                  user_id: user.id,
                  title: cmdParams[0],
                  priority: "medium",
                  is_completed: false
                });
              } else if (cmdType === "TOGGLE_TASK" && cmdParams[0]) {
                const { data: current } = await supabase
                  .from("ai_chat_tasks")
                  .select("is_completed")
                  .eq("id", cmdParams[0])
                  .eq("user_id", user.id)
                  .single();
                if (current) {
                  await supabase
                    .from("ai_chat_tasks")
                    .update({ is_completed: !current.is_completed })
                    .eq("id", cmdParams[0])
                    .eq("user_id", user.id);
                }
              } else if (cmdType === "DELETE_TASK" && cmdParams[0]) {
                await supabase
                  .from("ai_chat_tasks")
                  .delete()
                  .eq("id", cmdParams[0])
                  .eq("user_id", user.id);
              } else if (cmdType === "CREATE_GOAL" && cmdParams[0]) {
                const title = cmdParams[0];
                const category = cmdParams[1] || "Level up your career";
                const description = cmdParams[2] || "";
                
                const start = new Date();
                const end = new Date();
                end.setDate(end.getDate() + 30);

                await supabase.from("goals").insert({
                  user_id: user.id,
                  title,
                  category,
                  description,
                  start_date: start.toISOString().split("T")[0],
                  end_date: end.toISOString().split("T")[0],
                  status: "active",
                  progress: 0,
                  streak: 0
                });
              }
            } catch (cmdErr) {
              console.error(`Failed to execute autonomous DB action (${cmdType}):`, cmdErr);
            }
          }

          // Update session updated_at timestamp
          await supabase
            .from("ai_chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", sessionId)
            .eq("user_id", user.id);

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("Stream handler failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
