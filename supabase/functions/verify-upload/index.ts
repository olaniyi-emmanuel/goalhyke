import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Safe native converter for ArrayBuffer to Base64 (prevents stack overflow on large files)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the progress submission details
    const { data: submission, error: fetchError } = await supabase
      .from("progress_submissions")
      .select("*, goals(*)")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cleanup old submissions & storage files (older than 7 days, or keeping at most 7 submissions per goal)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 1. Fetch and delete submissions older than 7 days
      const { data: oldSubmissions } = await supabase
        .from("progress_submissions")
        .select("id, image_url")
        .lt("created_at", sevenDaysAgo.toISOString());

      const filePathsToRemove: string[] = [];
      const submissionIdsToRemove: string[] = [];

      if (oldSubmissions && oldSubmissions.length > 0) {
        for (const sub of oldSubmissions) {
          submissionIdsToRemove.push(sub.id);
          if (sub.image_url) {
            const parts = sub.image_url.split("/submissions/");
            if (parts.length > 1) {
              filePathsToRemove.push(decodeURIComponent(parts[1]));
            }
          }
        }
      }

      // 2. Fetch submissions for this goal to ensure we only keep a maximum of 7 images/submissions
      const { data: goalSubmissions } = await supabase
        .from("progress_submissions")
        .select("id, image_url")
        .eq("goal_id", submission.goal_id)
        .order("created_at", { ascending: false });

      if (goalSubmissions && goalSubmissions.length > 7) {
        const excessSubmissions = goalSubmissions.slice(7);
        for (const sub of excessSubmissions) {
          if (!submissionIdsToRemove.includes(sub.id)) {
            submissionIdsToRemove.push(sub.id);
            if (sub.image_url) {
              const parts = sub.image_url.split("/submissions/");
              if (parts.length > 1) {
                filePathsToRemove.push(decodeURIComponent(parts[1]));
              }
            }
          }
        }
      }

      // Perform cleanup
      if (filePathsToRemove.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from("submissions")
          .remove(filePathsToRemove);
        if (storageErr) {
          console.error("Storage cleanup error:", storageErr.message);
        } else {
          console.log(`Successfully deleted ${filePathsToRemove.length} files from storage.`);
        }
      }

      if (submissionIdsToRemove.length > 0) {
        const { error: dbErr } = await supabase
          .from("progress_submissions")
          .delete()
          .in("id", submissionIdsToRemove);
        if (dbErr) {
          console.error("Database cleanup error:", dbErr.message);
        } else {
          console.log(`Successfully deleted ${submissionIdsToRemove.length} records from database.`);
        }
      }
    } catch (cleanupErr: any) {
      console.error("Error running database & storage cleanup:", cleanupErr.message);
    }

    const API_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY or GEMINI_API_KEY secret. Please add it to your Supabase project secrets." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch previous verified submissions by this user (defensively fallback if metadata column doesn't exist)
    let previousSubmissions: any[] = [];
    const { data: prevData, error: prevError } = await supabase
      .from("progress_submissions")
      .select("notes, image_url, metadata")
      .eq("goal_id", submission.goal_id)
      .eq("user_id", submission.user_id)
      .eq("verified", "verified")
      .neq("id", submission.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (prevError) {
      console.warn("Could not fetch metadata from previous submissions, retrying without metadata:", prevError.message);
      const { data: retryData } = await supabase
        .from("progress_submissions")
        .select("notes, image_url")
        .eq("goal_id", submission.goal_id)
        .eq("user_id", submission.user_id)
        .eq("verified", "verified")
        .neq("id", submission.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (retryData) {
        previousSubmissions = retryData;
      }
    } else if (prevData) {
      previousSubmissions = prevData;
    }

    // Prepare attachment for Gemini if present
    let filePart = null;
    if (submission.image_url && submission.image_url !== "text-only") {
      try {
        const fileResponse = await fetch(submission.image_url);
        if (fileResponse.ok) {
          const arrayBuffer = await fileResponse.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          const mimeType = fileResponse.headers.get("content-type") || "image/jpeg";
          filePart = {
            inlineData: {
              data: base64,
              mimeType: mimeType,
            },
          };
        }
      } catch (fileErr) {
        console.error("Error downloading file for Gemini verification:", fileErr);
      }
    }

    const submissionMode = submission.goals.metadata?.submission_mode || "image";

    // Construct prompt
    const prompt = `
You are an expert AI verifier for GoalHyke, a habit consistency tracking app. Your task is to verify if a user's progress submission constitutes valid proof for their goal.

Goal Title: "${submission.goals.title}"
Goal Description: "${submission.goals.description || ""}"
Expected Submission Mode: "${submissionMode}"

User's Submission Notes: "${submission.notes || ""}"
Attachment URL: "${submission.image_url || "None"}"

Previous submissions metadata from this user:
${JSON.stringify(previousSubmissions?.map(p => ({ notes: p.notes, metadata: (p as any).metadata || {} })) || [])}

Instructions:
1. Verification: Determine if the submission note and/or attached file provides valid, authentic, and non-duplicate proof that the user completed their action for the goal today.
2. Submission Mode Enforcement:
   - If the Expected Submission Mode is "image", the user must have uploaded an image (represented by a valid attachment URL/file). Verify the content of the image.
   - If it is "video", the user must have uploaded a video file (represented by a valid attachment URL/file). Verify the content of the video.
   - If it is "text", the user is only required to write a text log (attachment is optional/none). Evaluate the truthfulness, detail, and substance of the User's Submission Notes alone to determine if they completed the action.
3. Metadata Extraction: Extract structured metadata about this submission (e.g., date of activity, weight value, workout duration, activity type, key stats, code commits, document titles, or audio transcripts).
4. Duplicate Check: Compare the extracted metadata and the contents of this submission with the metadata of previous submissions. If the user is reusing the exact same file, screenshot, link, or text note from a previous day, mark the verification as failed with a status of "failed" and feedback indicating a duplicate.
5. Output: You must respond in a strict JSON format matching the schema below.

JSON schema:
{
  "verified": "verified" | "failed",
  "feedback": "Detailed explanation of why it was approved or rejected.",
  "extracted_metadata": {
    "activity_details": "Brief summary of the completed activity",
    "stats": {}, // Key numeric stats found (e.g., weight: 75, pages: 12, linesOfCode: 50)
    "timestamp_found": "Any date/time found in the screenshot or note",
    "hash_signatures": "Key identifiers for duplicity detection (like specific file names, links, text summaries)"
  }
}
`;

    // Call OpenRouter Gemini 2.5 Flash
    const openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    const messages: any[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ];

    if (filePart) {
      const base64Data = filePart.inlineData.data;
      const mimeType = filePart.inlineData.mimeType;
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`
        }
      });
    }

    const referer =
      Deno.env.get("SITE_URL") ??
      Deno.env.get("PUBLIC_SITE_URL") ??
      Deno.env.get("NEXT_PUBLIC_SITE_URL") ??
      "https://goalhyke.com";

    const response = await fetch(openrouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": referer,
        "X-Title": "GoalHyke"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${errorText}`);
    }

    const openrouterData = await response.json();
    const resultText = openrouterData.choices?.[0]?.message?.content;
    if (!resultText) {
      throw new Error("Empty response from OpenRouter API");
    }

    const resultJson = JSON.parse(resultText);
    const verified = resultJson.verified === "verified" ? "verified" : "failed";
    const feedback = resultJson.feedback || "AI Verification completed.";
    const metadata = resultJson.extracted_metadata || {};

    // Update the progress submission (defensively fallback if metadata column doesn't exist)
    let { error: updateError } = await supabase
      .from("progress_submissions")
      .update({
        verified,
        verification_feedback: feedback,
        metadata,
      })
      .eq("id", submissionId);

    if (updateError) {
      console.warn("Failed to update metadata column (it might not exist yet), retrying update without metadata:", updateError.message);
      const { error: retryError } = await supabase
        .from("progress_submissions")
        .update({
          verified,
          verification_feedback: feedback,
        })
        .eq("id", submissionId);
      updateError = retryError;
    }

    if (updateError) {
      throw updateError;
    }

    // Prepare updated metadata for the goal
    const currentGoalMetadata = submission.goals.metadata || {};
    const now = new Date();
    const lastReported = `Reported on ${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    
    // Calculate Next Report Due (next day)
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + 1);
    const nextReportDue = nextDue.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    const updatedGoalMetadata = {
      ...currentGoalMetadata,
      last_reported: lastReported,
      next_report_due: nextReportDue,
      report_time: "12:00 AM CAT"
    };

    // Update goals table (defensively update progress/streak/metadata)
    const goalUpdateData: any = {
      metadata: updatedGoalMetadata
    };

    if (verified === "verified") {
      const currentProgress = submission.goals.progress || 0;
      const newProgress = Math.min(100, currentProgress + 10);
      const newStreak = (submission.goals.streak || 0) + 1;

      goalUpdateData.progress = newProgress;
      goalUpdateData.streak = newStreak;
      goalUpdateData.status = newProgress === 100 ? "completed" : "active";
    }

    await supabase
      .from("goals")
      .update(goalUpdateData)
      .eq("id", submission.goal_id);

    return new Response(
      JSON.stringify({ success: true, verified, feedback, metadata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    let message = error.message;
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded") || message.includes("quota")) {
      message = "Gemini API Quota Exceeded. Google AI Studio restricts the Free Tier to 0 requests/min in some regions. Please link a billing account (pay-as-you-go) in Google AI Studio to enable requests, or check your API key.";
    }
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
