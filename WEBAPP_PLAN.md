# Webapp — Implementation Plan

## Purpose

Responsive web app for plan management and pipeline monitoring. Optimized for mobile — the primary use case is editing plans from your phone after receiving a Slack notification.

## Architecture

- Separate git repository
- Next.js (App Router)
- Calls the content pipeline REST API (`http://<host>:5000`)
- API key stored server-side (Next.js API routes proxy to the pipeline API)
- Mobile-first responsive design
- No database — all state lives in the pipeline's filesystem via the API

## URL Structure

```
/                                    — Dashboard (all campaigns)
/{campaign}                          — Campaign overview
/{campaign}/plan                     — Plan editor + preview (default: tomorrow)
/{campaign}/plan/{date}              — Plan editor for specific date
/{campaign}/creators                 — Creator list with status
/{campaign}/history                  — History browser
/{campaign}/content                  — Content level dashboard
```

The Slack bot links directly to `/{campaign}/plan/{date}` so the user lands on the right screen.

## Pages

### 1. Dashboard (`/`)

Overview across all campaigns. One card per campaign showing:
- Campaign name
- Daily cycle status (pending/confirmed/generating/complete)
- Creators: X posting, Y resting, Z paused
- Content warnings count
- Quick confirm button if status is pending

**API calls:**
- `GET /api/campaigns`
- `GET /api/{campaign}/plan/status` (for each)
- `GET /api/{campaign}/content-levels` (for each)

### 2. Plan Editor (`/{campaign}/plan/{date}`)

The main screen. This is what opens from the Slack "Edit Plan" button.

**Layout (mobile, top to bottom):**

**Header:**
- Campaign name, target date
- Confirmation status badge (pending/confirmed/etc)
- Time remaining until auto-confirm (countdown)

**Plan Groups:**
- Card per group showing: name, content type (dropdown), region filter (dropdown), count (number input)
- "Add Group" button
- Swipe-to-delete or remove button per group
- "Reset to Default" button

**Live Preview:**
- Updates as you edit groups (debounced)
- Summary bar: X posting, Y resting, Z paused
- Grouped creator list showing each creator's assignment
- Color-coded by group

**Content Warnings:**
- Inline below the preview
- Red for exhausted, yellow for low
- Shows which text types are affected

**Actions (sticky bottom bar):**
- [Confirm] — primary action
- [Confirm with Refresh] — if plan was modified

**API calls:**
- `GET /api/{campaign}/config` — populate content type and region dropdowns
- `GET /api/{campaign}/plan` — load current groups
- `GET /api/{campaign}/plan/status` — confirmation state + countdown
- `GET /api/{campaign}/plan/preview?date={date}` — live preview (called on each edit)
- `GET /api/{campaign}/content-levels` — warnings
- `POST /api/{campaign}/plan/set` — on group edit
- `POST /api/{campaign}/plan/remove-group` — on group delete
- `POST /api/{campaign}/plan/reset` — on reset
- `POST /api/{campaign}/plan/confirm` — with `{"refresh": true}` if plan was modified

### 3. Creator List (`/{campaign}/creators`)

All creators with region, active status, and quick actions.

**Layout:**
- Searchable/filterable list
- Filter by region, active/paused
- Each row: name, region, status badge
- Tap to expand: pause/resume button

**API calls:**
- `GET /api/{campaign}/creators`
- `POST /api/{campaign}/creators/{name}/pause`
- `POST /api/{campaign}/creators/{name}/resume`

### 4. History (`/{campaign}/history`)

Browse past daily cycle results.

**Layout:**
- Date list with summary (posted/failed/resting counts)
- Tap a date for detail view: per-creator results, plan snapshot, failures with error messages
- Visual indicator for plan changes between days

**API calls:**
- `GET /api/{campaign}/history?days=14`
- `GET /api/{campaign}/history?date={date}` (on date tap)

### 5. Content Levels (`/{campaign}/content`)

Text pack health across all creators.

**Layout:**
- Summary: X exhausted, Y low, Z healthy
- Grouped by text type
- Each entry shows creator, pack, remaining count
- Color-coded: red (0), yellow (1-threshold), green (above)

**API calls:**
- `GET /api/{campaign}/config` — for threshold value
- `GET /api/{campaign}/content-levels`

### 6. Campaign Overview (`/{campaign}`)

Single campaign summary with links to sub-pages.

**Layout:**
- Daily cycle status card (with confirm button if pending)
- Today's posting summary
- Content warnings summary
- Recent history (last 3 days)
- Orchestrator health
- Navigation to: Plan Editor, Creators, History, Content

**API calls:**
- `GET /api/{campaign}/config`
- `GET /api/{campaign}/plan/status`
- `GET /api/{campaign}/plan/preview`
- `GET /api/{campaign}/content-levels`
- `GET /api/{campaign}/history?days=3`
- `GET /api/orchestrator/status`

## Design Notes

### Mobile-First

- The plan editor is the most-used screen and must work well on a phone
- Large touch targets for buttons and dropdowns
- Sticky bottom action bar for Confirm
- Minimal scrolling to reach the confirm button
- Preview collapses to summary counts on small screens, expandable for detail

### Real-Time Updates

- Poll `plan/status` every 30s on the plan editor page to update the countdown and catch auto-confirm
- If another user confirms while you're editing, show a toast notification

### API Proxy

Next.js API routes (`/api/*`) proxy requests to the pipeline API server. This keeps the API key server-side and avoids CORS in production:

```
Browser → Next.js /api/unlove/plan → Pipeline API :5000/api/unlove/plan
```

The pipeline API's CORS support is there for local development.

### Authentication

The webapp itself can use any auth (NextAuth, simple password, etc). The pipeline API key is stored as a server-side env var in the Next.js app and never exposed to the browser.

## Build Order

1. API proxy setup + campaign dashboard
2. Plan editor with group management
3. Live preview integration
4. Confirm flow with countdown
5. Creator list with pause/resume
6. Content levels page
7. History browser
8. Mobile polish + PWA support
