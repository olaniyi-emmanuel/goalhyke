import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Failed to send reply via Telegram Bot API:", errData);
    }
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verify webhook signature secret token
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
    const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");

    if (secretToken && incomingSecret !== secretToken) {
      console.warn("Unauthorized webhook request. Secret token mismatch.");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = await request.json();
    console.log("Telegram Webhook Payload:", JSON.stringify(payload));

    const message = payload.message;
    if (!message || !message.chat || !message.text) {
      // Acknowledge other update types to prevent Telegram retries
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = String(message.text).trim();

    // 2. Handle /start <uuid> command pattern
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const uuidParam = parts[1]; // The potential UUID parameter from Telegram start command

      if (!uuidParam) {
        // Simple /start greeting without UUID
        await sendTelegramMessage(
          chatId,
          "👋 *Welcome to GoalHyke Bot!*\n\nTo link your GoalHyke account and receive accountability check-in reminders, please click the link provided in your GoalHyke dashboard settings."
        );
        return NextResponse.json({ ok: true });
      }

      if (!UUID_REGEX.test(uuidParam)) {
        await sendTelegramMessage(
          chatId,
          "❌ *Invalid Link Code*\n\nThe integration code is invalid. Please make sure you copied the correct link from your GoalHyke account settings."
        );
        return NextResponse.json({ ok: true });
      }

      // Initialize admin client to update private integration table
      const supabase = createAdminClient();

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", uuidParam)
        .single();

      if (profileError || !profile) {
        console.warn(`User profile not found for UUID ${uuidParam}:`, profileError);
        await sendTelegramMessage(
          chatId,
          "❌ *User Account Not Found*\n\nWe couldn't find a GoalHyke account matching this link. Please log in to GoalHyke and regenerate the Telegram link."
        );
        return NextResponse.json({ ok: true });
      }

      // Link the account (upsert chat ID for this user)
      const { error: upsertError } = await supabase
        .from("user_telegram_links")
        .upsert({
          user_id: profile.id,
          telegram_chat_id: chatId,
        });

      if (upsertError) {
        console.error(`Failed to upsert telegram link for user ${profile.id}:`, upsertError);
        await sendTelegramMessage(
          chatId,
          "⚠️ *Database Error*\n\nSomething went wrong while linking your account. Please try again in a few moments."
        );
        return NextResponse.json({ ok: true });
      }

      // Confirm success to the user
      const userName = profile.full_name ? `, ${profile.full_name}` : "";
      await sendTelegramMessage(
        chatId,
        `🎉 *Success${userName}! Your GoalHyke account is now linked.*\n\nYou will receive accountability reminders and goal updates directly in this chat.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error in telegram-webhook route:", error);
    // Always return 200 to Telegram to stop webhook retries, but return error body
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}
