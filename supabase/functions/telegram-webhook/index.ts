import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram reply:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!telegramToken) {
      return new Response("Telegram Bot Token Not Configured", { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const message = payload.message;

    if (!message || !message.chat || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = String(message.chat.id);
    const text = String(message.text).trim();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle /start <code> command
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const codeParam = parts[1];

      if (!codeParam) {
        await sendTelegramMessage(
          telegramToken,
          chatId,
          "👋 *Welcome to GoalHyke Bot!*\n\nTo link your GoalHyke account and receive daily check-in reminders, click the **Connect Telegram** button in your GoalHyke account settings."
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!UUID_REGEX.test(codeParam)) {
        await sendTelegramMessage(
          telegramToken,
          chatId,
          "❌ *Invalid Account Link Code*\n\nPlease make sure you clicked the official GoalHyke Telegram link from your settings."
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if profile exists for codeParam (user_id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", codeParam)
        .single();

      if (!profile) {
        await sendTelegramMessage(
          telegramToken,
          chatId,
          "❌ *Account Not Found*\n\nWe couldn't find a GoalHyke account for this link code. Please check your settings page."
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Link chat_id to user profile & user_telegram_links
      await supabase.from("user_telegram_links").upsert({
        user_id: profile.id,
        telegram_chat_id: chatId,
      });

      await supabase
        .from("profiles")
        .update({ telegram_chat_id: chatId, reminders_enabled: true })
        .eq("id", profile.id);

      const userName = profile.full_name ? `, ${profile.full_name}` : "";
      await sendTelegramMessage(
        telegramToken,
        chatId,
        `🎉 *Success${userName}! Your GoalHyke account is now linked.*\n\nYou will receive daily check-in reminders and motivation directly in this chat.`
      );
    } else if (text.startsWith("/stop") || text.startsWith("/unsubscribe")) {
      // Handle unsubscribe command
      await supabase
        .from("profiles")
        .update({ reminders_enabled: false })
        .eq("telegram_chat_id", chatId);

      await sendTelegramMessage(
        telegramToken,
        chatId,
        "🔕 *Reminders Paused*\n\nYou have turned off daily reminders. You can re-enable them anytime from your GoalHyke settings."
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in telegram-webhook function:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
