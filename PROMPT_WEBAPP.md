# Webapp — Build Prompt

Copy everything below the line into your Claude Code session for the webapp repository.

---

Build a mobile-first Next.js web app for managing a content pipeline. The primary use case is editing daily content plans from a phone after receiving a Slack notification. The app calls a REST API for all data — no database.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- NextAuth.js with Credentials provider for auth
- No database — all state lives in the pipeline API

## Environment Variables

```
PIPELINE_API_URL=http://localhost:5000
PIPELINE_API_KEY=your-api-key
AUTH_USERNAME=admin
AUTH_PASSWORD=your-password
NEXTAUTH_SECRET=random-secret-string
NEXTAUTH_URL=http://localhost:3000
```

## Authentication

Use NextAuth.js with the Credentials provider. Single username/password from env vars. Session-based (JWT cookie). Protect all pages with middleware — redirect to `/login` if unauthenticated.

The pipeline API key is stored server-side only. Next.js API routes (`app/api/...`) proxy requests to the pipeline API, adding the `Authorization: Bearer` header. The browser never sees the API key.

## API Proxy

Create a catch-all API route at `app/api/pipeline/[...path]/route.ts` that proxies to the pipeline API:

```
Browser: GET /api/pipeline/unlove/plan
  → Server: GET http://localhost:5000/api/unlove/plan (with Bearer token)
  → Response forwarded to browser
```

All client-side code calls `/api/pipeline/...` (the Next.js proxy), never the pipeline API directly.

## Pipeline API Reference

Here is every endpoint the webapp uses with exact request/response shapes. The proxy strips `/api/pipeline` and forwards to the pipeline at `/api/...`.

### GET /api/campaigns
```json
{"campaigns": ["unlove", "focus-app"]}
```

### GET /api/{campaign}/config
```json
{
  "campaign": "unlove",
  "product": "Unlove App",
  "content_types": ["demo", "demo-reframe-check-social-media", "how-it-feels-to", "list", "meme"],
  "regions": ["AEST", "EST", "CET"],
  "platforms": ["tiktok", "instagram", "youtube"],
  "posts_per_day": 2,
  "rest_pattern": [true, true, false],
  "content_low_threshold": 8,
  "daily_cycle": {
    "enabled": true,
    "notification_hour": 19,
    "notification_minute": 0,
    "confirmation_window_minutes": 60
  }
}
```
Use `content_types` for dropdowns, `regions` for filter dropdowns.

### GET /api/{campaign}/plan
```json
{
  "campaign": "unlove",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:20:00",
    "groups": [
      {"name": "est-demo", "content_type": "demo-reframe-check-social-media", "region": "EST"},
      {"name": "default", "content_type": null}
    ]
  },
  "paused_creators": ["vanessa-a"]
}
```
`content_type: null` means rotation (campaign's default rotation pattern).

### POST /api/{campaign}/plan/set
```json
// Request
{"content_type": "meme", "region": "EST", "count": 5, "group": "est-meme"}
// content_type required. Use "rotation" or null for rotation. region, count, group optional.

// Response
{
  "message": "Updated group 'est-meme'",
  "plan": {"campaign": "unlove", "updated_at": "...", "groups": [...]}
}
```

### POST /api/{campaign}/plan/remove-group
```json
// Request
{"group": "est-meme"}

// Response
{"message": "Removed group 'est-meme'", "plan": {...}}
```

### POST /api/{campaign}/plan/reset
```json
// Response
{"message": "Plan reset to default", "plan": {...}}
```

### GET /api/{campaign}/plan/preview?date=2026-03-19
```json
{
  "campaign": "unlove",
  "date": "2026-03-19",
  "total": 30,
  "posting": 22,
  "resting": 7,
  "paused": 1,
  "groups": {
    "est-demo": [
      {"creator": "alice-c", "group": "est-demo", "content_type": "demo-reframe-check-social-media", "region": "EST", "action": "post"}
    ],
    "default": [
      {"creator": "abby-m", "group": "default", "content_type": null, "region": "AEST", "action": "post"}
    ],
    "rest": [
      {"creator": "brooke-p", "group": "rest", "content_type": null, "region": "AEST", "action": "rest"}
    ],
    "paused": [
      {"creator": "vanessa-a", "group": "paused", "content_type": null, "region": "AEST", "action": "paused"}
    ]
  },
  "assignments": {
    "abby-m": {"group": "default", "content_type": null, "region": "AEST", "action": "post"}
  }
}
```
Defaults to tomorrow if no date param.

### GET /api/{campaign}/plan/status
```json
// Pending
{
  "target_date": "2026-03-19",
  "status": "pending",
  "notification_sent_at": "2026-03-18T19:00:05",
  "confirmed_at": null,
  "confirmed_by": null,
  "generation_started_at": null,
  "generation_completed_at": null,
  "creators_posting": 22,
  "creators_resting": 7,
  "creators_paused": 1
}

// No active cycle
{"status": "none", "message": "No active daily cycle state"}
```
Possible statuses: `pending`, `confirmed`, `auto_confirmed`, `generating`, `complete`, `complete_with_failures`, `failed`

### POST /api/{campaign}/plan/confirm
```json
// Request (optional body)
{"refresh": true}
// Use refresh:true after editing the plan to re-resolve assignments.

// Response
{"message": "Confirmed plan for 2026-03-19"}
```

### GET /api/{campaign}/creators
```json
{
  "campaign": "unlove",
  "creators": [
    {"name": "abby-m", "region": "AEST", "active": true},
    {"name": "vanessa-a", "region": "AEST", "active": false}
  ]
}
```

### POST /api/{campaign}/creators/{name}/pause
```json
{"message": "Paused 'vanessa-a'"}
```

### POST /api/{campaign}/creators/{name}/resume
```json
{"message": "Resumed 'vanessa-a'"}
```

### GET /api/{campaign}/history?days=7
```json
{
  "campaign": "unlove",
  "history": [
    {
      "date": "2026-03-18",
      "summary": {"total": 30, "posted": 22, "failed": 1, "resting": 7, "by_group": {"default": {"total": 23, "posted": 22, "failed": 1}}},
      "plan_snapshot": {"groups": [{"name": "default", "content_type": null}]}
    }
  ]
}
```

### GET /api/{campaign}/history?date=2026-03-18
```json
{
  "date": "2026-03-18",
  "campaign": "unlove",
  "plan_snapshot": {"groups": [{"name": "default", "content_type": null}]},
  "assignments": {
    "abby-m": {"group": "default", "content_type": null, "region": "AEST", "action": "post", "status": "posted", "scheduled": 2},
    "brooke-p": {"group": "default", "content_type": null, "region": "AEST", "action": "post", "status": "failed", "error": "generation failed"},
    "chloe-b": {"group": "rest", "content_type": null, "region": "AEST", "action": "rest", "status": "rest"}
  },
  "summary": {"total": 30, "posted": 22, "failed": 1, "resting": 7, "by_group": {"default": {"total": 23, "posted": 22, "failed": 1}}}
}
```

### GET /api/{campaign}/content-levels
```json
{
  "campaign": "unlove",
  "threshold": 8,
  "exhausted": [
    {"creator": "jess-w", "text_pack": "pack-3", "text_type": "demo-reframe-check-social-media", "remaining": 0}
  ],
  "low": [
    {"creator": "chloe-b", "text_pack": "pack-1", "text_type": "demo", "remaining": 3}
  ],
  "total_issues": 2
}
```

### GET /api/orchestrator/status
```json
{
  "last_main_run": "2026-03-18T20:00:05",
  "last_main_run_minutes_ago": 15,
  "last_deep_run": "2026-03-18T18:00:02",
  "last_deep_run_minutes_ago": 135,
  "total_runs": 47,
  "last_errors": ["[unlove] 2 failed posts detected"],
  "creator_status": {
    "unlove/abby-m": {"status": "healthy", "max_posts_possible": 24, "days_available": 12}
  }
}
```

### Error responses
```json
{"error": "Description of what went wrong"}
```
Status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error).

## Pages to Build (in order)

### 1. Login Page (`/login`)

Simple username/password form. Uses NextAuth Credentials provider. Redirects to `/` on success. Show error message on invalid credentials.

### 2. API Proxy (`app/api/pipeline/[...path]/route.ts`)

Catch-all route that forwards GET/POST requests to the pipeline API. Adds `Authorization: Bearer` header from server env. Returns the pipeline response directly. Requires authenticated session (check with `getServerSession`).

### 3. Dashboard (`/`)

One card per campaign. Each card shows:
- Campaign product name (from config)
- Daily cycle status badge: green (complete), yellow (pending), blue (generating), red (failed)
- Creator counts: "22 posting, 7 resting, 1 paused"
- Content warning count if > 0: "3 content warnings"
- If status is `"pending"`: show a "Confirm" button that calls `POST /api/pipeline/{campaign}/plan/confirm`
- Tap card to navigate to `/{campaign}`

Fetch on load: `GET /api/pipeline/campaigns`, then for each campaign: `/api/pipeline/{campaign}/plan/status`, `/api/pipeline/{campaign}/content-levels`.

### 4. Campaign Overview (`/{campaign}`)

- Header: campaign product name
- Status card: daily cycle status with target date, countdown to auto-confirm if pending, confirm button if pending
- Summary: posting/resting/paused counts from plan/status
- Content warnings: count of exhausted + low, link to content page
- Recent history: last 3 days from `/history?days=3`, each showing posted/failed/resting
- Orchestrator health: last run time, status indicator
- Navigation links/tabs: Plan Editor, Creators, History, Content

### 5. Plan Editor (`/{campaign}/plan` and `/{campaign}/plan/[date]`)

This is the most important page. Mobile-first layout, top to bottom:

**Header section:**
- Campaign name, target date
- Status badge (pending/confirmed/generating/complete)
- If pending: countdown timer showing minutes until auto-confirm. Calculate from `notification_sent_at` + `confirmation_window_minutes`.

**Plan groups section:**
- Fetch current plan from `GET /plan`
- Fetch campaign config from `GET /config` (for content_type and region dropdown options)
- Render each group as a card:
  - Group name (editable text or auto-generated)
  - Content type dropdown (populated from `config.content_types`, plus "Rotation" option which sends `null`)
  - Region dropdown (populated from `config.regions`, plus "All" option which sends nothing)
  - Count number input (optional, blank = all)
  - Delete button → `POST /plan/remove-group`
- "Add Group" button at the bottom
- "Reset to Default" text button
- On any change: `POST /plan/set` for the modified group, then refresh preview

**Live preview section:**
- Fetch from `GET /plan/preview?date={date}` after each plan change (debounce 500ms)
- Summary bar: "22 posting · 7 resting · 1 paused"
- Grouped list: each group name as a header, creators listed underneath with their region
- Color-code groups (use consistent colors per group name)
- Collapsible on mobile — show summary counts by default, tap to expand full creator list

**Content warnings section:**
- Fetch from `GET /content-levels`
- Red badges for exhausted (0 remaining), yellow for low
- Grouped by text type

**Sticky bottom action bar:**
- Primary button: "Confirm Plan" (if status is pending)
- If the plan was modified during this session (any set/remove-group/reset call was made), the button should say "Confirm with Refresh" and send `{"refresh": true}`
- Disable button if status is not pending
- Show status text if already confirmed/generating/complete

**Polling:** Poll `GET /plan/status` every 30 seconds while on this page. Update the status badge and countdown. If status changes to confirmed/auto_confirmed by another user, show a toast and update the UI.

### 6. Creator List (`/{campaign}/creators`)

- Fetch from `GET /creators`
- Search bar at top (client-side filter by name)
- Filter chips: All, AEST, EST, CET, Active, Paused
- Each creator row: name, region badge, active/paused status badge
- Tap to expand: shows pause/resume toggle button
- Pause → `POST /creators/{name}/pause`, Resume → `POST /creators/{name}/resume`
- Update the row in-place after mutation

### 7. Content Levels (`/{campaign}/content`)

- Fetch from `GET /content-levels` and `GET /config`
- Header: "X exhausted, Y low" summary
- Show threshold value from config
- List grouped by text type:
  - Text type header
  - Each entry: creator name, pack name, remaining count
  - Color: red background for 0, yellow for 1-threshold, green for above
- Sort: exhausted first, then by remaining ascending

### 8. History (`/{campaign}/history`)

- Fetch from `GET /history?days=14`
- Date list, most recent first
- Each row: date, posted/failed/resting counts, plan group names
- Visual indicator when plan changed between days (compare group names)
- Tap a date → expand inline or navigate to detail view
- Detail view: fetch `GET /history?date={date}`, show per-creator results with status badges (posted ✓, failed ✗, rest —)
- Failed creators highlighted with error message

## Design Requirements

### Mobile-First
- The plan editor MUST work well on a 375px wide screen (iPhone SE)
- Large touch targets (44px minimum) for all interactive elements
- Sticky bottom bar for the confirm button — must be always visible without scrolling
- Dropdowns should use native mobile select on small screens
- Collapsible sections to reduce scroll depth

### Visual Design
- Clean, minimal — this is an operational tool, not a consumer app
- Use shadcn/ui components: Card, Button, Badge, Select, Input, Collapsible, Toast
- Status colors: green (complete/healthy), yellow (pending/warning), blue (generating), red (failed/exhausted)
- Dark mode support via Tailwind (nice to have, not required for v1)

### Performance
- Use React Server Components where possible (data fetching on server)
- Client components only for interactive elements (plan editor, polling)
- SWR or React Query for client-side data fetching with automatic revalidation

## Project Structure

```
app/
  login/page.tsx
  page.tsx                              — Dashboard
  api/
    auth/[...nextauth]/route.ts         — NextAuth
    pipeline/[...path]/route.ts         — API proxy
  [campaign]/
    page.tsx                            — Campaign overview
    plan/
      page.tsx                          — Plan editor (tomorrow)
      [date]/page.tsx                   — Plan editor (specific date)
    creators/page.tsx                   — Creator list
    history/page.tsx                    — History browser
    content/page.tsx                    — Content levels
lib/
  api.ts                                — Client-side API helpers (fetch /api/pipeline/...)
  types.ts                              — TypeScript types matching API responses
  auth.ts                               — NextAuth config
components/
  plan/
    GroupCard.tsx                        — Single plan group editor
    GroupList.tsx                        — List of group cards + add button
    PreviewPanel.tsx                     — Assignment preview
    ConfirmBar.tsx                       — Sticky bottom confirm bar
    StatusBadge.tsx                      — Status badge component
  creators/
    CreatorRow.tsx
    CreatorFilters.tsx
  content/
    ContentLevelRow.tsx
  history/
    HistoryRow.tsx
    HistoryDetail.tsx
  layout/
    CampaignNav.tsx                     — Tab navigation between plan/creators/history/content
    StatusCard.tsx                       — Reusable status card
middleware.ts                           — Auth redirect
```

## Important Notes

- The plan editor is the core page. Spend the most effort here — it needs to feel fast and responsive on mobile.
- When the user edits a group, track that `planModified = true` so the confirm button knows to send `{"refresh": true}`.
- The preview should update live as groups are edited, but debounce the API calls (500ms).
- The countdown timer on the plan editor should tick down in real-time (client-side interval), not just on poll.
- `content_type: null` in the API means rotation. Display this as "Rotation" in the UI. When sending to the API, the Select dropdown should send `null` (not the string "null") for the Rotation option. Alternatively send `"rotation"` which the API normalizes to null.
- All API errors have the shape `{"error": "message"}`. Show these as toast notifications.
- The `/{campaign}/plan/{date}` URL is what the Slack bot links to. It must work as a deep link — load all necessary data on mount, don't require navigating from the dashboard first.
