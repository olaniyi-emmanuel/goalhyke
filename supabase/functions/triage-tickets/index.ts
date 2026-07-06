import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook payload received:", JSON.stringify(payload, null, 2));

    // Verify it is an INSERT trigger
    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(
        JSON.stringify({ error: "Only INSERT events on support_tickets are supported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ticket = payload.record;
    const ticketId = ticket.id;
    const userId = ticket.user_id;
    const customerEmail = ticket.customer_email;
    const customerName = ticket.customer_name;
    const category = ticket.category;
    const subject = ticket.subject;

    // Initialize Supabase Client with service role key to allow bypass of RLS policies for updates
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let isEscalated = false;
    let computedPriority = "normal";
    let userType = "guest";

    if (userId) {
      // Authenticated User: Check if they are a "real buyer" (has any successful transactions)
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "success")
        .limit(1);

      if (txError) {
        console.error(`Error querying transactions for user ${userId}:`, txError);
      }

      if (transactions && transactions.length > 0) {
        // User is a real buyer! Automatically escalate the ticket
        isEscalated = true;
        computedPriority = "premium_buyer";
        userType = "premium_buyer";

        // Update the support ticket in the database with the escalated priority
        const { error: updateError } = await supabase
          .from("support_tickets")
          .update({
            is_escalated: true,
            priority: "premium_buyer"
          })
          .eq("id", ticketId);

        if (updateError) {
          console.error(`Failed to update ticket ${ticketId} escalation flags:`, updateError);
        } else {
          console.log(`[ESC-BUYER] Premium Buyer Ticket ${ticketId} successfully escalated in DB.`);
        }
      } else {
        userType = "free_user";
        console.log(`[STANDARD-USER] Authenticated free user ticket ${ticketId} from ${customerEmail}.`);
      }
    } else {
      // Unauthenticated Guest User
      userType = "guest";
      console.log(`[GUEST-USER] Guest support ticket ${ticketId} from ${customerEmail}.`);
    }

    // Triage & Routing Alert Logic based on category & userType
    let routingQueue = "standard-support";
    let priorityLevel = "normal";

    if (userType === "premium_buyer") {
      routingQueue = "vip-escalations";
      priorityLevel = "critical";
    } else if (category === "Technical Bug") {
      routingQueue = "engineering-triage";
      priorityLevel = "high";
    } else if (category === "Billing") {
      routingQueue = "billing-operations";
      priorityLevel = "high";
    } else if (category === "Feature Request") {
      routingQueue = "product-feedback";
      priorityLevel = "low";
    }

    // Log the triage routing statement (representing notifications sent to Slack, Email or external support API)
    const triageLog = {
      ticket_id: ticketId,
      customer: `${customerName} (${customerEmail})`,
      category: category,
      subject: subject,
      user_classification: userType.toUpperCase(),
      routing_target_queue: routingQueue,
      final_priority_level: priorityLevel,
      action_taken: isEscalated ? "Escalated to top of VIP support queue" : "Queued for triage",
      timestamp: new Date().toISOString()
    };

    console.log("TRIAGE ROUTING REPORT:\n", JSON.stringify(triageLog, null, 2));

    // Dispatch email notifications using Resend API if API Key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const description = ticket.description || "";
        const stepsToReproduce = ticket.steps_to_reproduce || "";
        const attachmentUrl = ticket.attachment_url || "";

        // 1. Send Email Notification to support team (forwarding the ticket)
        const supportSubject = `[Ticket #${ticketId.substring(0, 8)}] (${category}) ${subject} [${priorityLevel.toUpperCase()}]`;
        const supportHtml = `
          <h2>New Support Ticket Submitted</h2>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Customer Name:</strong> ${customerName}</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
          <p><strong>User Classification:</strong> ${userType.toUpperCase()}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Queue:</strong> ${routingQueue}</p>
          <p><strong>Priority Level:</strong> ${priorityLevel.toUpperCase()}</p>
          <br/>
          <p><strong>Description:</strong></p>
          <blockquote style="background: #f4f6fa; padding: 15px; border-left: 4px solid #7655fb; white-space: pre-wrap;">${description}</blockquote>
          ${stepsToReproduce ? `
          <p><strong>Steps to Reproduce:</strong></p>
          <blockquote style="background: #fff4f4; padding: 15px; border-left: 4px solid #ff4d4d; white-space: pre-wrap;">${stepsToReproduce}</blockquote>` : ''}
          ${attachmentUrl ? `
          <p><strong>Attachment:</strong> <a href="${attachmentUrl}">View Attached Screenshot</a></p>
          <p><img src="${attachmentUrl}" alt="Attachment" style="max-width: 100%; border: 1px solid #e4e8f2; border-radius: 8px;" /></p>` : ''}
          <hr/>
          <p style="color: #666; font-size: 12px;">Reply directly to this email to respond to the user.</p>
        `;

        const resSupport = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "GoalHyke Support Portal <support@goalhyke.com>",
            to: "support@goalhyke.com",
            reply_to: customerEmail,
            subject: supportSubject,
            html: supportHtml
          })
        });

        if (!resSupport.ok) {
          const errText = await resSupport.text();
          console.error("Failed to forward ticket to support team via Resend:", errText);
        } else {
          console.log(`[EMAIL-DISPATCH] Ticket successfully forwarded to support@goalhyke.com.`);
        }

        // 2. Send Auto-Acknowledgement Email to the customer
        const userSubject = `We have received your request: ${subject} [Ticket #${ticketId.substring(0, 8)}]`;
        const userHtml = `
          <div style="font-family: sans-serif; color: #262525; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background: #7655fb; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h2 style="color: #ffffff; margin: 0;">GoalHyke Help Center</h2>
            </div>
            <div style="padding: 24px; border: 1px solid #eceff7; border-top: none; border-radius: 0 0 12px 12px;">
              <p>Hi ${customerName},</p>
              <p>We've successfully logged your support ticket under ID <strong>#${ticketId.substring(0, 8)}</strong>.</p>
              <p>Our team is currently reviewing it. ${isEscalated ? "<strong>Since you are a premium buyer, your request has been escalated for high-priority response.</strong>" : "We aim to respond to all inquiries within 24 hours."}</p>
              
              <div style="background: #fcfcff; border: 1px solid #e4e8f2; border-radius: 10px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #4f5b7f;">Ticket Details:</p>
                <p style="margin: 0 0 4px 0;"><strong>Category:</strong> ${category}</p>
                <p style="margin: 0 0 4px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 0 0 4px 0;"><strong>Status:</strong> Open</p>
              </div>

              <p>If you have any extra details to add, simply reply directly to this email.</p>
              <br/>
              <p>Best regards,<br/><strong>GoalHyke Support Team</strong></p>
            </div>
          </div>
        `;

        const resUser = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "GoalHyke Support <support@goalhyke.com>",
            to: customerEmail,
            subject: userSubject,
            html: userHtml
          })
        });

        if (!resUser.ok) {
          const errText = await resUser.text();
          console.error("Failed to send auto-acknowledgement to customer via Resend:", errText);
        } else {
          console.log(`[EMAIL-DISPATCH] Auto-acknowledgement email sent to ${customerEmail}.`);
        }

      } catch (emailErr) {
        console.error("Error dispatching Resend emails:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY env variable not set. Email notifications skipped.");
    }

    return new Response(
      JSON.stringify({ success: true, triage: triageLog }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error processing ticket webhook:", err);
    return new Response(
      JSON.stringify({ error: err.message || err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
