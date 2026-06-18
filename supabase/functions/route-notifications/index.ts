import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Webhook Secret
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== "goalhyke-notification-secret-2026") {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response(
        JSON.stringify({ error: "Missing notification_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Client with Service Role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Fetch Notification Details
    const { data: notification, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (fetchErr || !notification) {
      console.error("Failed to load notification metadata:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Notification record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = notification.user_id;

    // 3. Fetch User Notification Preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Default to true if not found
    const emailEnabled = prefs ? prefs.email_enabled : true;
    const pushEnabled = prefs ? prefs.push_enabled : true;

    console.log(`Routing notification for user ${userId}. Preferences -> Email: ${emailEnabled}, Push: ${pushEnabled}`);

    const results = {
      email: { dispatched: false, status: "skipped" },
      push: { dispatched: false, count: 0, status: "skipped" }
    };

    // 4. Handle Email Notifications (via Resend)
    if (emailEnabled) {
      // Fetch user's email securely from Auth database using admin API
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId);
      const emailAddress = userData?.user?.email;

      if (userErr || !emailAddress) {
        console.error("Failed to fetch user email address:", userErr);
        results.email.status = "error_user_not_found";
      } else {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: "GoalHyke Alerts <alerts@goalhyke.com>",
                to: emailAddress,
                subject: notification.title,
                html: `<p>${notification.body}</p>`
              })
            });
            if (res.ok) {
              results.email.dispatched = true;
              results.email.status = "sent";
            } else {
              const resBody = await res.text();
              console.error("Resend API rejected email submission:", resBody);
              results.email.status = `resend_api_rejected: ${res.status}`;
            }
          } catch (resendErr) {
            console.error("Failed to contact Resend API:", resendErr);
            results.email.status = "error_api_connection_failed";
          }
        } else {
          // Log Mock Email Delivery
          console.log(`[Email Mock] Sending email notification:\n  To: ${emailAddress}\n  Subject: ${notification.title}\n  Body: ${notification.body}`);
          results.email.dispatched = true;
          results.email.status = "mock_delivered";
        }
      }
    }

    // 5. Handle Web Push Notifications (via VAPID and Browser Vendor Networks)
    if (pushEnabled) {
      // Query active push subscriptions
      const { data: subs, error: subsErr } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (subsErr) {
        console.error("Failed to fetch user subscriptions:", subsErr);
        results.push.status = "error_db_fetch_subscriptions_failed";
      } else if (subs && subs.length > 0) {
        // Configure VAPID details
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "BMmQ0FebFhkN6PjT5xf3RL65sRbxHCML0419RGrH87rOdYhWN2VUPn_-KyqMOYzdZh34K5P-MyojI0E01aJMO0k";
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "DgSWBwDvb8rnwLgjqAwUo_cqTzKwfn5xfDsMnXFLk8E";
        const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@goalhyke.com";

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        const pushPayload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          metadata: notification.metadata
        });

        // Dispatch requests asynchronously to browser vendor push servers
        const dispatches = subs.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          try {
            await webpush.sendNotification(pushSubscription, pushPayload);
            return { id: sub.id, success: true };
          } catch (pushErr) {
            console.error(`Web Push failed for subscription ${sub.id}:`, pushErr);
            // Prune invalid or expired subscriptions (Gone 410 or Not Found 404)
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              console.log(`Pruning expired push subscription ${sub.id}`);
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
            return { id: sub.id, success: false, code: pushErr.statusCode };
          }
        });

        const dispatchResults = await Promise.all(dispatches);
        const successCount = dispatchResults.filter(r => r.success).length;

        results.push.dispatched = successCount > 0;
        results.push.count = successCount;
        results.push.status = `success: ${successCount}/${subs.length}`;
      } else {
        results.push.status = "no_active_subscriptions";
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Internal processing failure in route-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
