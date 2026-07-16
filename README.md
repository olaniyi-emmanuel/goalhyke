# 🏔️ goalHYKE

> A Premium Gamified Commitment & Habit Accountability Platform. Built with Next.js 16, React 19, Tailwind CSS v4, and Supabase.

---

goalHYKE is an ever-evolving habit consistency and commitment platform designed to help users bridge the gap between goal setting and goal execution. By combining financial/token-based incentives, private accountability networks, real-time group communication, and automated AI computer vision verification, goalHYKE drives behavioral consistency.

---

## 🚀 Key Platform Features

### 1. Dual-Frequency Token & Penalty Engine
At the core of goalHYKE's economic incentive design is a dual-layered consistency verification model (simulated via `src/lib/TokenSimulatorEngine.ts` and managed under `src/lib/penalties.ts`):
* **Initial Allocation:** Users start with a baseline token reserve (e.g., 100 tokens).
* **The Micro-Check (Every 3 Days):** Evaluates consistency over a rolling 3-day window. Users must check in at least **2 out of 3 days**. Failure triggers a micro-strike and deducts **20 tokens** to the platform's Slush Fund.
* **The Macro-Check (Every 7 Days):** Evaluates consistency over a rolling 7-day window. Users must check in at least **6 out of 7 days**. Failure triggers a macro-strike and deducts **20 tokens**.
* **Recovery Bonus:** Completing consistent check-ins after a strike rewards the user with a **+10 token recovery bonus** (capped at the initial token ceiling).
* **Liquidation Condition:** If a user accumulates **>= 4 micro-strikes** or **>= 2 macro-strikes**, they are liquidated (token balance drops to 0, and the goal is marked as `failed`).

### 2. Automated AI Progress Verification (`verify-upload`)
A custom Deno-based Supabase Edge Function (`supabase/functions/verify-upload`) performs automated progress validation:
* **Multimodal Inspection:** Utilizing the Gemini API (`gemini-2.5-flash`), the system reads the user's submission notes and analyzes visual evidence (image/video file uploads).
* **Submission Mode Enforcement:** Restricts and verifies proofs dynamically based on goal specifications (e.g., image-only screenshots, video confirmation, or detailed text logs).
* **Plagiarism & Duplicate Prevention:** Extracted metadata (e.g., weights, steps, code commits, time stamps) is matched against historical submissions. Users attempting to reuse previous proof screenshots or repeat old logs are flagged, and their submissions are marked `failed`.
* **Automated Cleanup:** To prevent cloud storage bloat, the function runs a rolling cleanup cycle to delete files older than 7 days or prune history to keep a maximum of 7 submissions per goal.

### 3. Accountability Network & Groups
* **Invite System:** Users are assigned unique, randomly generated invite codes (`HYKE-XXXXXX`) to connect with buddies.
* **Referees & Supporters:** Goals can be bound to third-party Referees (individual verification, self-managed check-ins, or "on-your-honor" trust models) who hold the keys to manual validation.
* **Accountability Connections:** Establish private `buddy` relationships with roles like `Referee` or `Accountability Buddy`.
* **Habit Groups:** Custom multi-user accountability spaces with group boards and interactive goal dashboards.

### 4. Real-Time Rich Communication (`realtime-chat`)
Powered by Supabase Realtime, the messaging engine provides a modern chat experience:
* **Message Types:** Supports standard text, images, videos, files, custom sticker packs, GIFs, emojis, and system alerts.
* **Interactive Elements:** Real-time emoji reactions, read receipts, parent-child thread replies, and typing indicators.
* **Storage Attachment Integration:** Media attachments are stored securely in Supabase storage and delivered via public CDN links.

### 5. Multi-Channel Notification Router (`route-notifications`)
A centralized routing system dispatching notifications through user-selected channels:
* **Web Push:** Integrates web-push VAPID protocols to trigger native browser notifications.
* **Transactional Email:** Routes formatted emails using the Resend API.
* **Granular Preferences:** Users configure channels individually for group updates, buddy alerts, and status changes.

### 6. AI Coach & Motivation Engine (`send-motivation`)
* **Conversational AI Coaching:** A virtual coach generates highly personalized, high-energy coaching advice.
* **Gemini-Generated Content:** Evaluates active goals and the user's "Why" to generate custom Markdown messages for Telegram and styled HTML digests for emails.

### 7. Support Ticket Triaging & Escalation (`triage-tickets`)
An intelligent customer service triage webhook triggered upon ticket insertion:
* **Premium Buyer Escalation:** Queries user transaction records in the database. If a user has a history of paid token purchases, their ticket is automatically marked `is_escalated = true` with a `premium_buyer` status.
* **Smart Category Routing:** Routes requests automatically into four primary queues based on categories:
  * **Billing Issues** ➔ `billing-operations` (High Priority)
  * **Technical Bugs** ➔ `engineering-triage` (High Priority)
  * **Feature Requests** ➔ `product-feedback` (Low Priority)
  * **General Inquiries** ➔ `standard-support` (Normal Priority)
* **Auto-Responders:** Fires confirmation auto-responses to users via Resend, including high-priority VIP SLA alerts for paying customers.

---

## 🛠️ Tech Stack

* **Frontend Framework:** Next.js 16 (App Router), React 19 (using Server Components and modern hooks).
* **Styling:** Tailwind CSS v4 + PostCSS for streamlined utility design.
* **Database & Auth:** Supabase (PostgreSQL database with Row Level Security (RLS) policies, Custom Triggers, and Auth Session management).
* **Deno / Deno Edge Functions:** Deno runtime for serverless edge compute.
* **APIs & Integrations:**
  * **Stripe & Paystack:** Payment gateways for purchasing token packs.
  * **Gemini API / OpenRouter:** Large Language Models (LLM) for vision analysis, code verification, duplicate check, and coaching copy.
  * **Resend:** Transactional email relay.
  * **Telegram Bot API:** Notification sync and mobile check-ins.

---

## 📂 Database Schema Overview

The database layer consists of several critical tables implementing security via strict Row Level Security (RLS) policies:

* `profiles`: User account details, avatar references, token balances, invite codes, and phone numbers.
* `goals`: Core goal definitions detailing duration, progress percentiles, streak values, categories, and metadata (submission modes, committed token weight, remaining tokens).
* `progress_submissions`: Check-in evidence entries containing note text, image URLs, verification status (`pending`, `verified`, `failed`), and Gemini verification feedback.
* `milestones`: User achievements earned by meeting consistency thresholds.
* `accountability_connections`: Stores relationships between users and their referees or accountability buddies.
* `groups` & `group_members`: Defines private spaces for collective habit building.
* `conversations`, `conversation_members`, & `messages`: Database structure powering real-time chat rooms, read receipts, reactions, and attachments.
* `transactions`: Auditing table logging paid token purchases, currencies, amounts, and Stripe/Paystack reference keys.
* `user_telegram_links`: Maps Supabase profiles to Telegram chat IDs for bot notification delivery.
* `support_tickets`: Stores user inquiries, category logs, steps to reproduce, priority tags, and escalation flags.

---

## ⚙️ Local Development Setup

Follow these steps to set up goalHYKE locally:

### 1. Prerequisites
* **Node.js:** Ensure Node.js (v18.x or v20.x+) is installed.
* **Supabase CLI:** Required for running local migrations and testing Edge Functions.
* **Deno Runtime:** Needed for editing and testing Edge Functions locally.

### 2. Installation
Clone the repository and install frontend dependencies:
```bash
git clone https://github.com/olaniyi-emmanuel/goalhyke.git
cd goalhyke
npm install
```

### 3. Environment Variables Config
Create a `.env.local` file in the root directory and configure the following variables:
```env
# Supabase Project Keys
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# AI Verification & Copy Generation (Gemini)
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_API_KEY="sk-or-v1-..."

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_SECRET_TOKEN="your-webhook-secret-token"
```

### 4. Database Setup & Migrations
Initialize your local Supabase database or link it to a cloud project, then apply the SQL migrations inside the `supabase/migrations` folder:
```bash
# Link local CLI to your project
supabase link --project-ref your-project-ref

# Apply existing migrations
supabase db push
```

Ensure the following Storage Buckets are created in your Supabase storage manager and set to **Public**:
* `submissions` (for progress check-in images/videos)
* `ticket_attachments` (for support ticket media)

### 5. Running Supabase Edge Functions locally
Start the local serverless functions emulator:
```bash
supabase functions start
```
To deploy all edge functions to your Supabase project:
```bash
supabase functions deploy generate-report
supabase functions deploy route-notifications
supabase functions deploy send-motivation
supabase functions deploy triage-tickets
supabase functions deploy verify-upload
```

### 6. Starting the Web Server
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to test the local environment.

---

## 🧬 Supabase Edge Functions Catalog

| Function | Trigger Source | Primary Libraries / APIs | Role / Action |
| :--- | :--- | :--- | :--- |
| `verify-upload` | `progress_submissions` creation | Deno, Gemini API (`gemini-2.5-flash`) | Automatic verification of check-in visual and text proof, duplicate check, and bucket cleanup. |
| `triage-tickets` | `support_tickets` insertion | Deno, Resend API | Automated triage based on payment history and ticket category, email routing, and auto-acknowledgements. |
| `route-notifications` | `notifications` table change | `web-push` npm package, Resend API | Fetches user notification preferences and routes via email or push notification channels. |
| `send-motivation` | Scheduled Cron / Webhook | Gemini API (`gemini-2.5-flash`), Telegram Bot API | Generates personalized motivational coaching updates and delivers them to Telegram and Email. |
| `generate-report` | Weekly/Monthly Cron | Deno, Resend API | Generates weekly/monthly leaderboard data, performance milestones, and emails digests via HTML. |

---

## 🔒 Security
* **Row Level Security (RLS):** Policies are enforced on all PostgreSQL tables. Users can only select/insert/update records belonging to their authenticated session (`auth.uid() = user_id`).
* **Service Role Access:** Security-critical functions (such as auto-triaging, checking purchases, or bulk report mailers) run under the `service_role` authorization context.

## 📄 License
This project is licensed under the terms of the private license agreement of goalHYKE. All rights reserved.

