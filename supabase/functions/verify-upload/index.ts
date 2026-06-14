import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verification Logic (e.g. validating image_url and note metadata)
    let verified = "verified";
    let feedback = "Verification passed: proof of progress successfully validated.";

    if (!submission.image_url || !submission.image_url.startsWith("http")) {
      verified = "failed";
      feedback = "Verification failed: invalid or corrupt upload proof image.";
    } else if (submission.notes && submission.notes.trim().length < 5) {
      verified = "failed";
      feedback = "Verification failed: please describe your progress in more detail.";
    }

    // Update the progress submission
    const { error: updateError } = await supabase
      .from("progress_submissions")
      .update({
        verified,
        verification_feedback: feedback,
      })
      .eq("id", submissionId);

    if (updateError) {
      throw updateError;
    }

    // Increment goal progress or streak if verified
    if (verified === "verified") {
      const currentProgress = submission.goals.progress;
      const newProgress = Math.min(100, currentProgress + 10);
      const newStreak = submission.goals.streak + 1;

      await supabase
        .from("goals")
        .update({
          progress: newProgress,
          streak: newStreak,
          status: newProgress === 100 ? "completed" : "active",
        })
        .eq("id", submission.goal_id);
    }

    return new Response(
      JSON.stringify({ success: true, verified, feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
