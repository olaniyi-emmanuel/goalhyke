import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { weeklyHtml } from "./weekly_report.ts";
import { monthlyHtml } from "./monthly_report.ts";

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
    if (secret !== "goalhyke-report-secret-2026") {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const schedule = body.schedule || "weekly"; // "weekly" or "monthly"
    const targetUserId = body.user_id; // For testing/triggering a single user report

    // Initialize Supabase Client with Service Role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch 56 days of data to cover the 8-week historical charts and weekly/monthly metrics
    const timeWindowDate = new Date();
    timeWindowDate.setDate(timeWindowDate.getDate() - 56);
    const timeWindowStr = timeWindowDate.toISOString();

    // 2. Fetch target users (either override user_id or all users with email_enabled=true)
    let userIds: string[] = [];
    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      const { data: prefs, error: prefsErr } = await supabase
        .from("notification_preferences")
        .select("user_id")
        .eq("email_enabled", true);

      if (prefsErr) {
        console.warn("Failed to load user preferences (table may be missing). Falling back to all profiles:", prefsErr);
        const { data: allProfs, error: allProfsErr } = await supabase
          .from("profiles")
          .select("id");
        if (allProfsErr) {
          console.error("Failed to load profiles:", allProfsErr);
          throw allProfsErr;
        }
        userIds = allProfs?.map((p) => p.id) || [];
      } else {
        userIds = prefs?.map((p) => p.user_id) || [];
      }
    }

    console.log(`Starting ${schedule} report generation for ${userIds.length} users.`);

    // 3. Fetch global community leaderboard (top 5 by tokens)
    const { data: leaderboard, error: leadErr } = await supabase
      .from("profiles")
      .select("id, username, full_name, tokens")
      .order("tokens", { ascending: false })
      .limit(5);

    if (leadErr) {
      console.error("Failed to load leaderboard:", leadErr);
    }

    // Fetch total profiles count to calculate outperform percentage
    const { count: totalUsers, error: countErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    const totalUsersCount = countErr ? userIds.length : (totalUsers ?? userIds.length);

    const reportResults = [];

    // 4. Generate report for each user
    for (const userId of userIds) {
      try {
        // Fetch User Profile
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profErr || !profile) {
          console.error(`Skipping user ${userId}: profile not found.`, profErr);
          continue;
        }

        // Fetch User Email securely
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId);
        const emailAddress = userData?.user?.email;
        if (userErr || !emailAddress) {
          console.error(`Skipping user ${userId}: email not found.`, userErr);
          continue;
        }

        // Fetch Goals
        const { data: goals, error: goalsErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId);

        if (goalsErr) {
          console.error(`Failed to fetch goals for user ${userId}:`, goalsErr);
        }

        const activeGoals = goals?.filter(g => g.status === 'active') || [];
        const completedGoals = goals?.filter(g => g.status === 'completed') || [];
        const failedGoals = goals?.filter(g => g.status === 'failed') || [];
        const maxStreak = goals ? Math.max(...goals.map(g => g.streak || 0), 0) : 0;

        // Fetch Submissions in the time window
        const { data: submissions, error: subErr } = await supabase
          .from("progress_submissions")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", timeWindowStr);

        if (subErr) {
          console.error(`Failed to fetch submissions for user ${userId}:`, subErr);
        }

        // Filter submissions and milestones for the active report period (7 days or 30 days)
        const periodDays = schedule === "monthly" ? 30 : 7;
        const periodBoundaryDate = new Date();
        periodBoundaryDate.setDate(periodBoundaryDate.getDate() - periodDays);
        
        const periodSubmissions = submissions?.filter(s => new Date(s.created_at) >= periodBoundaryDate) || [];
        const totalSubmissions = periodSubmissions.length;
        const verifiedSubmissions = periodSubmissions.filter(s => s.verified === 'verified').length;

        // Fetch Milestones in the time window
        const { data: milestones, error: mileErr } = await supabase
          .from("milestones")
          .select("*")
          .eq("user_id", userId)
          .gte("achieved_at", timeWindowStr);

        if (mileErr) {
          console.error(`Failed to fetch milestones for user ${userId}:`, mileErr);
        }

        const periodMilestones = milestones?.filter(m => new Date(m.achieved_at) >= periodBoundaryDate) || [];

        // Fetch accountability buddy connections
        const { data: connections, error: connErr } = await supabase
          .from("accountability_connections")
          .select("*")
          .or(`user_id.eq.${userId},buddy_id.eq.${userId}`)
          .eq("status", "active");

        if (connErr) {
          console.error(`Failed to fetch connections for user ${userId}:`, connErr);
        }

        // Collect buddy profiles
        const buddyIds = connections?.map(c => c.user_id === userId ? c.buddy_id : c.user_id) || [];
        let buddies: any[] = [];
        if (buddyIds.length > 0) {
          const { data: buddyProfiles, error: buddErr } = await supabase
            .from("profiles")
            .select("id, username, full_name, tokens")
            .in("id", buddyIds);
          if (buddErr) {
            console.error(`Failed to fetch buddy profiles for user ${userId}:`, buddErr);
          } else {
            buddies = buddyProfiles || [];
          }
        }

        // Calculate User Leaderboard Rank
        const { count: higherRankCount, error: rankErr } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("tokens", profile.tokens || 0);

        const currentRank = rankErr ? "N/A" : (higherRankCount ?? 0) + 1;

        // Render HTML Email Template
        const emailHtml = await generateEmailTemplate({
          schedule,
          fullName: profile.full_name || profile.username || "Goalhyker",
          tokens: profile.tokens || 0,
          rank: currentRank,
          totalUsers: totalUsersCount,
          activeCount: activeGoals.length,
          completedCount: completedGoals.length,
          failedCount: failedGoals.length,
          maxStreak,
          totalSubmissions,
          verifiedSubmissions,
          milestones: periodMilestones,
          buddies,
          leaderboard: leaderboard || [],
          inviteCode: profile.invite_code,
          goals: goals || [],
          submissions: submissions || [],
          profile,
        });

        // Send Email via Resend API
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        let mailSent = false;
        let mailStatus = "mock";

        if (resendApiKey) {
          const subject = schedule === "monthly" 
            ? "Your Goalhyke Monthly Achievement Report 🏆"
            : "Your Goalhyke Weekly Progress Report 🚀";

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: "Goalhyke Reports <reports@goalhyke.com>",
                to: emailAddress,
                subject: subject,
                html: emailHtml,
              })
            });

            if (res.ok) {
              mailSent = true;
              mailStatus = "sent";
            } else {
              const resBody = await res.text();
              console.error(`Resend API rejected report email for ${emailAddress}:`, resBody);
              mailStatus = `error: ${res.status}`;
            }
          } catch (resendErr) {
            console.error(`Failed to send report email for ${emailAddress}:`, resendErr);
            mailStatus = "network_error";
          }
        } else {
          // Log Mock Output
          console.log(`[Email Mock] ${schedule.toUpperCase()} Report to ${emailAddress}`);
          mailSent = true;
          mailStatus = "mock_delivered";
        }

        reportResults.push({
          user_id: userId,
          email: emailAddress,
          status: mailStatus,
          success: mailSent,
          ...(body.return_html ? { html: emailHtml } : {})
        });

      } catch (userLoopErr) {
        console.error(`Error processing report for user ${userId}:`, userLoopErr);
        reportResults.push({
          user_id: userId,
          error: userLoopErr.message,
          success: false
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results: reportResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Internal processing failure in generate-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// HTML Generation Helper
async function generateEmailTemplate(data: {
  schedule: string;
  fullName: string;
  tokens: number;
  rank: number | string;
  totalUsers: number;
  activeCount: number;
  completedCount: number;
  failedCount: number;
  maxStreak: number;
  totalSubmissions: number;
  verifiedSubmissions: number;
  milestones: any[];
  buddies: any[];
  leaderboard: any[];
  inviteCode?: string;
  goals: any[];
  submissions: any[];
  profile: any;
}) {
  const isMonthly = data.schedule === "monthly";

  // 1. Calculate initials
  const avatarInitials = data.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "GH";

  // 2. Outperformance calculation
  const rankNum = typeof data.rank === "number" ? data.rank : parseInt(data.rank as string) || 1;
  const outperformPct = data.totalUsers > 1 
    ? Math.round(((data.totalUsers - rankNum) / data.totalUsers) * 100) 
    : 85;
  const outPct = Math.max(5, Math.min(99, outperformPct));

  // 3. Goal performance rate calculations
  const totalGoals = data.goals.length;
  const completedGoalsCount = data.goals.filter(g => g.status === "completed").length;
  const goalCompPct = totalGoals > 0 
    ? Math.round((completedGoalsCount / totalGoals) * 100) 
    : 0;

  const habitConstPct = data.totalSubmissions > 0 
    ? Math.min(100, Math.round((data.verifiedSubmissions / data.totalSubmissions) * 100)) 
    : 0;

  const taskCompPct = data.totalSubmissions > 0 
    ? Math.min(100, Math.round((data.verifiedSubmissions / data.totalSubmissions) * 100)) 
    : 0;

  // 4. Scorecard grading
  let grade = "B";
  if (goalCompPct >= 95) grade = "A+";
  else if (goalCompPct >= 85) grade = "A";
  else if (goalCompPct >= 75) grade = "A-";
  else if (goalCompPct >= 65) grade = "B+";
  else if (goalCompPct >= 55) grade = "B";
  else if (goalCompPct >= 45) grade = "B-";
  else grade = "C";

  // 5. Scorecard elements
  const focusScore = Math.min(100, 70 + (data.maxStreak * 2));
  const mindfulnessScore = Math.min(100, 75 + (data.totalSubmissions * 3));
  const deepWorkHours = data.totalSubmissions * 2;
  const deepWorkPct = Math.min(100, Math.round((deepWorkHours / 40) * 100));
  const accountabilityScore = data.buddies.length > 0 ? 90 : 0;
  const goalAlignScore = totalGoals > 0 
    ? Math.round(data.goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals) 
    : 75;
  const executionScore = data.totalSubmissions > 0 
    ? Math.round((data.verifiedSubmissions / data.totalSubmissions) * 100) 
    : 75;

  const gaugeDashoffset = 125.6 - (125.6 * (goalAlignScore / 100));
  const streakDonutPct = Math.min(100, Math.round((data.maxStreak / 7) * 100));

  const getWeekNumber = (date: Date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  };
  const weekNumber = getWeekNumber(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const reportMonth = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const taskGainPct = data.totalSubmissions > 0 ? Math.min(99, 10 + data.totalSubmissions * 4) : 0;
  const streakGainPct = data.maxStreak > 0 ? Math.min(99, 5 + data.maxStreak * 6) : 0;
  const focusGainPct = 4.5;
  const streakWeeklyMax = data.completedCount || 3;

  const activeGoals = data.goals.filter(g => g.status === 'active');
  const predictionPct = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length) 
    : 75;

  // Goal list HTML
  let goalProgressListHtml = "";
  if (data.goals && data.goals.length > 0) {
    goalProgressListHtml = data.goals.map(g => {
      const dotEmoji = g.status === 'completed' ? '🟢' : g.status === 'failed' ? '🔴' : '🟡';
      return `
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
              <td style="font-weight: 700; font-size: 14px; color: #1e293b;">${dotEmoji} ${g.title}</td>
              <td style="text-align: right; font-weight: bold; font-size: 14px; color: ${isMonthly ? '#10b981' : '#2563eb'};">${g.progress}%</td>
            </tr>
          </table>
          <div style="background-color: #cbd5e1; height: 6px; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
            <div style="background-color: ${isMonthly ? '#10b981' : '#2563eb'}; height: 100%; width: ${g.progress}%;"></div>
          </div>
          <div style="font-size: 11px; color: #64748b;">
            Category: ${g.category} | Streak: ${g.streak} days | Status: ${g.status.toUpperCase()}
          </div>
        </div>
      `;
    }).join("");
  } else {
    goalProgressListHtml = `
      <div style="text-align: center; padding: 25px; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; font-size: 13px;">
        No active goals found. Let's create one on your dashboard!
      </div>
    `;
  }

  // Buddies HTML
  const participants = [
    { username: data.profile.username, full_name: data.profile.full_name, tokens: data.profile.tokens, isSelf: true },
    ...data.buddies.map(b => ({ username: b.username, full_name: b.full_name, tokens: b.tokens, isSelf: false }))
  ].sort((a, b) => (b.tokens || 0) - (a.tokens || 0));

  const buddyStandingsHtml = participants.map((p, i) => {
    const rankBadge = i < 3 
      ? `<span style="display:inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; background-color: ${["#ffd700", "#c0c0c0", "#cd7f32"][i]}; color: #1e293b; border-radius: 50%; font-size: 10px; font-weight: bold; margin-right: 8px;">${i + 1}</span>`
      : `<span style="display:inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; background-color: #f1f5f9; color: #475569; border-radius: 50%; font-size: 10px; font-weight: bold; margin-right: 8px;">${i + 1}</span>`;
    return `
      <tr style="${p.isSelf ? "background-color: #f8fafc; font-weight: bold;" : ""}">
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
          ${rankBadge} @${p.username} ${p.isSelf ? `<span style="font-size: 10px; color:${isMonthly ? '#10b981' : '#2563eb'}; margin-left:4px;">(You)</span>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #1e293b; font-weight: 700;">
          ${p.tokens || 0} XP
        </td>
      </tr>
    `;
  }).join("");

  // Analytics blocks
  const nowTime = new Date().getTime();
  const columnsCount = isMonthly ? 4 : 8;
  const weeksProgress = [];
  
  for (let i = 0; i < columnsCount; i++) {
    const start = nowTime - (columnsCount - i) * 7 * 24 * 60 * 60 * 1000;
    const end = nowTime - (columnsCount - 1 - i) * 7 * 24 * 60 * 60 * 1000;
    const subsInWeek = (data.submissions || []).filter(sub => {
      const t = new Date(sub.created_at).getTime();
      return t >= start && t < end;
    });
    const verified = subsInWeek.filter(s => s.verified === 'verified').length;
    const total = subsInWeek.length;
    const score = total > 0 ? Math.round((verified / total) * 100) : 0;
    weeksProgress.push(total > 0 ? score : (35 + i * 15) % 85);
  }

  let analyticsChartHtml = `<table style="width: 100%; border-collapse: separate; border-spacing: 4px 6px; text-align: center;">`;
  const blockColor = isMonthly ? '#10b981' : '#2563eb';
  
  for (let row = 4; row >= 1; row--) {
    const threshold = row * 20;
    analyticsChartHtml += `<tr>`;
    analyticsChartHtml += `<td style="font-size: 10px; color: #94a3b8; font-weight: bold; padding-right: 8px; text-align: right; height: 18px; width: 25px;">${threshold}</td>`;
    for (let col = 0; col < columnsCount; col++) {
      const score = weeksProgress[col];
      const isActive = score >= threshold;
      const color = isActive ? blockColor : '#f1f5f9';
      analyticsChartHtml += `<td style="padding: 0 3px;"><div style="background-color: ${color}; height: 18px; border-radius: 4px;"></div></td>`;
    }
    analyticsChartHtml += `</tr>`;
  }
  
  analyticsChartHtml += `<tr><td></td>`;
  for (let col = 0; col < columnsCount; col++) {
    analyticsChartHtml += `<td style="font-size: 9px; font-weight: 800; color: #64748b; text-align: center; padding-top: 6px;">Wk ${col + 1}</td>`;
  }
  analyticsChartHtml += `</tr></table>`;

  // Time grid (Weekly only)
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabels = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayLabels.push(daysOfWeek[d.getDay()]);
  }
  
  const grid = [
    [0, 0, 0, 0, 0, 0, 0, 0], // Evening
    [0, 0, 0, 0, 0, 0, 0, 0], // Afternoon
    [0, 0, 0, 0, 0, 0, 0, 0], // Morning
  ];
  
  for (const sub of data.submissions || []) {
    const subDate = new Date(sub.created_at);
    const diffDays = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 8) {
      const colIdx = 7 - diffDays;
      const hour = subDate.getHours();
      let rowIdx = -1;
      if (hour >= 6 && hour < 12) rowIdx = 2;
      else if (hour >= 12 && hour < 16) rowIdx = 1;
      else if (hour >= 16 && hour < 20) rowIdx = 0;
      
      if (rowIdx !== -1) {
        grid[rowIdx][colIdx]++;
      }
    }
  }

  let timeGridHtml = `<table style="width: 100%; border-collapse: separate; border-spacing: 4px 6px; text-align: center;">`;
  timeGridHtml += `<tr><td></td>`;
  for (let col = 0; col < 8; col++) {
    timeGridHtml += `<td style="font-size: 10px; font-weight: bold; color: #94a3b8;">${dayLabels[col]}</td>`;
  }
  timeGridHtml += `</tr>`;
  
  const timeLabels = ["16:00-20:00", "12:00-16:00", "06:00-12:00"];
  for (let r = 0; r < 3; r++) {
    timeGridHtml += `<tr>`;
    timeGridHtml += `<td style="font-size: 9px; font-weight: 600; color: #64748b; text-align: right; padding-right: 5px; width: 65px;">${timeLabels[r]}</td>`;
    for (let c = 0; c < 8; c++) {
      const count = grid[r][c];
      const isActive = count > 0;
      const color = isActive ? '#2563eb' : '#f1f5f9';
      timeGridHtml += `<td><div style="background-color: ${color}; height: 18px; border-radius: 4px;"></div></td>`;
    }
    timeGridHtml += `</tr>`;
  }
  timeGridHtml += `</table>`;

  // Donut split
  const totalSub = data.totalSubmissions || 1;
  const verifiedSub = data.verifiedSubmissions || 0;
  const splitPct1 = Math.round((verifiedSub / totalSub) * 100) || 35;
  const splitPct2 = 100 - splitPct1;
  const splitOffset2 = -splitPct1;
  const splitLabel1 = "Tasks";
  const splitValue1 = `${splitPct1}%`;
  const splitLabel2 = "Habits";
  const splitValue2 = `${splitPct2}%`;

  // Use statically imported templates (auto-bundled by Supabase CLI / Deno)
  let html = isMonthly ? monthlyHtml : weeklyHtml;

  // Replace placeholders
  html = html.replaceAll("{{ .FullName }}", String(data.fullName));
  html = html.replaceAll("{{ .WeekNumber }}", String(weekNumber));
  html = html.replaceAll("{{ .ReportMonth }}", String(reportMonth));
  html = html.replaceAll("{{ .AvatarInitials }}", String(avatarInitials));
  html = html.replaceAll("{{ .OutperformPct }}", String(outPct));
  html = html.replaceAll("{{ .CompletedCount }}", String(data.completedCount));
  html = html.replaceAll("{{ .ActiveCount }}", String(data.activeCount));
  html = html.replaceAll("{{ .TaskGainPct }}", String(taskGainPct));
  html = html.replaceAll("{{ .MaxStreak }}", String(data.maxStreak));
  html = html.replaceAll("{{ .StreakGainPct }}", String(streakGainPct));
  html = html.replaceAll("{{ .StreakDonutPct }}", String(streakDonutPct));
  html = html.replaceAll("{{ .MilestonesCount }}", String(data.milestones.length));
  html = html.replaceAll("{{ .Rank }}", String(data.rank));
  html = html.replaceAll("{{ .GaugeDashoffset }}", String(gaugeDashoffset));
  html = html.replaceAll("{{ .GoalAlignScore }}", String(goalAlignScore));
  html = html.replaceAll("{{ .AnalyticsChartHtml }}", String(analyticsChartHtml));
  html = html.replaceAll("{{ .TimeGridHtml }}", String(timeGridHtml));
  html = html.replaceAll("{{ .DeepWorkHours }}", String(deepWorkHours));
  html = html.replaceAll("{{ .FocusGainPct }}", String(focusGainPct));
  html = html.replaceAll("{{ .SplitPct1 }}", String(splitPct1));
  html = html.replaceAll("{{ .SplitPct2 }}", String(splitPct2));
  html = html.replaceAll("{{ .SplitOffset2 }}", String(splitOffset2));
  html = html.replaceAll("{{ .SplitLabel1 }}", String(splitLabel1));
  html = html.replaceAll("{{ .SplitValue1 }}", String(splitValue1));
  html = html.replaceAll("{{ .SplitLabel2 }}", String(splitLabel2));
  html = html.replaceAll("{{ .SplitValue2 }}", String(splitValue2));
  html = html.replaceAll("{{ .BuddyStandingsHtml }}", String(buddyStandingsHtml));
  html = html.replaceAll("{{ .GoalProgressListHtml }}", String(goalProgressListHtml));
  html = html.replaceAll("{{ .GoalCompPct }}", String(goalCompPct));
  html = html.replaceAll("{{ .HabitConstPct }}", String(habitConstPct));
  html = html.replaceAll("{{ .TasksCompletedCount }}", String(data.totalSubmissions));
  html = html.replaceAll("{{ .FocusScore }}", String(focusScore));
  html = html.replaceAll("{{ .MindfulnessScore }}", String(mindfulnessScore));
  html = html.replaceAll("{{ .AccountabilityScore }}", String(accountabilityScore));
  html = html.replaceAll("{{ .StreakWeeklyMax }}", String(streakWeeklyMax));
  html = html.replaceAll("{{ .PredictionPct }}", String(predictionPct));
  html = html.replaceAll("{{ .Tokens }}", String(data.tokens));
  html = html.replaceAll("{{ .Grade }}", String(grade));

  return html;
}
