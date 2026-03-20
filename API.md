# Content Pipeline REST API

Base URL: `http://localhost:5000`

## Authentication

Set `API_KEYS` env var with comma-separated keys. If unset, auth is disabled.

```
API_KEYS=slack-bot-key,dashboard-key python api.py
```

All requests require:
```
Authorization: Bearer <key>
```

Returns `401` if invalid:
```json
{"error": "Unauthorized"}
```

---

## Campaigns

### GET /api/campaigns

List all available campaigns.

**Response:**
```json
{
  "campaigns": ["unlove", "focus-app"]
}
```

---

### GET /api/{campaign}/config

Campaign configuration metadata. Use this to populate dropdowns, display settings, and validate inputs.

**Response:**
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

---

## Plan

### GET /api/{campaign}/plan

Current plan and paused creators.

**Response:**
```json
{
  "campaign": "unlove",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:20:00",
    "groups": [
      {"name": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST"},
      {"name": "default", "content_types": ["meme"]}
    ]
  },
  "paused_creators": ["vanessa-a"]
}
```

The length of `content_types` determines the posts per day for that group. For example, `["meme", "demo-reframe"]` means 2 posts/day (one of each type).

---

### POST /api/{campaign}/plan/set

Add or update a plan group.

**Body:**
```json
{
  "content_types": ["meme", "demo-reframe-check-social-media"],
  "region": "EST",
  "count": 5,
  "group": "est-mixed"
}
```

| Field | Required | Description |
|---|---|---|
| `content_types` | Yes | List of content type names. Length = posts per day for this group. |
| `region` | No | Filter creators by region (`"EST"`, `"AEST"`, `"CET"`) |
| `count` | No | Limit number of creators in this group |
| `group` | No | Group name (defaults to first content type name, or `"default"`) |

**Response:**
```json
{
  "message": "Updated group 'est-mixed'",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:25:00",
    "groups": [
      {"name": "est-mixed", "content_types": ["meme", "demo-reframe-check-social-media"], "region": "EST", "count": 5},
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### POST /api/{campaign}/plan/remove-group

Remove a specific group from the plan.

**Body:**
```json
{"group": "est-meme"}
```

**Response:**
```json
{
  "message": "Removed group 'est-meme'",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:30:00",
    "groups": [
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### POST /api/{campaign}/plan/reset

Reset to campaign default plan.

**Response:**
```json
{
  "message": "Plan reset to default",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:30:00",
    "groups": [
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### GET /api/{campaign}/plan/preview

Preview tomorrow's creator assignments with the current plan.

**Query params:**
- `date` (optional): `YYYY-MM-DD`, defaults to tomorrow

**Response:**
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
      {"creator": "alice-c", "group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"},
      {"creator": "jess-w", "group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"}
    ],
    "default": [
      {"creator": "abby-m", "group": "default", "content_types": ["meme"], "region": "AEST", "action": "post"}
    ],
    "rest": [
      {"creator": "brooke-p", "group": "rest", "content_types": [], "region": "AEST", "action": "rest"}
    ],
    "paused": [
      {"creator": "vanessa-a", "group": "paused", "content_types": [], "region": "AEST", "action": "paused"}
    ]
  },
  "assignments": {
    "abby-m": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post"},
    "alice-c": {"group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"},
    "brooke-p": {"group": "rest", "content_types": [], "region": "AEST", "action": "rest"},
    "vanessa-a": {"group": "paused", "content_types": [], "region": "AEST", "action": "paused"}
  }
}
```

---

## Daily Cycle Confirmation

### GET /api/{campaign}/plan/status

Current daily cycle confirmation state.

**Response (pending):**
```json
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
```

**Possible statuses:** `pending`, `confirmed`, `auto_confirmed`, `generating`, `complete`, `complete_with_failures`, `failed`

**Response (no active cycle):**
```json
{
  "status": "none",
  "message": "No active daily cycle state"
}
```

---

### POST /api/{campaign}/plan/confirm

Confirm the pending plan. Orchestrator picks it up on next pass (~60s).

**Body (optional):**
```json
{"refresh": true}
```

Use `refresh: true` after adjusting the plan to re-resolve assignments with the updated groups.

**Response (success):**
```json
{"message": "Confirmed plan for 2026-03-19"}
```

**Response (not pending):**
```json
{"error": "Status is 'complete', not 'pending'"}
```

---

## Creators

### GET /api/{campaign}/creators

List all creators with region and active status.

**Response:**
```json
{
  "campaign": "unlove",
  "creators": [
    {"name": "abby-m", "region": "AEST", "active": true},
    {"name": "alice-c", "region": "EST", "active": true},
    {"name": "vanessa-a", "region": "AEST", "active": false}
  ]
}
```

---

### POST /api/{campaign}/creators/{name}/pause

Pause a creator. They'll be excluded from future daily cycles.

**Response:**
```json
{"message": "Paused 'vanessa-a'"}
```

---

### POST /api/{campaign}/creators/{name}/resume

Resume a paused creator.

**Response:**
```json
{"message": "Resumed 'vanessa-a'"}
```

---

## History

### GET /api/{campaign}/history

Recent daily cycle history summaries.

**Query params:**
- `days` (optional): number of recent days, default `7`
- `date` (optional): specific date `YYYY-MM-DD` for full detail

**Response (summary list):**
```json
{
  "campaign": "unlove",
  "history": [
    {
      "date": "2026-03-18",
      "summary": {
        "total": 30,
        "posted": 22,
        "failed": 1,
        "resting": 7,
        "by_group": {
          "default": {"total": 23, "posted": 22, "failed": 1},
          "rest": {"total": 7, "posted": 0, "failed": 0}
        }
      },
      "plan_snapshot": {
        "groups": [{"name": "default", "content_types": ["meme"]}]
      }
    }
  ]
}
```

**Response (single date detail — `?date=2026-03-18`):**
```json
{
  "date": "2026-03-18",
  "campaign": "unlove",
  "plan_snapshot": {
    "groups": [{"name": "default", "content_types": ["meme"]}]
  },
  "assignments": {
    "abby-m": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post", "status": "posted", "scheduled": 2},
    "brooke-p": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post", "status": "failed", "error": "generation failed"},
    "chloe-b": {"group": "rest", "content_types": [], "region": "AEST", "action": "rest", "status": "rest"}
  },
  "summary": {
    "total": 30,
    "posted": 22,
    "failed": 1,
    "resting": 7,
    "by_group": {
      "default": {"total": 23, "posted": 22, "failed": 1}
    }
  }
}
```

---

## Content Levels

### GET /api/{campaign}/content-levels

Check text pack content levels across all creators.

**Query params:**
- `threshold` (optional): override the campaign's `content_low_threshold` (default: `posts_per_day * 4`)

**Response:**
```json
{
  "campaign": "unlove",
  "threshold": 8,
  "exhausted": [
    {"creator": "jess-w", "text_pack": "campaigns/unlove/assets/text/pack-3", "text_type": "demo-reframe-check-social-media", "remaining": 0}
  ],
  "low": [
    {"creator": "chloe-b", "text_pack": "campaigns/unlove/assets/text/pack-1", "text_type": "demo", "remaining": 3},
    {"creator": "emma-h", "text_pack": "campaigns/unlove/assets/text/pack-2", "text_type": "meme", "remaining": 7}
  ],
  "total_issues": 3
}
```

---

## Failures

### GET /api/{campaign}/failures

List open (unacknowledged) post failures. Failures are detected by the orchestrator's hourly check and deduplicated — each failure appears only once.

**Response:**
```json
{
  "campaign": "unlove",
  "failures": [
    {
      "post_bridge_id": "pb_abc123",
      "platform": "tiktok",
      "creator": "alice-c",
      "media_id": "5",
      "error": "File access error: content no longer available",
      "error_category": "content_rejected",
      "scheduled_at": "2026-03-18T14:00:00+00:00",
      "detected_at": "2026-03-18T15:00:05",
      "status": "open"
    }
  ],
  "count": 1
}
```

---

### POST /api/{campaign}/failures/{failure_key}/acknowledge

Acknowledge (dismiss) a single failure. The `failure_key` is `{post_bridge_id}:{platform}` (e.g., `pb_abc123:tiktok`). Acknowledged failures will not re-appear.

**Response (success):**
```json
{"message": "Acknowledged 'pb_abc123:tiktok'"}
```

**Response (not found):**
```json
{"error": "Failure 'pb_abc123:tiktok' not found in open failures"}
```

---

### POST /api/{campaign}/failures/acknowledge-all

Acknowledge all open failures at once.

**Response:**
```json
{"message": "Acknowledged 3 failures", "count": 3}
```

---

## Orchestrator Status

### GET /api/orchestrator/status

Orchestrator daemon state. Useful for monitoring whether the daemon is alive and healthy.

**Response:**
```json
{
  "last_main_run": "2026-03-18T20:00:05",
  "last_main_run_minutes_ago": 15,
  "last_deep_run": "2026-03-18T18:00:02",
  "last_deep_run_minutes_ago": 135,
  "total_runs": 47,
  "last_errors": [
    "[unlove] 2 failed posts detected"
  ],
  "creator_status": {
    "unlove/abby-m": {
      "last_deep_check": "2026-03-18T18:00:02",
      "status": "healthy",
      "max_posts_possible": 24,
      "days_available": 12
    },
    "unlove/brooke-p": {
      "last_deep_check": "2026-03-18T18:00:02",
      "status": "warning",
      "max_posts_possible": 6,
      "days_available": 3
    }
  }
}
```

If `last_main_run_minutes_ago` exceeds 120, the orchestrator is likely down.

---

## Error Responses

All errors follow the same format:

```json
{"error": "Description of what went wrong"}
```

| Status | Meaning |
|---|---|
| 400 | Bad request (missing/invalid params) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Campaign, creator, or resource not found |
| 500 | Server error |
