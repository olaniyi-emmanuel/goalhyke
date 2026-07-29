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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!telegramToken) {
      return new Response(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const scheduleType: string = body.schedule_type || "morning_8am";
    const targetUserId: string | undefined = body.user_id; // For instant submission triggers

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD in UTC

    // 1. Instant Submission Trigger Handling (Send single thank-you upon report submission)
    if (scheduleType === "instant_submission" && targetUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, telegram_chat_id, reminders_enabled, last_thank_you_date")
        .eq("id", targetUserId)
        .single();

      if (profile && profile.telegram_chat_id && profile.reminders_enabled) {
        // Send thank-you ONLY IF not already sent today
        if (profile.last_thank_you_date !== todayDateStr) {
          const userName = profile.full_name || "GoalHyker";
          const thankYouMessage = `🎉 *Thank you, ${userName}!*\n\nYour progress report for today has been successfully submitted. Great job staying consistent and protecting your streak! 🚀\n\n_All further reminders for today have been paused. See you tomorrow morning!_`;

          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: profile.telegram_chat_id,
              text: thankYouMessage,
              parse_mode: "Markdown",
            }),
          });

          await supabase
            .from("profiles")
            .update({ last_thank_you_date: todayDateStr })
            .eq("id", profile.id);

          return new Response(
            JSON.stringify({ success: true, message: "Single thank-you sent to user." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      return new Response(
        JSON.stringify({ message: "Thank-you already sent or user not linked." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Scheduled Cron Triggers (morning_8am, evening_6pm, hourly_nudge)
    const { data: users, error: usersErr } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_chat_id, reminders_enabled, last_thank_you_date")
      .not("telegram_chat_id", "is", null)
      .eq("reminders_enabled", true);

    if (usersErr) {
      throw new Error(`Failed to query profiles: ${usersErr.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active Telegram reminder subscribers found.", sentCount: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const user of users) {
      if (!user.telegram_chat_id) continue;

      // Check if user submitted a progress report today
      const todayStart = `${todayDateStr}T00:00:00.000Z`;
      const { count: submissionCount } = await supabase
        .from("progress_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart);

      const hasSubmittedToday = Boolean(submissionCount && submissionCount > 0);
      const userName = user.full_name || "GoalHyker";

      let messageText = "";
      let shouldSend = false;
      let markThankYouSent = false;

      if (scheduleType === "morning_8am") {
        // Morning call to action
        messageText = `☀️ *Good morning, ${userName}!*\n\nTime to report your commitment for today ✅. Staying consistent is key to building unstoppable habits!\n\n👉 [Report Check-in on GoalHyke](https://goalhyke.com/dashboard)`;
        shouldSend = true;
      } else if (scheduleType === "evening_6pm") {
        // Evening status check
        if (hasSubmittedToday) {
          // If submitted and thank-you not sent yet today -> send thank you ONCE
          if (user.last_thank_you_date !== todayDateStr) {
            messageText = `🎉 *Thank you, ${userName}!*\n\nYour progress report for today has been submitted. Awesome work keeping your streak strong! 🚀`;
            shouldSend = true;
            markThankYouSent = true;
          } else {
            // Already thanked today -> silence
            shouldSend = false;
            skippedCount++;
          }
        } else {
          // Not submitted -> send evening reminder
          messageText = `🌙 *Evening Check-in Reminder*\n\nHey ${userName}, you haven't reported your goal progress for today yet. Take a moment to log your check-in before the day ends!\n\n👉 [Submit Report Now](https://goalhyke.com/dashboard)`;
          shouldSend = true;
        }
      } else if (scheduleType === "hourly_nudge") {
        // Hourly nudges (7 PM - 11 PM)
        if (hasSubmittedToday) {
          // User already submitted -> COMPLETE SILENCE! Do not send hourly nudges
          shouldSend = false;
          skippedCount++;
        } else {
          // Unsubmitted -> send urgent hourly nudge
          const currentHour = new Date().getUTCHours();
          const hoursRemaining = 24 - currentHour;

          messageText = `⏳ *Hourly Reminder (${hoursRemaining}h remaining)*\n\nHey ${userName}, you haven't reported your commitment for today yet! Submit before 11:59 PM to protect your staked tokens and streak.\n\n👉 [Submit Report Now](https://goalhyke.com/dashboard)`;
          shouldSend = true;
        }
      }

      if (shouldSend && messageText) {
        try {
          const teleRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: user.telegram_chat_id,
              text: messageText,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            }),
          });

          if (teleRes.ok) {
            sentCount++;
            if (markThankYouSent) {
              await supabase
                .from("profiles")
                .update({ last_thank_you_date: todayDateStr })
                .eq("id", user.id);
            }
          } else {
            const teleErr = await teleRes.json();
            if (
              teleRes.status === 403 ||
              teleErr.description?.toLowerCase().includes("blocked") ||
              teleErr.description?.toLowerCase().includes("forbidden")
            ) {
              await supabase
                .from("profiles")
                .update({ reminders_enabled: false, telegram_chat_id: null })
                .eq("id", user.id);

              await supabase
                .from("user_telegram_links")
                .delete()
                .eq("user_id", user.id);
            } else {
              failedCount++;
            }
          }
        } catch (err) {
          console.error(`Error sending message to ${user.id}:`, err);
          failedCount++;
        }

        // Rate limiting pause (~30 msgs/sec)
        await new Promise((r) => setTimeout(r, 35));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduleType,
        sentCount,
        skippedCount,
        failedCount,
        totalUsers: users.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-daily-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
