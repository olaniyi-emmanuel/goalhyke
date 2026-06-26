import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const phone = body.phone; // E.g., "08146456544"

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number for matching: remove leading zero and special characters
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneSuffix = cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone; // e.g. "8146456544"

    // 1. Fetch user profiles
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("*");

    if (profileErr) {
      throw new Error(`Failed to fetch profiles: ${profileErr.message}`);
    }

    const profile = profiles.find((p: any) => {
      const pNum = p.phone_number ? p.phone_number.replace(/\D/g, "") : "";
      return pNum.endsWith(phoneSuffix);
    });

    if (!profile) {
      return new Response(
        JSON.stringify({ error: `User profile with phone number ending in ${phoneSuffix} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch the user's active goals
    const { data: goals, error: goalsErr } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "active");

    if (goalsErr) {
      throw new Error(`Failed to fetch goals: ${goalsErr.message}`);
    }

    // Extract primary goal details
    let goalTitle = "Stay accountable and build consistent habits";
    let goalWhy = "Achieving long-term growth and consistency";

    if (goals && goals.length > 0) {
      const primaryGoal = goals[0];
      goalTitle = primaryGoal.title;
      goalWhy = primaryGoal.description || "No specific motivation listed.";
    }

    // 3. Call Gemini API to generate tailored motivational messages
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    let telegramMessage = "";
    let emailHtml = "";

    if (geminiApiKey) {
      const prompt = `You are GoalHyke's elite AI Accountability Coach.
User Name: ${profile.full_name || "GoalHyker"}
Goal: ${goalTitle}
User's personal motivation ('why'): ${goalWhy}

Generate:
1. A Telegram message: short (max 80 words), high-energy, action-oriented, with dynamic emojis. Use Markdown.
2. A comprehensive, deep, and structured Email body: detailed coaching report. Include sections for reflection, daily action plans, and cognitive strategies to stay accountable. Use HTML format.

Respond strictly in JSON format matching this schema:
{
  "telegram": "string (Markdown format)",
  "email": "string (HTML format)"
}`;

      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  telegram: { type: "STRING" },
                  email: { type: "STRING" }
                },
                required: ["telegram", "email"]
              }
            }
          })
        });

        if (!geminiRes.ok) {
          throw new Error(`Gemini API returned status ${geminiRes.status}`);
        }

        const geminiData = await geminiRes.json();
        const textResponse = geminiData.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textResponse);
        telegramMessage = parsed.telegram;
        emailHtml = parsed.email;
      } catch (aiErr) {
        console.error("AI Generation failed, falling back to templates:", aiErr);
      }
    }

    // Fallbacks
    if (!telegramMessage) {
      telegramMessage = `🔥 *GoalHyke Reminder!*\n\nHey ${profile.full_name || "GoalHyker"}, keep pushing towards your goal: *${goalTitle}*.\n\nRemember your 'why': _"${goalWhy.slice(0, 100)}..."_\n\nStay consistent today! 🚀`;
    }
    if (!emailHtml) {
      emailHtml = `
        <h2>Hello ${profile.full_name || "GoalHyker"},</h2>
        <p>This is your comprehensive GoalHyke accountability report.</p>
        <h3>Your Current Focus:</h3>
        <p><strong>Goal:</strong> ${goalTitle}</p>
        <p><strong>Your Motivation (Why):</strong> ${goalWhy}</p>
        <hr/>
        <p>Keep your daily streaks active to stay on track. Action breeds confidence!</p>
      `;
    }

    // 4. Fetch linked Telegram chat ID
    const { data: link, error: linkErr } = await supabase
      .from("user_telegram_links")
      .select("telegram_chat_id")
      .eq("user_id", profile.id)
      .single();

    let telegramSent = false;
    let telegramError = null;

    if (link && link.telegram_chat_id) {
      const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (telegramToken) {
        try {
          const teleRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: link.telegram_chat_id,
              text: telegramMessage,
              parse_mode: "Markdown"
            })
          });

          if (teleRes.ok) {
            telegramSent = true;
          } else {
            const teleErrData = await teleRes.json();
            if (teleRes.status === 403 || teleErrData.description?.toLowerCase().includes("blocked") || teleErrData.description?.toLowerCase().includes("forbidden")) {
              console.warn(`User blocked the bot. Removing Telegram chat ID: ${link.telegram_chat_id}`);
              await supabase.from("user_telegram_links").delete().eq("telegram_chat_id", link.telegram_chat_id);
              telegramError = "Bot was blocked by user. Linked chat ID has been deleted.";
            } else {
              telegramError = teleErrData.description;
            }
          }
        } catch (err: any) {
          telegramError = err.message;
        }
      } else {
        telegramError = "TELEGRAM_BOT_TOKEN is not configured in Deno environment.";
      }
    } else {
      telegramError = "Telegram chat ID not linked for this user.";
    }

    // 5. Fetch user's email address
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(profile.id);
    const emailAddress = userData?.user?.email;

    let emailSent = false;
    let emailError = null;

    if (emailAddress) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && resendApiKey !== "re_dummy_key_for_testing") {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: "GoalHyke AI Coach <motivation@goalhyke.com>",
              to: emailAddress,
              subject: `GoalHyke AI Coaching: Stay Accountable to ${goalTitle}`,
              html: emailHtml
            })
          });

          if (res.ok) {
            emailSent = true;
          } else {
            const errData = await res.json();
            emailError = errData.message;
          }
        } catch (err: any) {
          emailError = err.message;
        }
      } else {
        emailSent = true;
        emailError = "MOCK DELIVERY: RESEND_API_KEY is not configured or is set to a dummy key. logged successfully.";
        console.log(`[MOCK EMAIL TO ${emailAddress}]:\nSubject: GoalHyke AI Coaching: Stay Accountable to ${goalTitle}\nBody:\n${emailHtml}`);
      }
    } else {
      emailError = `Could not fetch email address for user ID ${profile.id}: ${userErr?.message || "Not found"}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: profile.id,
          full_name: profile.full_name,
          email: emailAddress,
          phone: profile.phone_number
        },
        goal: {
          title: goalTitle,
          why: goalWhy
        },
        telegram: {
          sent: telegramSent,
          message: telegramMessage,
          chat_id: link?.telegram_chat_id || null,
          error: telegramError
        },
        email: {
          sent: emailSent,
          error: emailError
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error running send-motivation edge function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
