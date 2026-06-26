import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sends a Telegram message to a specific chat ID.
 * Automatically handles the "Bot Block" edge case by unlinking the chat ID if the bot was blocked.
 * 
 * @param chat_id The Telegram chat ID of the user.
 * @param message The markdown-formatted message content.
 * @returns A promise that resolves to true if successful, or false if it failed.
 */
export async function sendTelegramNotification(chat_id: string, message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // 403 Forbidden is returned when user blocks the bot
      // We also check description string check as safety fallback
      const isBlocked = 
        res.status === 403 || 
        data.description?.toLowerCase().includes("blocked") || 
        data.description?.toLowerCase().includes("forbidden") ||
        data.description?.toLowerCase().includes("deactivated");

      if (isBlocked) {
        console.warn(`Telegram message delivery failed: User blocked the bot (Chat ID: ${chat_id}). Unlinking account...`);
        
        // Remove link in database so we don't try sending notifications to a dead channel
        const supabase = createAdminClient();
        const { error } = await supabase
          .from("user_telegram_links")
          .delete()
          .eq("telegram_chat_id", chat_id);

        if (error) {
          console.error(`Failed to delete blocked Telegram link for chat ID ${chat_id}:`, error);
        } else {
          console.log(`Successfully unlinked blocked Telegram chat ID ${chat_id} from database.`);
        }
      } else {
        console.error(`Telegram API error (${res.status}): ${data.description || "Unknown error"}`);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to send Telegram notification to chat ID ${chat_id}:`, error);
    return false;
  }
}
