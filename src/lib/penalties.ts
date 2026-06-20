import { createClient } from "@/lib/supabase/client";

export interface PenaltyResult {
  hasChanges: boolean;
  updatedMetadata: any;
  updatedStatus: string;
}

export function checkWeeklyPenalties(goal: any, submissions: any[]): PenaltyResult {
  const metadata = { ...goal.metadata };
  
  // Initialize metadata fields if not present
  const committedTokens = typeof metadata.committed_tokens === "number" ? metadata.committed_tokens : 20;
  if (typeof metadata.committed_tokens !== "number") {
    metadata.committed_tokens = committedTokens;
  }
  if (typeof metadata.remaining_committed !== "number") {
    metadata.remaining_committed = committedTokens;
  }
  if (typeof metadata.failures_count !== "number") {
    metadata.failures_count = 0;
  }
  if (!Array.isArray(metadata.failures_logged)) {
    metadata.failures_logged = [];
  }
  if (!Array.isArray(metadata.success_logged)) {
    metadata.success_logged = [];
  }
  if (!Array.isArray(metadata.deductions_history)) {
    metadata.deductions_history = [];
  }

  let hasChanges = false;
  let currentStatus = goal.status || "active";

  // If the goal is not active, do not apply new penalties
  if (currentStatus !== "active") {
    return { hasChanges: false, updatedMetadata: metadata, updatedStatus: currentStatus };
  }

  // Parse start date in local time
  const start = new Date(goal.start_date + "T00:00:00");
  const now = new Date();
  
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const elapsedMs = now.getTime() - start.getTime();
  const completedWeeks = Math.floor(elapsedMs / weekMs);

  for (let w = 1; w <= completedWeeks; w++) {
    const isLogged = metadata.failures_logged.includes(w) || metadata.success_logged.includes(w);
    if (isLogged) continue;

    const weekStart = start.getTime() + (w - 1) * weekMs;
    const weekEnd = start.getTime() + w * weekMs;

    // Filter submissions for this week range
    const weekSubs = submissions.filter((sub) => {
      const subTime = new Date(sub.created_at).getTime();
      return subTime >= weekStart && subTime < weekEnd;
    });

    const verifiedCount = weekSubs.filter((s) => s.verified === "verified").length;
    const pendingCount = weekSubs.filter((s) => s.verified === "pending").length;

    if (verifiedCount >= 5) {
      // Success! Log it
      metadata.success_logged.push(w);
      hasChanges = true;
    } else {
      // If they can't possibly reach 5 verified even if all pending are verified
      if (verifiedCount + pendingCount < 5) {
        metadata.failures_logged.push(w);
        metadata.failures_count += 1;
        
        let deduct = 0;
        if (metadata.failures_count === 1) {
          deduct = Math.floor(metadata.remaining_committed * 0.5);
        } else if (metadata.failures_count === 2) {
          deduct = Math.floor(metadata.remaining_committed * 0.5);
        } else if (metadata.failures_count >= 3) {
          deduct = metadata.remaining_committed; // Forfeit all remaining
          currentStatus = "failed";
        }

        metadata.remaining_committed -= deduct;
        metadata.deductions_history.push({
          week_number: w,
          deducted_amount: deduct,
          reason: `Week ${w} Consistency Check Failed (${verifiedCount} of 5 accepted submissions)`,
          timestamp: new Date().toISOString(),
        });

        hasChanges = true;

        if (currentStatus === "failed") {
          break; // Stop evaluating further weeks if goal failed
        }
      }
    }
  }

  return {
    hasChanges,
    updatedMetadata: metadata,
    updatedStatus: currentStatus,
  };
}

export async function processGoalPenalties(goal: any, submissions: any[]): Promise<{ updatedGoal: any; wasUpdated: boolean }> {
  const check = checkWeeklyPenalties(goal, submissions);
  if (check.hasChanges) {
    const supabase = createClient();
    const { error } = await supabase
      .from("goals")
      .update({
        metadata: check.updatedMetadata,
        status: check.updatedStatus,
      })
      .eq("id", goal.id);

    if (error) {
      console.error("Failed to update goal penalties:", error);
      return { updatedGoal: goal, wasUpdated: false };
    }

    return {
      updatedGoal: {
        ...goal,
        metadata: check.updatedMetadata,
        status: check.updatedStatus,
      },
      wasUpdated: true,
    };
  }

  return { updatedGoal: goal, wasUpdated: false };
}
