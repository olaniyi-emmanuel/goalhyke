export const weeklyHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Progress Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #f8fafc; padding: 40px 20px;">
    <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0; padding: 35px; box-sizing: border-box;">
      
      <!-- Premium Light Header -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td>
            <div style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">GOALHYKE</div>
            <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px; letter-spacing: -0.5px;">Weekly Reports</div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="font-size: 11px; font-weight: 700; color: #2563eb; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 6px 14px; border-radius: 9999px; display: inline-block;">
              Week {{ .WeekNumber }}
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting & Outperformance Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle; width: 48px; padding-right: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 800; line-height: 48px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);">
                {{ .AvatarInitials }}
              </div>
            </td>
            <td style="vertical-align: middle;">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a;">Hello, {{ .FullName }}!</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 3px;">
                🔥 You outperformed <strong style="color: #10b981; font-weight: 700;">{{ .OutperformPct }}%</strong> of Goalhyke users this week.
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Section: KPI User Weekly -->
      <div style="margin-bottom: 30px;">
        <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">KPI User Weekly</div>
        <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin: 0 -12px;">
          <tr>
            <!-- Card 1: Completed Tasks -->
            <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 600; color: #64748b;">Successfully Task</div>
                    <div style="font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 6px; letter-spacing: -1px;">{{ .CompletedCount }}</div>
                    <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 4px; display: inline-block;">
                      ▲ {{ .TaskGainPct }}% <span style="color: #94a3b8; font-weight: 500;">vs last week</span>
                    </div>
                  </td>
                  <td style="width: 50px; text-align: right; vertical-align: bottom;">
                    <!-- Mini Vertical Bar Chart -->
                    <table style="height: 40px; display: inline-block; border-collapse: collapse; border-spacing: 2px;">
                      <tr style="vertical-align: bottom;">
                        <td style="padding: 0 1px;"><div style="background-color: #bfdbfe; height: 12px; width: 4px; border-radius: 2px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #bfdbfe; height: 18px; width: 4px; border-radius: 2px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #bfdbfe; height: 26px; width: 4px; border-radius: 2px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #2563eb; height: 32px; width: 4px; border-radius: 2px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #2563eb; height: 40px; width: 4px; border-radius: 2px;"></div></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 15px; padding-top: 10px; font-size: 11px; font-weight: 700;">
                <a href="https://goalhyke.com/goals" style="color: #2563eb; text-decoration: none;">See Details →</a>
              </div>
            </td>
            <!-- Card 2: Active Goals/Streak -->
            <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 600; color: #64748b;">Active Goals</div>
                    <div style="font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 6px; letter-spacing: -1px;">{{ .ActiveCount }}</div>
                    <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 4px; display: inline-block;">
                      ▲ {{ .StreakGainPct }}% <span style="color: #94a3b8; font-weight: 500;">vs last week</span>
                    </div>
                  </td>
                  <td style="width: 44px; text-align: right; vertical-align: middle;">
                    <!-- SVG Circular Progress Donut -->
                    <svg width="40" height="40" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" stroke-width="4"/>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" stroke-width="4"
                              stroke-dasharray="{{ .StreakDonutPct }} 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 15px; padding-top: 10px; font-size: 11px; font-weight: 700;">
                <a href="https://goalhyke.com/goals" style="color: #2563eb; text-decoration: none;">See Details →</a>
              </div>
            </td>
          </tr>
          <tr>
            <!-- Card 3: Milestones/Completed -->
            <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 600; color: #64748b;">Course Completed</div>
                    <div style="font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 6px; letter-spacing: -1px;">{{ .MilestonesCount }}</div>
                    <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 4px; display: inline-block;">
                      ▲ 12% <span style="color: #94a3b8; font-weight: 500;">vs last week</span>
                    </div>
                  </td>
                  <td style="width: 60px; text-align: right; vertical-align: middle;">
                    <!-- Mini Line Graph SVG -->
                    <svg width="55" height="28" viewBox="0 0 50 25" style="overflow: visible;">
                      <path d="M0 20 Q10 5, 20 18 T40 5 T50 2" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
                      <circle cx="50" cy="2" r="3" fill="#2563eb"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 15px; padding-top: 10px; font-size: 11px; font-weight: 700;">
                <a href="https://goalhyke.com/dashboard" style="color: #2563eb; text-decoration: none;">See Details →</a>
              </div>
            </td>
            <!-- Card 4: Leaderboard Rank -->
            <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 600; color: #64748b;">Leaderboard</div>
                    <div style="font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 6px; letter-spacing: -1px;">#{{ .Rank }}</div>
                    <div style="font-size: 11px; color: #ef4444; font-weight: 700; margin-top: 4px; display: inline-block;">
                      ▼ 18% <span style="color: #94a3b8; font-weight: 500;">vs last week</span>
                    </div>
                  </td>
                  <td style="width: 50px; text-align: right; vertical-align: bottom;">
                    <!-- Step-Up Bar Chart (Table Column Bars) -->
                    <table style="height: 35px; display: inline-block; border-collapse: collapse; border-spacing: 2px;">
                      <tr style="vertical-align: bottom;">
                        <td style="padding: 0 1px;"><div style="background-color: #2563eb; height: 14px; width: 5px; border-radius: 1px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #2563eb; height: 22px; width: 5px; border-radius: 1px;"></div></td>
                        <td style="padding: 0 1px;"><div style="background-color: #bfdbfe; height: 35px; width: 5px; border-radius: 1px;"></div></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="border-top: 1px solid #f1f5f9; margin-top: 15px; padding-top: 10px; font-size: 11px; font-weight: 700;">
                <a href="https://goalhyke.com/buddies" style="color: #2563eb; text-decoration: none;">See Details →</a>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Section: Report Weekly (Performance & Analytics) -->
      <div style="margin-bottom: 30px;">
        <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">Report Weekly</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <tr>
            <!-- Left: User Performance (Gauge) -->
            <td style="width: 42%; padding: 25px; border-right: 1px solid #e2e8f0; vertical-align: top; box-sizing: border-box; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: left; margin-bottom: 20px;">User Performance</div>
              
              <!-- Semi-circle Gauge Container -->
              <div style="position: relative; height: 105px; width: 160px; margin: 0 auto 10px;">
                <svg width="160" height="105" viewBox="0 0 100 65" style="display: block;">
                  <path d="M 10,60 A 40,40 0 0,1 90,60" fill="none" stroke="#f1f5f9" stroke-width="12" stroke-linecap="round"/>
                  <path d="M 10,60 A 40,40 0 0,1 90,60" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"
                        stroke-dasharray="125.6" stroke-dashoffset="{{ .GaugeDashoffset }}"/>
                </svg>
                <div style="position: absolute; bottom: 8px; left: 0; right: 0; text-align: center;">
                  <div style="font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">{{ .GoalAlignScore }}%</div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">of 100 points</div>
                </div>
              </div>
              
              <div style="text-align: left; margin-top: 15px;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">Your performance is great!</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4;">
                  Your performance is well above average. Keep tracking tasks, courses, and leaderboard standing targets.
                </div>
              </div>
              
              <div style="border-top: 1px solid #f1f5f9; margin-top: 20px; padding-top: 12px; text-align: left; font-size: 11px; font-weight: 700;">
                <a href="https://goalhyke.com/" style="color: #2563eb; text-decoration: none;">Improve Score →</a>
              </div>
            </td>

            <!-- Right: Analytics 8-Week Block Chart -->
            <td style="width: 58%; padding: 25px; vertical-align: top; box-sizing: border-box;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                  <td><div style="font-size: 13px; font-weight: 700; color: #0f172a;">Analytics</div></td>
                  <td style="text-align: right;">
                    <span style="font-size: 10px; font-weight: 700; color: #64748b; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; background-color: #f8fafc;">
                      Last Weekly
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Stacked Grid of Squares (generated dynamically in index.ts) -->
              <div style="margin: 20px 0 10px;">
                {{ .AnalyticsChartHtml }}
              </div>

              <!-- Legend -->
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; color: #64748b;">
                <tr>
                  <td style="text-align: right;">
                    <span style="display: inline-block; width: 8px; height: 8px; background-color: #f1f5f9; border-radius: 2px; margin-right: 4px; vertical-align: middle;"></span>Not Started
                    <span style="display: inline-block; width: 8px; height: 8px; background-color: #2563eb; border-radius: 2px; margin-left: 10px; margin-right: 4px; vertical-align: middle;"></span>In-Progress
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Section: View Report Weekly (Timetable Activity & Donut Split) -->
      <div style="margin-bottom: 30px;">
        <div style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">View Report Weekly</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <tr>
            <!-- Left Column: Activity Time Grid -->
            <td style="width: 58%; padding: 25px; border-right: 1px solid #e2e8f0; vertical-align: top; box-sizing: border-box;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 20px; text-align: left;">Total Watching (Time Blocks)</div>
              
              <!-- Time Block Grid Layout (generated dynamically in index.ts) -->
              {{ .TimeGridHtml }}
            </td>

            <!-- Right Column: Total Visit Split Donut -->
            <td style="width: 42%; padding: 25px; vertical-align: top; box-sizing: border-box; text-align: center;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: left; margin-bottom: 18px;">Total Visit</div>
              
              <div style="text-align: left; margin-bottom: 12px;">
                <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">{{ .DeepWorkHours }} hrs/week</div>
                <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 3px;">
                  ▲ {{ .FocusGainPct }}% <span style="color: #94a3b8; font-weight: 500;">vs last week</span>
                </div>
              </div>

              <!-- SVG Donut Chart for Split -->
              <div style="margin: 15px auto 15px; width: 80px; height: 80px;">
                <svg width="80" height="80" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" stroke-width="4"/>
                  <!-- Tasks segment -->
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#60a5fa" stroke-width="4"
                          stroke-dasharray="{{ .SplitPct1 }} 100" stroke-dashoffset="0"/>
                  <!-- Habits segment -->
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" stroke-width="4"
                          stroke-dasharray="{{ .SplitPct2 }} 100" stroke-dashoffset="{{ .SplitOffset2 }}"/>
                </svg>
              </div>

              <!-- Legend table -->
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-top: 10px;">
                <tr>
                  <td style="padding: 3px 0; color: #64748b;"><span style="display:inline-block; width:8px; height:8px; background-color:#60a5fa; border-radius:50%; margin-right:6px; vertical-align: middle;"></span>{{ .SplitLabel1 }}</td>
                  <td style="text-align:right; font-weight:700; color:#1e293b;">{{ .SplitValue1 }}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #64748b;"><span style="display:inline-block; width:8px; height:8px; background-color:#2563eb; border-radius:50%; margin-right:6px; vertical-align: middle;"></span>{{ .SplitLabel2 }}</td>
                  <td style="text-align:right; font-weight:700; color:#1e293b;">{{ .SplitValue2 }}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Plan and Standings -->
      <div style="margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin: 0 -12px;">
          <tr>
            <!-- Accountability Standings Card -->
            <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 15px;">Buddy Standings</div>
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                {{ .BuddyStandingsHtml }}
              </table>
            </td>
            <!-- Action Steps Checklist Card -->
            <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-sizing: border-box;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 15px;">Next Week Targets</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.5; color: #334155;">
                <tr>
                  <td style="padding: 5px 0; vertical-align: top; width: 22px;">
                    <div style="width: 14px; height: 14px; border-radius: 4px; background-color: #2563eb; color: #ffffff; font-size: 9px; line-height: 14px; text-align: center; font-weight: bold;">✓</div>
                  </td>
                  <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">Block mornings (before 12 PM) for deep work.</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; vertical-align: top; width: 22px;">
                    <div style="width: 14px; height: 14px; border-radius: 4px; background-color: #2563eb; color: #ffffff; font-size: 9px; line-height: 14px; text-align: center; font-weight: bold;">✓</div>
                  </td>
                  <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">Check-in with accountability buddy 3x.</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; vertical-align: top; width: 22px;">
                    <div style="width: 14px; height: 14px; border-radius: 4px; border: 1.5px solid #cbd5e1; box-sizing: border-box;"></div>
                  </td>
                  <td style="padding: 5px 0; font-weight: 500; color: #475569;">Log at least 15 hrs in Deep Work category.</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Minimal CTA & Footer Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; text-align: center; margin-top: 10px;">
        <div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 20px;">
          📈 Ready to start the next cycle? Keep tracking those goals!
        </div>
        
        <div style="margin-bottom: 25px;">
          <a href="https://goalhyke.com/" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; font-weight: 700; border-radius: 10px; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
            Open Goalhyke
          </a>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;">
          <tr>
            <td>
              <a href="https://goalhyke.com/goals" style="color: #64748b; text-decoration: none; font-weight: 700;">Review Goals</a>
              <span style="color: #e2e8f0; margin: 0 10px;">|</span>
              <a href="https://goalhyke.com/buddies" style="color: #64748b; text-decoration: none; font-weight: 700;">Challenge Buddies</a>
              <span style="color: #e2e8f0; margin: 0 10px;">|</span>
              <a href="https://goalhyke.com/settings" style="color: #64748b; text-decoration: none; font-weight: 700;">Unsubscribe</a>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 10px; color: #94a3b8; line-height: 1.6; margin: 25px 0 0 0;">
          Copyright &copy; 2026 Goalhyke, All rights reserved. Registered trademark. <br>
          For help or questions, reach out to <a href="mailto:support@goalhyke.com" style="color: #64748b; text-decoration: underline;">support@goalhyke.com</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
